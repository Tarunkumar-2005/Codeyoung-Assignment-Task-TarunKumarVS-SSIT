import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${config.mongoUri}.`);
    console.warn(`[MongoDB Warning] Error: ${error.message}`);
    console.warn(`[MongoDB Warning] Ensure MongoDB service is running on 127.0.0.1:27017 for persistent storage.`);
    return null;
  }
};
