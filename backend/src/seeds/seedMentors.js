import mongoose from 'mongoose';
import { Mentor } from '../models/Mentor.js';
import { config } from '../config/env.js';

export const INITIAL_MENTORS = [
  {
    name: 'Ananya Verma',
    email: 'ananya.verma@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '10:00', endIST: '20:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Rohan Sharma',
    email: 'rohan.sharma@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '10:00', endIST: '20:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Priya Sundaram',
    email: 'priya.sundaram@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '12:00', endIST: '21:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '14:00', endIST: '22:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Sneha Patel',
    email: 'sneha.patel@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '10:00', endIST: '19:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Aditya Mukherjee',
    email: 'aditya.mukherjee@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '13:00', endIST: '22:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Kavita Iyer',
    email: 'kavita.iyer@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '11:00', endIST: '20:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Rahul Nair',
    email: 'rahul.nair@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '14:00', endIST: '23:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Neha Gupta',
    email: 'neha.gupta@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '10:00', endIST: '19:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
  {
    name: 'Siddharth Joshi',
    email: 'siddharth.joshi@codeyoung.com',
    timezone: 'Asia/Kolkata',
    workingHours: { startIST: '12:00', endIST: '21:00' },
    maxDailyDemos: 2,
    isActive: true,
  },
];

export const seedMentors = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri);

    console.log(`[Seed] Upserting ${INITIAL_MENTORS.length} demo mentors...`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const mentorData of INITIAL_MENTORS) {
      const result = await Mentor.updateOne(
        { email: mentorData.email },
        { $set: mentorData },
        { upsert: true, runValidators: true }
      );

      if (result.upsertedCount > 0) {
        createdCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    const totalMentors = await Mentor.countDocuments();
    console.log(`[Seed Success] Completed!`);
    console.log(`  - Newly inserted: ${createdCount}`);
    console.log(`  - Updated/Refreshed: ${updatedCount}`);
    console.log(`  - Total active mentors in DB: ${totalMentors}`);

    return { createdCount, updatedCount, totalMentors };
  } catch (error) {
    console.error(`[Seed Error] Failed to seed mentors: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log(`[Seed] Disconnected from MongoDB.`);
  }
};

// If executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedMentors.js')) {
  seedMentors()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
