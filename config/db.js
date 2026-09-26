import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[Database] MONGO_URI not set. Operating with resilient in-memory store so server runs cleanly.');
    isMongoConnected = false;
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('[Database] MongoDB Atlas connection successfully established.');
    return true;
  } catch (err) {
    console.error(`[Database] MONGO_URI connection failed: ${err.message}. Operating in resilient fallback mode.`);
    isMongoConnected = false;
    return false;
  }
}

export function isConnected() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

export default {
  connectDB,
  isConnected,
};
