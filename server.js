import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isConnected } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import historyRoutes from './routes/history.js';
import analyzeRoutes from './routes/analyze.js';
import alternativesRoutes from './routes/alternatives.js';
import clarifyRoutes from './routes/clarify.js';
import analysisController from './controllers/analysisController.js';
import { authenticate } from './middleware/auth.js';
import { loadRiskKnowledgeBase } from './backend/knowledge/index.js';

dotenv.config();

// Load Risk Knowledge Base at startup (Mission 0 requirement)
loadRiskKnowledgeBase();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NutriLens Backend API',
    mongoConnected: isConnected(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/alternatives', alternativesRoutes);
app.use('/api/clarify', clarifyRoutes);

// Direct search endpoint (/api/search)
app.use('/api/search', authenticate, (req, res) => {
  analysisController.searchFood(req, res);
});

// Global 404 handler for API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: `NutriLens API endpoint not found: ${req.method} ${req.originalUrl}` });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[NutriLens Server Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export async function startServer() {
  // Connect database (with resilient fallback if MONGO_URI is unset)
  await connectDB();

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`[NutriLens Backend] Server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// If executed directly via node server.js
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch((err) => {
    console.error('[NutriLens Backend Startup Failed]:', err);
  });
}

export default app;
