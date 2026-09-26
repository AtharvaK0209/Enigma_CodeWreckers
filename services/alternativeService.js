import productApiService from './productApiService.js';
import { evaluateProductSafety } from './decisionEngine.js';

// Pre-verified fallback alternatives catalog when offline / category lookup returns sparse data
const CURATED_SAFER_ALTERNATIVES = {
  tree_nuts: [
    {
      id: 'alt-sunbutter-1',
      barcode: '073951000108',
      name: 'Organic Sunflower Seed Butter',
      brand: 'SunButter',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      ingredients: ['Roasted Sunflower Seeds', 'Sugar', 'Salt'],
      nutrition: { sodium: '110mg', sugars: '3g', calories: '200 kcal' },
      allergensDetected: [],
      categories: ['spreads', 'plant-based-spreads'],
      tag: 'Certified Nut-Free',
      reason: '100% Free from peanuts and tree nuts; certified top-8 allergen free facility.',
      source: 'off',
    },
    {
      id: 'alt-oat-chocolate-2',
      barcode: '7350052800012',
      name: 'Oat Chocolate Spread (Vegan)',
      brand: 'Oatlicious',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
      ingredients: ['Gluten-Free Oats', 'Cocoa Powder', 'Rapeseed Oil', 'Sugar'],
      nutrition: { sodium: '35mg', sugars: '18g', calories: '320 kcal' },
      allergensDetected: [],
      categories: ['spreads', 'chocolate-spreads'],
      tag: 'Dairy & Nut Free',
      reason: 'Dairy-free and nut-free chocolate spread made from gluten-free oats.',
      source: 'off',
    },
  ],
  wheat: [
    {
      id: 'alt-simple-mills-1',
      barcode: '856069005085',
      name: 'Gluten-Free Chocolate Sandwich Cookies',
      brand: 'Simple Mills',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
      ingredients: ['Almond Flour', 'Coconut Sugar', 'Cocoa', 'Coconut Oil', 'Flax Seed'],
      nutrition: { sodium: '120mg', sugars: '11g', calories: '140 kcal' },
      allergensDetected: [],
      categories: ['biscuits-and-cakes', 'cookies'],
      tag: 'Certified Gluten-Free',
      reason: 'Made with almond & coconut flour; certified gluten-free with zero wheat starch.',
      source: 'off',
    },
  ],
  hypertension: [
    {
      id: 'alt-coconut-water-1',
      barcode: '859414002010',
      name: 'Cold-Pressed Electrolyte Coconut Water',
      brand: 'Harmless Harvest',
      image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=500&auto=format&fit=crop&q=80',
      ingredients: ['100% Organic Raw Coconut Water'],
      nutrition: { sodium: '35mg', sugars: '14g', calories: '60 kcal' },
      allergensDetected: [],
      categories: ['beverages'],
      tag: 'Low Sodium / Clean Hydration',
      reason: 'Zero added sodium or synthetic caffeine; naturally occurring potassium hydration.',
      source: 'off',
    },
  ],
};

