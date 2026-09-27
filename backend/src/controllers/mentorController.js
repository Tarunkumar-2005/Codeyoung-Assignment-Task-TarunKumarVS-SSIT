import mentorRepository from '../repositories/mentorRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';
import timezoneService from '../services/timezoneService.js';
import mongoose from 'mongoose';

/**
 * Lists all active mentors with daily load statistics for a given IST date.
 */
export const handleGetMentors = async (req, res, next) => {
  try {
    const { date } = req.query; // 'YYYY-MM-DD'
    const queryDateIST = date || timezoneService.getMentorDateIST(new Date().toISOString());

    const mentors = await mentorRepository.findActiveMentors();
    const mentorsWithStats = await Promise.all(
      mentors.map(async (m) => {
        const activeDemos = await bookingRepository.countMentorDailyBookings(m._id, queryDateIST);
        return {
          id: m._id,
          name: m.name,
          email: m.email,
          timezone: m.timezone,
          workingHours: m.workingHours,
          maxDailyDemos: m.maxDailyDemos,
          demosScheduledToday: activeDemos,
          remainingDemosToday: Math.max(0, m.maxDailyDemos - activeDemos),
          queryDateIST,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: mentorsWithStats,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Retrieves a single mentor's schedule by ID.
 * Validates ObjectId format to prevent malformed ID crashes.
 */
export const handleGetMentorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error(`Invalid mentor ID format: '${id}'. Must be a valid 24-character hex string.`);
      err.statusCode = 400;
      err.errorCode = 'MALFORMED_ID';
      throw err;
    }

    const mentor = await mentorRepository.findMentorById(id);
    if (!mentor) {
      const err = new Error(`Mentor with ID '${id}' was not found.`);
      err.statusCode = 404;
      err.errorCode = 'MENTOR_NOT_FOUND';
      throw err;
    }

    const queryDateIST = date || timezoneService.getMentorDateIST(new Date().toISOString());
    const bookings = await bookingRepository.findBookingsByMentor(mentor._id, date ? queryDateIST : undefined);
    const activeDemos = await bookingRepository.countMentorDailyBookings(mentor._id, queryDateIST);

    const mentorData = mentor.toObject ? mentor.toObject() : mentor;

    return res.status(200).json({
      success: true,
      data: {
        ...mentorData,
        queryDateIST,
        demosScheduledToday: activeDemos,
        remainingDemosToday: Math.max(0, (mentor.maxDailyDemos || 2) - activeDemos),
        isFullyBooked: activeDemos >= (mentor.maxDailyDemos || 2),
        bookings,
      },
    });
  } catch (err) {
    return next(err);
  }
};


export default {
  handleGetMentors,
  handleGetMentorById,
};
