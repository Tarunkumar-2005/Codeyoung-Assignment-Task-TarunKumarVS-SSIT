import express from 'express';
import { handleCreateBooking } from '../controllers/bookingController.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/bookings - Book a trial class
router.post('/bookings', bookingLimiter, handleCreateBooking);

export default router;
