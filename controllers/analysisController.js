import productApiService from '../services/productApiService.js';
import { fuseProductData } from '../services/fusionService.js';
import { evaluateProductSafety } from '../services/decisionEngine.js';
import historyService from '../services/historyService.js';
import UserModel from '../models/User.js';
import { normalizeWithRKB } from '../services/normalizationService.js';

/**
 * Helper to call Gemini 2.5 Flash for personalized health reason & dietary suggestion
 */
async function generateAiExplanation({ product, userProfile, verdict, findings, geminiKey }) {
  try {
    const allergies = (userProfile.allergies || []).join(', ') || 'None';
    const conditions = (userProfile.conditions || []).join(', ') || 'None';
    const findingsSummary = (findings || []).map((f) => `${f.headline} (${f.evidence})`).join('; ') || 'No critical conflicts';

    const ingredientsStr =
      product.ingredientsText ||
      (Array.isArray(product.ingredients)
        ? product.ingredients
            .map((i) => (typeof i === 'string' ? i : `${i.name || ''}${i.quantity ? ` (${i.quantity})` : ''}`))
            .join(', ')
        : 'Unspecified');

    const prompt = `You are a friendly, expert nutrition advisor for NutriLens.
Speak in simple, easy-to-understand layman language (no medical jargon, no complex scientific terms). Write like a caring friend giving clear, straightforward advice.

Evaluate this food product for this consumer:
Product Name: "${product.name || 'Unknown'}"
Brand: "${product.brand || 'Unknown'}"
Ingredients: "${ingredientsStr}"
Nutrition: ${JSON.stringify(product.nutrition || {})}
Consumer Profile:
- Allergies: [${allergies}]
- Health Conditions: [${conditions}]
Safety Verdict: "${verdict}"
Findings: ${findingsSummary}

Provide:
1. reason: In simple everyday layman language (1-2 sentences), explain clearly why this food is or isn't safe for them, pointing out the exact ingredients or sugar/salt levels in plain words.
2. suggestion: In simple everyday layman language (1-2 friendly sentences), give a practical, clear recommendation on what they should do (e.g. skip it, eat a tiny portion, or enjoy without worry).
3. alternatives: Give the best 2 to 3 real, specific alternative product names (well-known supermarket food brands or wholesome alternatives like "SunButter Organic Sunflower Butter", "Simple Mills Almond Flour Crackers", "Epigamia Greek Yogurt", "Britannia NutriChoice 5 Grain Biscuits", "Harmless Harvest Coconut Water") that are 100% safe for their allergies: [${allergies}] and conditions: [${conditions}].
Each alternative MUST include:
   - "name": The exact, real product name (e.g. "SunButter Sunflower Butter" or "Simple Mills Crackers")
   - "brand": Brand name (e.g. "SunButter")
   - "tag": Simple 2-3 word badge in plain English (e.g. "100% Nut Free", "Zero Added Sugar", "Low Salt Choice")
   - "reason": 1 simple sentence in layman terms explaining why this specific product is much safer and healthier for them
   - "swapTip": 1 simple, easy tip on how to enjoy or replace it

Respond strictly in valid JSON format:
{
  "reason": "...",
  "suggestion": "...",
  "alternatives": [
    {
      "name": "...",
      "brand": "...",
      "tag": "...",
      "reason": "...",
      "swapTip": "..."
    }
  ]
}`;

    const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
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

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
          }
        } else {
          console.warn(`[generateAiExplanation] Model ${model} returned ${res.status}`);
        }
      } catch (err) {
        console.warn(`[generateAiExplanation] Error with model ${model}:`, err.message);
      }
    }
  } catch (err) {
    console.warn('[Pipeline] generateAiExplanation error:', err.message);
  }
  return null;
}

