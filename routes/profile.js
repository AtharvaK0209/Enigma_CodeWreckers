import express from 'express';
import UserModel from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all profile routes
router.use(authenticate);

/**
 * GET /api/profile
 * Returns the profile for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    let user = await UserModel.findById(userId);

    if (!user) {
      // Find by email or fallback to demo profile
      user = await UserModel.findOne({ _id: userId });
    }

    if (!user) {
      // Create initial profile for this user
      user = await UserModel.create({
        _id: userId,
        email: 'user@nutrilens.app',
        name: 'Yunus',
        age: '19',
        allergies: ['peanut', 'tree_nuts'],
        customAllergens: [],
        conditions: ['diabetes'],
        onboardingComplete: true,
      });
    }

    res.json({
      id: user._id || user.id,
      name: user.name,
      age: user.age,
      email: user.email,
      allergies: user.allergies || [],
      customAllergens: user.customAllergens || [],
      conditions: user.conditions || [],
      onboardingComplete: user.onboardingComplete !== false,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('[Profile Route] Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
});

/**
 * PUT /api/profile
 * Updates the user profile in MongoDB
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, age, allergies, customAllergens, conditions, onboardingComplete } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (age !== undefined) updateFields.age = age;
    if (allergies !== undefined) updateFields.allergies = allergies;
    if (customAllergens !== undefined) updateFields.customAllergens = customAllergens;
    if (conditions !== undefined) updateFields.conditions = conditions;
    if (onboardingComplete !== undefined) updateFields.onboardingComplete = onboardingComplete;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json({
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      age: updatedUser.age,
      email: updatedUser.email,
      allergies: updatedUser.allergies || [],
      customAllergens: updatedUser.customAllergens || [],
      conditions: updatedUser.conditions || [],
      onboardingComplete: updatedUser.onboardingComplete !== false,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (err) {
    console.error('[Profile Route] Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

export default router;
