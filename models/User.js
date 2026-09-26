import mongoose from 'mongoose';
import { isConnected } from '../config/db.js';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: 'Yunus',
      trim: true,
    },
    age: {
      type: String,
      default: '19',
    },
    allergies: {
      type: [String],
      default: ['peanut', 'tree_nuts'],
    },
    customAllergens: [
      {
        id: String,
        label: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    conditions: {
      type: [String],
      default: ['diabetes'],
    },
    onboardingComplete: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MongooseUserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// In-memory store for fallback when MONGO_URI is unset
const inMemoryUsers = new Map();

// Initialize default demo user
inMemoryUsers.set('demo-user-123', {
  _id: 'demo-user-123',
  id: 'demo-user-123',
  email: 'yunus@nutrilens.app',
  password: '',
  name: 'Yunus',
  age: '19',
  allergies: ['peanut', 'tree_nuts'],
  customAllergens: [],
  conditions: ['diabetes'],
  onboardingComplete: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const UserModel = {
  async findById(id) {
    if (isConnected()) {
      return await MongooseUserModel.findById(id).lean();
    }
    const user = inMemoryUsers.get(id);
    return user ? { ...user } : null;
  },

  async findOne(query) {
    if (isConnected()) {
      return await MongooseUserModel.findOne(query).lean();
    }
    for (const user of inMemoryUsers.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (user[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) return { ...user };
    }
    return null;
  },

  async findOneAndUpdate(query, update, options = { new: true, upsert: true }) {
    if (isConnected()) {
      return await MongooseUserModel.findOneAndUpdate(query, update, options).lean();
    }

    let existing = await this.findOne(query);
    const userId = query._id || (existing && existing._id) || `user-${Date.now()}`;
    const base = existing || {
      _id: userId,
      id: userId,
      email: query.email || 'user@nutrilens.app',
      name: 'Yunus',
      age: '19',
      allergies: ['peanut', 'tree_nuts'],
      customAllergens: [],
      conditions: ['diabetes'],
      onboardingComplete: true,
      createdAt: new Date(),
    };

    const updateData = update.$set ? { ...update.$set } : { ...update };
    const merged = {
      ...base,
      ...updateData,
      updatedAt: new Date(),
    };

    inMemoryUsers.set(userId, merged);
    return { ...merged };
  },

  async create(data) {
    if (isConnected()) {
      const created = await MongooseUserModel.create(data);
      return created.toObject();
    }
    const userId = data._id || `user-${Date.now()}`;
    const user = {
      _id: userId,
      id: userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.set(userId, user);
    return { ...user };
  },

  // Helper for test cleanup
  _resetMemoryStore() {
    inMemoryUsers.clear();
    inMemoryUsers.set('demo-user-123', {
      _id: 'demo-user-123',
      id: 'demo-user-123',
      email: 'yunus@nutrilens.app',
      password: '',
      name: 'Yunus',
      age: '19',
      allergies: ['peanut', 'tree_nuts'],
      customAllergens: [],
      conditions: ['diabetes'],
      onboardingComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
};

export default UserModel;