function getDefaultAiExplanation(evaluated, userProfile) {
  const hasRisk = evaluated.verdict === 'risk';
  const hasCaution = evaluated.verdict === 'caution';
  const allergies = (userProfile.allergies || []).map((a) => a.replace(/_/g, ' '));
  const conditions = (userProfile.conditions || []).map((c) => c.replace(/_/g, ' '));

  if (hasRisk) {
    return {
      reason: `This food has ingredients or traces that aren't safe for your ${allergies.join(', ') || 'allergy'} profile.`,
      suggestion: `We recommend skipping this item and picking one of the safe alternatives below instead.`,
      alternatives: [
        {
          name: 'SunButter Sunflower Seed Butter',
          brand: 'SunButter',
          tag: '100% Nut Free',
          reason: 'Made in a certified peanut and tree nut-free facility, perfectly safe for you.',
          swapTip: 'Spread it on toast or fruit just like peanut butter.',
        },
        {
          name: 'Simple Mills Almond Flour Crackers',
          brand: 'Simple Mills',
          tag: 'Gluten-Free Choice',
          reason: 'Baked with wholesome seed and nut flours with zero artificial additives.',
          swapTip: 'Great for a crunchy, healthy afternoon snack.',
        },
      ],
    };
  }
  if (hasCaution) {
    return {
      reason: `This item has ingredients or higher salt and sugar levels that you should go easy on for your ${conditions.join(', ') || 'health'}.`,
      suggestion: `If you have it, enjoy just a small portion and balance it with water and fresh foods.`,
      alternatives: [
        {
          name: 'Harmless Harvest Organic Coconut Water',
          brand: 'Harmless Harvest',
          tag: 'Low Salt & Natural',
          reason: 'Naturally refreshing with no added sodium or synthetic chemicals.',
          swapTip: 'A great hydrating swap for soda or sugary juices.',
        },
        {
          name: 'Epigamia Greek Yogurt (Plain)',
          brand: 'Epigamia',
          tag: 'Low Sugar & High Protein',
          reason: 'Packed with real protein and zero refined sugar spikes.',
          swapTip: 'Top with fresh berries or chia seeds for a delicious dessert.',
        },
      ],
    };
  }
  return {
    reason: `Good news! We checked all ingredients and nutritional facts, and they all look completely clean and safe for you.`,
    suggestion: `This item fits your dietary preferences nicely. Feel free to enjoy it!`,
    alternatives: [],
  };
}

/**
 * Common pipeline tail that all analysis entry points reach
 */
export async function runPipeline({
  rawProduct,
  userProfile = {},
  userId = null,
  method = 'barcode',
  forcedDataQuality = null,
  source = 'off',
  userConfirmedAllergens = null,
}) {
  // 1. Fuse signals into unified product representation
  const fusedProduct = fuseProductData({
    source,
    rawProduct,
    userConfirmedAllergens,
    forcedDataQuality,
  });

  // 2. Evaluate deterministic safety rules
  const evaluated = evaluateProductSafety(fusedProduct, userProfile, fusedProduct.dataQuality);

  // 3. Generate personalized AI Reason and Suggestion using Gemini 2.5 Flash
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      evaluated.aiExplanation = await generateAiExplanation({
        product: evaluated.product || rawProduct,
        userProfile,
        verdict: evaluated.verdict,
        findings: evaluated.findings,
        geminiKey,
      });
    } catch (err) {
      console.warn('[Pipeline] Gemini AI explanation error:', err.message);
    }
  }

  if (!evaluated.aiExplanation) {
    evaluated.aiExplanation = getDefaultAiExplanation(evaluated, userProfile);
  }

  if (evaluated.aiExplanation?.alternatives?.length) {
    evaluated.alternatives = evaluated.aiExplanation.alternatives;
  }

  // 4. Persist scan history entry if user is authenticated
  if (userId && userId !== 'guest') {
    try {
      await historyService.save({
        userId,
        product: evaluated.product,
        verdict: evaluated.verdict,
        verdictTitle: evaluated.verdictTitle,
        verdictSummary: evaluated.verdictSummary,
        dataQuality: evaluated.dataQuality,
        findings: evaluated.findings,
        method,
      });
      console.log(`[Pipeline] Scan history saved for user: ${userId}, method: ${method}, product: ${evaluated.product?.name}`);
    } catch (err) {
      console.error(`[Pipeline] Failed to save scan history: ${err.message}`);
    }
  }

  return evaluated;
}

