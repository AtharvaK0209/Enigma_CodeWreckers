import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nutrilens_super_secret_jwt_key_2026';
const DEMO_USER_ID = 'demo-user-123';

/**
 * Authentication middleware
 * Enforces req.userId contract across all routes.
 * Supports Bearer JWT tokens, and falls back to DEMO_USER_ID for demo mode.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId || decoded.id || DEMO_USER_ID;
      req.user = decoded;
      return next();
    } catch (err) {
      // If token is invalid and we are in strict mode, reject
      if (req.headers['x-strict-auth'] === 'true') {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
      }
      // Demo fallback
      req.userId = DEMO_USER_ID;
      return next();
    }
  }

  // Header or demo fallback
  req.userId = req.headers['x-user-id'] || DEMO_USER_ID;
  next();
}

export default authenticate;
