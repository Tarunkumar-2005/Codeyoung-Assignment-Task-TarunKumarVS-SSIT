import express from 'express';
import { handleGetMentors, handleGetMentorById } from '../controllers/mentorController.js';

const router = express.Router();

// GET /api/mentors?date=YYYY-MM-DD
router.get('/mentors', handleGetMentors);

// GET /api/mentors/:id
router.get('/mentors/:id', handleGetMentorById);

export default router;
