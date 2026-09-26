import express from 'express';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const nowUtc = DateTime.utc().toISO();
  const nowIst = DateTime.utc().setZone('Asia/Kolkata').toISO();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'codeyoung-trial-booking-api',
      timestampUtc: nowUtc,
      timestampIst: nowIst,
      database: dbStatus,
    },
  });
});

export default router;
