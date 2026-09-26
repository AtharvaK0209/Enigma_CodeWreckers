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
  userId = 'demo-user-123',
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

  // 3. Persist scan history entry (Mission 3 & 8 requirement)
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
    console.log(`[Pipeline] Scan history successfully saved for user: ${userId}, method: ${method}, product: ${evaluated.product.name}`);
  } catch (err) {
    console.error(`[Pipeline] Failed to save scan history: ${err.message}`);
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
      const cleanCode = (barcode || '').trim();
      const userId = req.userId;

      if (!cleanCode) {
        return res.status(400).json({ error: 'Barcode parameter is required.' });
      }

      // Mission 1 & 2: Identify user and fetch real Mongo profile
      let profile = null;
      if (userId) {
        const dbUser = await UserModel.findById(userId);
        if (dbUser) profile = dbUser;
      }
      if (!profile && userProfile && Object.keys(userProfile).length > 0) {
        profile = userProfile;
      }
      if (!profile) {
        return res.status(401).json({ error: 'Authentication required. Please sign in to analyze products.' });
      }

      // Mission 3: Fetch real canonical product from Open Food Facts
      const canonicalProduct = await productApiService.getByBarcode(cleanCode);

      // Mission 5: Barcode not found handling with exact required copy
      if (!canonicalProduct) {
        return res.status(404).json({
          code: 'BARCODE_NOT_FOUND',
          barcode: cleanCode,
          error: "We couldn't find this barcode in Open Food Facts.",
        });
      }

      // Mission 7: Normalize canonical OFF product with Risk Knowledge Base (RKB)
      const normalizedProduct = normalizeWithRKB(canonicalProduct);

      const result = await runPipeline({
        rawProduct: normalizedProduct,
        userProfile: profile,
        userId: userId || profile.id || profile._id || 'demo-user-123',
        method: 'barcode',
        source: 'off',
      });

      // Attach canonical product for Mission 6 "Product Information — Open Food Facts" UI
      result.canonicalProduct = canonicalProduct;

      res.json(result);
    } catch (err) {
      console.error('[analysisController] Barcode analysis error:', err);
      res.status(500).json({ error: 'Internal analysis error', details: err.message });
    }
  },

  /**
   * POST /api/analyze/image
   */
  async analyzeImage(req, res) {
    try {
      const { image, userProfile, forceUnreadable, productKey } = req.body;
      const userId = req.userId || 'demo-user-123';

      if (!image && !forceUnreadable) {
        return res.status(400).json({ error: 'Image data (base64) is required.' });
      }

      if (forceUnreadable || (typeof image === 'string' && image.includes('SIMULATE_BLURRY_IMAGE'))) {
        return res.status(422).json({
          code: 'IMAGE_UNREADABLE',
          error: 'Image too blurry or poorly lit. The ingredient panel could not be transcribed.',
        });
      }

      // Vision / OCR simulation with sample product fallback
      const sampleKey = productKey || '8000500310427';
      const baseProduct = await productApiService.getByBarcode(sampleKey);

      let profile = userProfile;
      if (!profile || Object.keys(profile).length === 0) {
        const dbUser = await UserModel.findById(userId);
        if (dbUser) profile = dbUser;
      }

      const result = await runPipeline({
        rawProduct: { ...baseProduct, source: 'image' },
        userProfile: profile,
        userId,
        method: 'image',
        source: 'image',
        forcedDataQuality: 'partial',
      });

      res.json(result);
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
      const userId = req.userId || 'demo-user-123';
      const cleanQ = (query || '').trim();

      if (!cleanQ) {
        return res.json([]);
      }

      const matches = await productApiService.searchFood(cleanQ);

      let profile = userProfile;
      if (!profile || Object.keys(profile).length === 0) {
        const dbUser = await UserModel.findById(userId);
        if (dbUser) profile = dbUser;
      }

      // If at least one match, run top match through pipeline so history write occurs for search
      if (matches.length > 0) {
        // Save the top searched item into history as required by Mission 3
        const topResult = await runPipeline({
          rawProduct: matches[0],
          userProfile: profile,
          userId,
          method: 'search',
          source: 'off',
        });

        // Evaluate remaining matches without duplicate history writes
        const remainingResults = matches.slice(1).map((m) =>
          evaluateProductSafety(m, profile, 'good')
        );

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
