import express from 'express';
import alternativeService from '../services/alternativeService.js';
import productApiService from '../services/productApiService.js';
import UserModel from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/alternatives
 * Find safer alternative products
 */
router.post('/', async (req, res) => {
  try {
    const { product, barcode, userProfile, mockGemini } = req.body;
    const userId = req.userId;

    let targetProduct = product;
    if (!targetProduct && barcode) {
      targetProduct = await productApiService.getByBarcode(barcode);
    }

    if (!targetProduct) {
      return res.status(400).json({
        status: 'no_verified_alternative',
        hasAlternatives: false,
        alternatives: [],
        message: 'No product provided to find alternatives for.',
      });
    }

    let profile = userProfile;
    if (!profile || Object.keys(profile).length === 0) {
      const dbUser = await UserModel.findById(userId);
      if (dbUser) profile = dbUser;
    }

    const result = await alternativeService.findSaferAlternatives({
      product: targetProduct,
      userProfile: profile,
      mockGemini,
    });

    res.json(result);
  } catch (err) {
    console.error('[Alternatives Route] Error finding alternatives:', err);
    res.status(500).json({ error: 'Failed to search alternatives', details: err.message });
  }
});

/**
 * GET /api/alternatives?barcode=...
 */
router.get('/', async (req, res) => {
  try {
    const barcode = req.query.barcode;
    const userId = req.userId;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode parameter is required.' });
    }

    const product = await productApiService.getByBarcode(barcode);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const dbUser = await UserModel.findById(userId);
    const result = await alternativeService.findSaferAlternatives({
      product,
      userProfile: dbUser || {},
    });

    res.json(result);
  } catch (err) {
    console.error('[Alternatives Route] Error finding alternatives:', err);
    res.status(500).json({ error: 'Failed to search alternatives', details: err.message });
  }
});

export default router;
