import mongoose from 'mongoose';
import { isConnected } from '../config/db.js';

const FindingSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    category: { type: String },
    severity: { type: String, enum: ['safe', 'caution', 'risk'], default: 'safe' },
    evidence: { type: String },
    trigger: { type: String },
    source: { type: String },
    confidence: { type: String },
    evidenceSource: { type: String, enum: ['off', 'image', 'user_confirmed'], default: 'off' },
  },
  { _id: false }
);

const ScanHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: '',
    },
    barcode: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    verdict: {
      type: String,
      enum: ['safe', 'caution', 'risk'],
      default: 'safe',
    },
    verdictTitle: {
      type: String,
    },
    verdictSummary: {
      type: String,
    },
    dataQuality: {
      type: String,
      enum: ['good', 'partial', 'low'],
      default: 'good',
    },
    flagCount: {
      type: Number,
      default: 0,
    },
    statusText: {
      type: String,
    },
    findings: [FindingSchema],
    method: {
      type: String,
      enum: ['barcode', 'image', 'search'],
      default: 'barcode',
    },
    timestamp: {
      type: String,
      default: 'Just now',
    },
  },
  {
    timestamps: true,
  }
);

export const MongooseScanHistoryModel =
  mongoose.models.ScanHistory || mongoose.model('ScanHistory', ScanHistorySchema);

// In-memory store for fallback
let inMemoryHistory = [];

export const ScanHistoryModel = {
  async find(query, sort = { createdAt: -1 }, limit = 20) {
    if (isConnected()) {
      return await MongooseScanHistoryModel.find(query).sort(sort).limit(limit).lean();
    }
    let results = inMemoryHistory.filter((item) => {
      for (const [k, v] of Object.entries(query)) {
        if (item[k] !== v) return false;
      }
      return true;
    });

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results.slice(0, limit);
  },

  async create(data) {
    if (isConnected()) {
      const doc = await MongooseScanHistoryModel.create(data);
      return doc.toObject();
    }
    const item = {
      _id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      id: `scan-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryHistory.unshift(item);
    return { ...item };
  },

  async deleteMany(query) {
    if (isConnected()) {
      return await MongooseScanHistoryModel.deleteMany(query);
    }
    const beforeLen = inMemoryHistory.length;
    inMemoryHistory = inMemoryHistory.filter((item) => {
      for (const [k, v] of Object.entries(query)) {
        if (item[k] === v) return false;
      }
      return true;
    });
    return { deletedCount: beforeLen - inMemoryHistory.length };
  },

  _resetMemoryStore() {
    inMemoryHistory = [];
  },
};

export default ScanHistoryModel;