export const analysisController = {
  /**
   * POST /api/analyze/barcode
   * Analyzes barcode against authenticated user's real profile and real Open Food Facts data
   */
  async analyzeBarcode(req, res) {
    try {
      const { barcode, userProfile } = req.body;
      const cleanCode = String(barcode || '').trim().replace(/[\r\n\t]/g, '');
      console.log(`[SCAN] backend received barcode: ${cleanCode}`);

      if (!cleanCode) {
        return res.status(400).json({
          success: false,
          found: false,
          error: 'BARCODE_NOT_RECEIVED',
          message: "Couldn't read the barcode. Please scan again.",
        });
      }

      // Identify user and fetch real profile
      const userId = req.userId;
      let profile = null;
      if (userId) {
        const dbUser = await UserModel.findById(userId);
        if (dbUser) profile = dbUser;
      }
      if (!profile && userProfile && Object.keys(userProfile).length > 0) {
        profile = userProfile;
      }
      if (!profile) {
        profile = { name: 'User', allergies: [], conditions: [] };
      }

      // Fetch real canonical product from Open Food Facts (Requirement 4 & 5)
      const offResult = await productApiService.getByBarcode(cleanCode);

      if (!offResult || !offResult.found || !offResult.product) {
        if (offResult?.error === 'OFF_RESULT_BARCODE_MISMATCH') {
          return res.status(422).json({
            success: false,
            found: false,
            error: 'OFF_RESULT_BARCODE_MISMATCH',
            message: 'Scanned barcode did not match Open Food Facts catalog entry.',
          });
        }

        return res.status(404).json({
          success: false,
          found: false,
          code: 'BARCODE_NOT_FOUND',
          barcode: cleanCode,
          error: 'Product not found in Open Food Facts.',
        });
      }

      const canonicalProduct = offResult.product;

      // Normalize canonical OFF product with Risk Knowledge Base (RKB)
      const normalizedProduct = normalizeWithRKB(canonicalProduct);

      const result = await runPipeline({
        rawProduct: normalizedProduct,
        userProfile: profile,
        userId: userId || profile.id || profile._id,
        method: 'barcode',
        source: 'off',
      });

      // Attach canonical product for Results screen & OffProductInfo
      result.canonicalProduct = canonicalProduct;

      res.json(result);
    } catch (err) {
      console.error('[analysisController] Barcode analysis error:', err);
      res.status(500).json({ error: 'Internal analysis error', details: err.message });
    }
  },

  /**
   * Helper: call Gemini Vision to extract product details from packaging/label photo
   */
  async _extractWithGeminiVision(rawImage, geminiKey) {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof rawImage === 'string' && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      const imgRes = await fetch(rawImage, { signal: AbortSignal.timeout(6000) });
      const buf = await imgRes.arrayBuffer();
      base64Data = Buffer.from(buf).toString('base64');
      const ct = imgRes.headers.get('content-type');
      if (ct && ct.includes('png')) mimeType = 'image/png';
      else if (ct && ct.includes('webp')) mimeType = 'image/webp';
    } else if (typeof rawImage === 'string' && rawImage.includes(';base64,')) {
      const parts = rawImage.split(';base64,');
      const mimeMatch = parts[0].match(/:(.*?)$/);
      if (mimeMatch) mimeType = mimeMatch[1];
      base64Data = parts[1];
    } else if (typeof rawImage === 'string') {
      base64Data = rawImage;
    }

    if (!base64Data) return null;

    const prompt = `You are an expert food label OCR and nutritional analysis AI for NutriLens. Inspect this food packaging or label image.
Examine the ingredients list and the nutrition facts table carefully.
Extract:
1. barcode: The numerical barcode digits if visible on the packaging (or null if not visible).
2. productName: The name of the food product.
3. brand: The brand name of the manufacturer/product (or null).
4. ingredientsText: The complete verbatim ingredients list text as printed on the packaging.
5. ingredients: An array of each individual ingredient with its percentage or quantity if specified on the label, e.g. [{"name": "hazelnut paste", "quantity": "18.5%"}, {"name": "cocoa powder", "quantity": "6.5%"}]. If no specific quantity is stated on the label, set quantity to null.
6. nutrition: Extract the numeric values per 100g (or per serving) from the nutrition facts table:
   {
     "energy": number or null,
     "carbohydrates": number or null,
     "sugars": number or null,
     "fiber": number or null,
     "protein": number or null,
     "fat": number or null,
     "saturatedFat": number or null,
     "transFat": number or null,
     "sodium": number or null
   }
7. servingSize: The serving size string if visible on the label (or null).
8. allergens: An array of allergen strings declared or visible on the package (e.g. ["milk", "soybeans", "gluten"]).
9. isUnreadable: true ONLY if the image does not show food packaging or is completely illegible.

Respond strictly in valid JSON:
{
  "barcode": null,
  "productName": "string or null",
  "brand": "string or null",
  "ingredientsText": "string or null",
  "ingredients": [ { "name": "string", "quantity": "string or null" } ],
  "nutrition": {
    "energy": null,
    "carbohydrates": null,
    "sugars": null,
    "fiber": null,
    "protein": null,
    "fat": null,
    "saturatedFat": null,
    "transFat": null,
    "sodium": null
  },
  "servingSize": null,
  "allergens": [],
  "isUnreadable": false
}`;

    const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: base64Data } },
                  ],
                },
              ],
              generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: AbortSignal.timeout(25000),
          }
        );

        if (!res.ok) {
          console.warn(`[GeminiVision] Model ${model} returned ${res.status}`);
          continue;
        }

        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
      } catch (err) {
        console.warn(`[GeminiVision] Error with model ${model}:`, err.message);
      }
    }

    return null;
  },

  /**
   * POST /api/analyze/image
   * Multimodal Gemini Vision label OCR + OFF catalog pipeline (Requirement 10)
   */
  async analyzeImage(req, res) {
    try {
      const { image, imageBase64, userProfile, forceUnreadable } = req.body;
      const rawImage = image || imageBase64;
      const userId = req.userId;

      if (!rawImage && !forceUnreadable) {
        return res.status(400).json({ error: 'Image data (base64) is required.' });
      }

      if (forceUnreadable || (typeof rawImage === 'string' && rawImage.includes('SIMULATE_BLURRY_IMAGE'))) {
        return res.status(422).json({
          code: 'IMAGE_UNREADABLE',
          error: 'Image too blurry or poorly lit. The ingredient panel could not be transcribed.',
        });
      }

      let profile = userProfile;
      if (!profile || Object.keys(profile).length === 0) {
        if (userId) {
          const dbUser = await UserModel.findById(userId);
          if (dbUser) profile = dbUser;
        }
      }
      if (!profile) {
        profile = { name: 'User', allergies: [], conditions: [] };
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      let visionData = null;

      if (geminiKey) {
        try {
          visionData = await analysisController._extractWithGeminiVision(rawImage, geminiKey);
        } catch (visionErr) {
          console.warn('[GeminiVision] Vision analysis failed:', visionErr.message);
        }
      }

      if (visionData?.isUnreadable && !visionData?.productName && !visionData?.barcode) {
        return res.status(422).json({
          code: 'IMAGE_UNREADABLE',
          error: 'The uploaded photo was too blurry or lacked legible ingredient text.',
        });
      }

      // Step A: If barcode was extracted from label, look up in Open Food Facts
      if (visionData?.barcode) {
        const cleanCode = String(visionData.barcode).trim().replace(/[\r\n\t]/g, '');
        const offResult = await productApiService.getByBarcode(cleanCode);
        if (offResult?.found && offResult.product) {
          const canonical = offResult.product;
          if (Array.isArray(visionData.ingredients) && visionData.ingredients.length > 0) {
            canonical.ingredients = visionData.ingredients;
          }
          const normalized = normalizeWithRKB(canonical);
          const result = await runPipeline({
            rawProduct: normalized,
            userProfile: profile,
            userId: userId || profile.id || profile._id,
            method: 'image',
            source: 'off',
          });
          result.canonicalProduct = canonical;
          return res.json(result);
        }
      }

      // Step B: If product name was identified from label, search Open Food Facts
      if (visionData?.productName) {
        const matches = await productApiService.searchFood(visionData.productName, 3);
        if (matches && matches.length > 0) {
          const bestMatch = matches[0];
          if (Array.isArray(visionData.ingredients) && visionData.ingredients.length > 0) {
            bestMatch.ingredients = visionData.ingredients;
          }
          const normalized = normalizeWithRKB(bestMatch);
          const result = await runPipeline({
            rawProduct: normalized,
            userProfile: profile,
            userId: userId || profile.id || profile._id,
            method: 'image',
            source: 'off',
          });
          result.canonicalProduct = bestMatch;
          return res.json(result);
        }
      }

      // Step C: If label text was directly extracted by Gemini Vision
      if (visionData?.productName || visionData?.ingredientsText || (Array.isArray(visionData?.ingredients) && visionData.ingredients.length > 0)) {
        const labelProduct = {
          source: 'image',
          barcode: visionData.barcode || null,
          name: visionData.productName || 'Scanned Food Product',
          brand: visionData.brand || '',
          imageUrl: typeof rawImage === 'string' && rawImage.startsWith('http') ? rawImage : null,
          images: {
            front: typeof rawImage === 'string' && rawImage.startsWith('http') ? rawImage : null,
            ingredients: null,
            nutrition: null,
            packaging: null,
          },
          ingredientsText: visionData.ingredientsText || '',
          ingredients: Array.isArray(visionData.ingredients) ? visionData.ingredients : [],
          allergens: Array.isArray(visionData.allergens) ? visionData.allergens : [],
          traces: [],
          servingSize: visionData.servingSize || null,
          nutrition: {
            energy: visionData.nutrition?.energy ?? null,
            carbohydrates: visionData.nutrition?.carbohydrates ?? null,
            sugars: visionData.nutrition?.sugars ?? null,
            fiber: visionData.nutrition?.fiber ?? null,
            protein: visionData.nutrition?.protein ?? null,
            fat: visionData.nutrition?.fat ?? null,
            saturatedFat: visionData.nutrition?.saturatedFat ?? null,
            transFat: visionData.nutrition?.transFat ?? null,
            sodium: visionData.nutrition?.sodium ?? null,
          },
        };

        const normalized = normalizeWithRKB(labelProduct);
        const result = await runPipeline({
          rawProduct: normalized,
          userProfile: profile,
          userId: userId || profile.id || profile._id,
          method: 'image',
          source: 'image',
          forcedDataQuality: 'partial',
        });
        result.canonicalProduct = labelProduct;
        return res.json(result);
      }

      // Step D: When image cannot be identified and no product text found
      return res.status(422).json({
        success: false,
        found: false,
        code: 'IMAGE_IDENTIFICATION_UNAVAILABLE',
        error: 'Product identification from image is unavailable.',
        message: 'Product identification from image is unavailable. Please scan the product barcode directly.',
      });
    } catch (err) {
      console.error('[analysisController] Image analysis error:', err);
      res.status(500).json({ error: 'Internal image analysis error', details: err.message });
    }
  },

  /**
   * POST /api/search or GET /api/search?q=...
   */
  async searchFood(req, res) {
    try {
      const query = req.query.q || req.body.query || '';
      const { userProfile } = req.body;
      const userId = req.userId;
      const cleanQ = String(query || '').trim();

      if (!cleanQ) {
        return res.json([]);
      }

      const matches = await productApiService.searchFood(cleanQ);

      let profile = userProfile;
      if (!profile || Object.keys(profile).length === 0) {
        if (userId) {
          const dbUser = await UserModel.findById(userId);
          if (dbUser) profile = dbUser;
        }
      }
      if (!profile) {
        profile = { name: 'User', allergies: [], conditions: [] };
      }

      if (matches.length > 0) {
        // Save the top searched item into history if authenticated
        const topNormalized = normalizeWithRKB(matches[0]);
        const topResult = await runPipeline({
          rawProduct: topNormalized,
          userProfile: profile,
          userId,
          method: 'search',
          source: 'off',
        });
        topResult.canonicalProduct = matches[0];

        // Evaluate remaining matches without duplicate history writes
        const remainingResults = matches.slice(1).map((m) => {
          const norm = normalizeWithRKB(m);
          const evalRes = evaluateProductSafety(norm, profile, 'good');
          evalRes.canonicalProduct = m;
          return evalRes;
        });

        return res.json([topResult, ...remainingResults]);
      }

      res.json([]);
    } catch (err) {
      console.error('[analysisController] Search error:', err);
      res.status(500).json({ error: 'Search failed', details: err.message });
    }
  },
};

export default analysisController;