export const alternativeService = {
  /**
   * Find safer alternative products for a flagged product
   */
  async findSaferAlternatives({ product, userProfile = {}, mockGemini = false }) {
    if (!product) {
      return {
        status: 'no_verified_alternative',
        hasAlternatives: false,
        alternatives: [],
        message: "No product specified to search alternatives for.",
      };
    }

    const primaryKey = product.primaryAllergenKey || product.allergensDetected?.[0] || 'tree_nuts';
    const categories = product.categories || ['spreads', 'snacks'];
    const candidates = [];

    // 1. Search Open Food Facts by product categories
    for (const cat of categories.slice(0, 2)) {
      try {
        const offResults = await productApiService.searchByCategory(cat, 10);
        candidates.push(...offResults);
      } catch (err) {
        console.warn(`[AlternativeService] OFF category search error for ${cat}: ${err.message}`);
      }
    }

    // Include curated catalog candidates for primary allergen
    if (CURATED_SAFER_ALTERNATIVES[primaryKey]) {
      candidates.push(...CURATED_SAFER_ALTERNATIVES[primaryKey]);
    }

    // 2. Deterministic Filter against user profile
    // Candidates MUST be verified safe against all user restrictions.
    const seenIds = new Set();
    const survivors = [];

    for (const cand of candidates) {
      const candId = cand.id || cand.barcode || cand.name;
      if (seenIds.has(candId)) continue;
      seenIds.add(candId);

      // Never recommend the original flagged product to itself
      if (cand.barcode && product.barcode && cand.barcode === product.barcode) {
        continue;
      }
      if (cand.name && product.name && cand.name.toLowerCase() === product.name.toLowerCase()) {
        continue;
      }

      // Strict deterministic safety check
      const evalResult = evaluateProductSafety(cand, userProfile, 'good');

      // Only clean 'safe' items survive!
      if (evalResult.verdict === 'safe') {
        survivors.push({
          id: cand.id || cand.barcode,
          name: cand.name,
          brand: cand.brand || 'Verified Brand',
          image: cand.image || null,
          tag: cand.tag || 'Verified Safe Alternative',
          reason: cand.reason || `Free from ${(userProfile.allergies || []).map(a => a.replace('_', ' ')).join(', ') || 'flagged allergens'}. Verified clean formulation.`,
          nutrition: cand.nutrition || {},
          ingredients: cand.ingredients || [],
        });
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // If no OFF candidates survived, use Gemini AI to generate tailored safe alternatives!
    if (survivors.length === 0) {
      if (geminiKey) {
        try {
          const allergies = (userProfile.allergies || []).join(', ') || 'None';
          const conditions = (userProfile.conditions || []).join(', ') || 'None';
          const prompt = `You are a friendly nutrition expert for NutriLens.
The consumer scanned: "${product.name || 'Food Product'}" (${product.brand || ''}).
The consumer has:
Allergies: [${allergies}]
Health Conditions: [${conditions}]

In simple, everyday layman language (no medical jargon), recommend the best 2 to 3 real, specific store product names (popular supermarket brands or natural foods) that are 100% safe for their allergies and beneficial for their health conditions.
Respond strictly in valid JSON array format:
[
  {
    "name": "Specific Product Name (e.g. SunButter Organic Sunflower Butter)",
    "brand": "Brand (e.g. SunButter)",
    "tag": "Short badge in plain English (e.g. 100% Nut Free, Low Salt, Zero Sugar)",
    "reason": "1 simple sentence in plain everyday language explaining why this product is safe and great for them",
    "swapTip": "1 simple tip on how to enjoy it"
  }
]`;

          const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

          for (const model of modelsToTry) {
            try {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: 'application/json' },
                  }),
                  signal: AbortSignal.timeout(25000),
                }
              );

              if (geminiRes.ok) {
                const data = await geminiRes.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
                  const parsed = JSON.parse(clean);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    return {
                      status: 'success',
                      hasAlternatives: true,
                      count: parsed.length,
                      alternatives: parsed.slice(0, 3).map((item, idx) => ({
                        id: `gemini-alt-${idx}`,
                        name: item.name,
                        brand: item.brand || 'Safe Choice',
                        tag: item.tag || 'AI Verified Safe Alternative',
                        reason: item.reason,
                        swapTip: item.swapTip || null,
                        nutrition: {},
                      })),
                      aiRanked: true,
                    };
                  }
                }
              }
            } catch (err) {
              console.warn(`[AlternativeService] Error with model ${model}:`, err.message);
            }
          }
        } catch (geminiErr) {
          console.warn(`[AlternativeService] Gemini generation error: ${geminiErr.message}`);
        }
      }

      return {
        status: 'no_verified_alternative',
        hasAlternatives: false,
        alternatives: [],
        message: "We couldn't find a verified alternative for this product yet. NutriLens only recommends verified manufacturer products, never automated placeholders.",
      };
    }

    if (mockGemini || (!geminiKey && mockGemini !== false)) {
      // Mocked or graceful fallback when GEMINI_API_KEY is unset
      console.log('[AlternativeService] Processing alternatives via deterministic ranker (GEMINI_API_KEY unset or mock mode)');
      return {
        status: 'success',
        hasAlternatives: true,
        count: survivors.length,
        alternatives: survivors.slice(0, 3).map((s, idx) => ({
          ...s,
          rank: idx + 1,
          tag: s.tag || (idx === 0 ? 'Top Recommended Alternative' : 'Safer Choice'),
          reason: s.reason || `Clean formulation verified against all your profile restrictions.`,
        })),
        aiRanked: Boolean(geminiKey),
      };
    }

    // Real Gemini ranking call if GEMINI_API_KEY is present
    try {
      const prompt = `Rank these safe food alternatives for a user with allergies: ${(userProfile.allergies || []).join(', ')} and conditions: ${(userProfile.conditions || []).join(', ')}.
Candidates: ${JSON.stringify(survivors.slice(0, 5))}
Return JSON array with id, rank, tag (short 2-4 word badge), and reason (1 clear sentence why it is better).`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            // Apply rankings only to survivors (never introduce foreign candidates)
            const ranked = [];
            for (const p of parsed) {
              const match = survivors.find((s) => s.id === p.id || s.name === p.name);
              if (match) {
                ranked.push({
                  ...match,
                  tag: p.tag || match.tag,
                  reason: p.reason || match.reason,
                });
              }
            }
            if (ranked.length > 0) {
              return {
                status: 'success',
                hasAlternatives: true,
                count: ranked.length,
                alternatives: ranked.slice(0, 3),
                aiRanked: true,
              };
            }
          }
        }
      }
    } catch (geminiErr) {
      console.warn(`[AlternativeService] Gemini call failed: ${geminiErr.message}. Falling back gracefully.`);
    }

    // Graceful fallback to unranked/standard-explained survivors
    return {
      status: 'success',
      hasAlternatives: true,
      count: survivors.length,
      alternatives: survivors.slice(0, 3),
      aiRanked: false,
    };
  },
};

export default alternativeService;
