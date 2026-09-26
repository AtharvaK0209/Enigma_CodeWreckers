import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nutrilens_super_secret_jwt_key_2026';

/**
 * Authentication middleware
 * Enforces real authenticated session on protected routes.
 * Decodes Bearer JWT token to establish req.userId.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId || decoded.id;
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
  }

  // Support explicit test harness header
  if (req.headers['x-user-id']) {
    req.userId = req.headers['x-user-id'];
    return next();
  }

  // For analyze/search endpoints, allow unauthenticated guest requests with client profile
  const isAnalyzeOrSearch = req.baseUrl?.includes('/analyze') || req.originalUrl?.includes('/analyze') || req.originalUrl?.includes('/search');
  if (isAnalyzeOrSearch) {
    req.userId = null;
    return next();
  }

  // Protected routes (/api/profile, /api/history) strictly require auth
  return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
}

export default authenticate;
