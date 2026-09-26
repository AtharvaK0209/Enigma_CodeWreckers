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
   * POST /api/analyze/image
   * Honest implementation when multimodal Gemini vision is unavailable (Requirement 10)
   */
  async analyzeImage(req, res) {
    try {
      const { image, forceUnreadable } = req.body;

      if (!image && !forceUnreadable) {
        return res.status(400).json({ error: 'Image data (base64) is required.' });
      }

      if (forceUnreadable || (typeof image === 'string' && image.includes('SIMULATE_BLURRY_IMAGE'))) {
        return res.status(422).json({
          code: 'IMAGE_UNREADABLE',
          error: 'Image too blurry or poorly lit. The ingredient panel could not be transcribed.',
        });
      }

      // Honest declaration when image-based model is not configured (Requirement 10)
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
