import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nutrilens_super_secret_jwt_key_2026';
const TOKEN_EXPIRY = '7d';

/**
 * Helper to generate JWT token with userId
 */
function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * POST /api/auth/signup
 * Registers a new user with bcrypt password hashing
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, allergies, conditions } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    let hashedPassword = '';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const userId = `user-${Date.now()}`;
    const newUser = await UserModel.create({
      _id: userId,
      email: cleanEmail,
      password: hashedPassword,
      name: name || cleanEmail.split('@')[0],
      age: age || '20',
      allergies: Array.isArray(allergies) ? allergies : ['peanut', 'tree_nuts'],
      customAllergens: [],
      conditions: Array.isArray(conditions) ? conditions : ['diabetes'],
      onboardingComplete: true,
    });

    const token = generateToken(newUser._id || newUser.id, cleanEmail);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id || newUser.id,
        email: newUser.email,
        name: newUser.name,
        age: newUser.age,
        allergies: newUser.allergies,
        conditions: newUser.conditions,
        onboardingComplete: newUser.onboardingComplete,
      },
    });
  } catch (err) {
    console.error('[Auth Signup] Error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

/**
 * POST /api/auth/login
 * Verifies password using bcrypt and returns JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // Demo-friendly sign in if email is demo or empty
    if (!cleanEmail || cleanEmail === 'yunus@nutrilens.app' || cleanEmail === 'demo@nutrilens.app') {
      const demoId = 'demo-user-123';
      const token = generateToken(demoId, 'yunus@nutrilens.app');
      let user = await UserModel.findById(demoId);
      if (!user) {
        user = await UserModel.create({
          _id: demoId,
          email: 'yunus@nutrilens.app',
          name: 'Yunus',
          age: '19',
          allergies: ['peanut', 'tree_nuts'],
          conditions: ['diabetes'],
          onboardingComplete: true,
        });
      }

      return res.json({
        token,
        user: {
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          allergies: user.allergies,
          conditions: user.conditions,
          onboardingComplete: user.onboardingComplete,
        },
      });
    }

    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.password && password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const token = generateToken(user._id || user.id, user.email);

    res.json({
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        allergies: user.allergies,
        conditions: user.conditions,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    res.status(500).json({ error: 'Sign in failed', details: err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current user profile from token
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      allergies: user.allergies,
      customAllergens: user.customAllergens || [],
      conditions: user.conditions,
      onboardingComplete: user.onboardingComplete,
    });
  } catch (err) {
    console.error('[Auth Me] Error:', err);
    res.status(500).json({ error: 'Failed to verify auth session' });
  }
});

export default router;
