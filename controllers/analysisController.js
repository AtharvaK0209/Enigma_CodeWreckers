import productApiService from '../services/productApiService.js';
import { fuseProductData } from '../services/fusionService.js';
import { evaluateProductSafety } from '../services/decisionEngine.js';
import historyService from '../services/historyService.js';
import UserModel from '../models/User.js';
import { normalizeWithRKB } from '../services/normalizationService.js';

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

  // 3. Persist scan history entry if user is authenticated
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
      const cleanCode = String(barcode || '').trim();
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

    const prompt = `You are a food label inspection assistant for NutriLens. Inspect this food packaging or label image.
Extract:
1. barcode: The numerical barcode digits if visible on the packaging (or null if not visible).
2. productName: The name of the food product.
3. brand: The brand name of the manufacturer/product (or null).
4. ingredientsText: The complete ingredients list text if visible on the label (or null).
5. allergens: An array of allergen strings declared or visible (e.g. ["milk", "soybeans"]).
6. isUnreadable: true ONLY if the image does not depict food packaging or is completely illegible.

Respond strictly in valid JSON:
{
  "barcode": null,
  "productName": "string or null",
  "brand": "string or null",
  "ingredientsText": "string or null",
  "allergens": [],
  "isUnreadable": false
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.warn(`[GeminiVision] API returned ${res.status}`);
      return null;
    }

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    try {
      return JSON.parse(rawText);
    } catch {
      return null;
    }
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
        const cleanCode = String(visionData.barcode).trim();
        const offResult = await productApiService.getByBarcode(cleanCode);
        if (offResult?.found && offResult.product) {
          const canonical = offResult.product;
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
      if (visionData?.productName || visionData?.ingredientsText) {
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
          allergens: Array.isArray(visionData.allergens) ? visionData.allergens : [],
          traces: [],
          servingSize: null,
          nutrition: {
            energy: null,
            carbohydrates: null,
            sugars: null,
            fiber: null,
            protein: null,
            fat: null,
            saturatedFat: null,
            transFat: null,
            sodium: null,
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
