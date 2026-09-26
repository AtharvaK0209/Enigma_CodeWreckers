import express from 'express';
import analysisController from '../controllers/analysisController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/barcode', analysisController.analyzeBarcode);
router.post('/image', analysisController.analyzeImage);

export default router;
