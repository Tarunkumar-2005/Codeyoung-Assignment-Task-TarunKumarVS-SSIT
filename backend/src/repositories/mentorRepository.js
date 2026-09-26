import { Mentor } from '../models/Mentor.js';

export const findActiveMentors = async () => {
  return Mentor.find({ isActive: true }).lean();
};

export const findMentorById = async (mentorId) => {
  return Mentor.findById(mentorId).lean();
};

export const countActiveMentors = async () => {
  return Mentor.countDocuments({ isActive: true });
};

export default {
  findActiveMentors,
  findMentorById,
  countActiveMentors,
};
