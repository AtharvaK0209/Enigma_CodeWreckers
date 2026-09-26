import express from 'express';
import historyService from '../services/historyService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/history
 * Returns the scan history for the current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const history = await historyService.getByUserId(userId, 30);
    res.json(history);
  } catch (err) {
    console.error('[History Route] Error fetching history:', err);
    res.status(500).json({ error: 'Failed to retrieve history', details: err.message });
  }
});

/**
 * DELETE /api/history
 * Clears scan history
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.userId;
    const result = await historyService.deleteByUserId(userId);
    res.json({ message: 'History cleared successfully', ...result });
  } catch (err) {
    console.error('[History Route] Error clearing history:', err);
    res.status(500).json({ error: 'Failed to clear history', details: err.message });
  }
});

export default router;
