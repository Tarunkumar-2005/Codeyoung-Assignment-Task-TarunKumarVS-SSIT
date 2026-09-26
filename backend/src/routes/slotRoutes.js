import express from 'express';
import { handleGetAvailableSlots } from '../controllers/slotController.js';

const router = express.Router();

// GET /api/slots/available?date=YYYY-MM-DD&timezone=America/New_York
router.get('/slots/available', handleGetAvailableSlots);

export default router;
