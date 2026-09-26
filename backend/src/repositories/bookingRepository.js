import { Booking } from '../models/Booking.js';

/**
 * Counts confirmed bookings for a mentor on a specific mentor IST calendar date.
 * @param {string|mongoose.Types.ObjectId} mentorId
 * @param {string} mentorDateIST - 'YYYY-MM-DD'
 * @returns {Promise<number>}
 */
export const countMentorDailyBookings = async (mentorId, mentorDateIST) => {
  return Booking.countDocuments({
    mentorId,
    mentorDateIST,
    status: 'CONFIRMED',
  });
};

/**
 * Finds any active confirmed booking that overlaps with the requested UTC interval.
 * Overlap condition: (existing.startTimeUTC < new.endTimeUTC) AND (existing.endTimeUTC > new.startTimeUTC)
 * 
 * @param {string|mongoose.Types.ObjectId} mentorId
 * @param {Date} startTimeUTC
 * @param {Date} endTimeUTC
 * @returns {Promise<Object|null>}
 */
export const findConflictingBooking = async (mentorId, startTimeUTC, endTimeUTC) => {
  return Booking.findOne({
    mentorId,
    status: 'CONFIRMED',
    startTimeUTC: { $lt: endTimeUTC },
    endTimeUTC: { $gt: startTimeUTC },
  }).lean();
};

/**
 * Finds all active confirmed bookings for all mentors on a specific mentor IST date.
 * @param {string} mentorDateIST - 'YYYY-MM-DD'
 * @returns {Promise<Array>}
 */
export const findConfirmedBookingsByDateIST = async (mentorDateIST) => {
  return Booking.find({
    mentorDateIST,
    status: 'CONFIRMED',
  }).lean();
};

/**
 * Persists a new trial class booking.
 * @param {Object} bookingData
 * @returns {Promise<Object>}
 */
export const createBooking = async (bookingData) => {
  const booking = new Booking(bookingData);
  return booking.save();
};

export default {
  countMentorDailyBookings,
  findConflictingBooking,
  findConfirmedBookingsByDateIST,
  createBooking,
};
