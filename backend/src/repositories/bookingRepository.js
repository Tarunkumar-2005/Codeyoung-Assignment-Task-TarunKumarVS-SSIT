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
 * Finds all confirmed bookings for a specific mentor, optionally filtered by IST date.
 * @param {string|mongoose.Types.ObjectId} mentorId
 * @param {string} [mentorDateIST]
 * @returns {Promise<Array>}
 */
export const findBookingsByMentor = async (mentorId, mentorDateIST) => {
  const query = {
    mentorId,
    status: 'CONFIRMED',
  };
  if (mentorDateIST) {
    query.mentorDateIST = mentorDateIST;
  }
  return Booking.find(query).populate('parentId', 'name email timezone').sort({ startTimeUTC: 1 }).lean();
};

/**
 * Counts confirmed bookings for a parent on a specific local calendar date.
 * @param {string|mongoose.Types.ObjectId} parentId
 * @param {string} parentDateLocal - 'YYYY-MM-DD'
 * @returns {Promise<number>}
 */
export const countParentDailyBookings = async (parentId, parentDateLocal) => {
  return Booking.countDocuments({
    parentId,
    parentDateLocal,
    status: 'CONFIRMED',
  });
};

/**
 * Checks if the parent already has an active confirmed booking at the exact same startTimeUTC.
 * @param {string|mongoose.Types.ObjectId} parentId
 * @param {Date|string} startTimeUTC
 * @returns {Promise<Object|null>}
 */
export const findParentBookingAtTime = async (parentId, startTimeUTC) => {
  const startUtcDate = startTimeUTC instanceof Date ? startTimeUTC : new Date(startTimeUTC);
  return Booking.findOne({
    parentId,
    startTimeUTC: startUtcDate,
    status: 'CONFIRMED',
  }).lean();
};

/**
 * Finds all confirmed bookings for a parent on a specific local date.
 * @param {string|mongoose.Types.ObjectId} parentId
 * @param {string} parentDateLocal
 * @returns {Promise<Array>}
 */
export const findBookingsByParentAndDate = async (parentId, parentDateLocal) => {
  return Booking.find({
    parentId,
    parentDateLocal,
    status: 'CONFIRMED',
  }).sort({ createdAt: 1 }).lean();
};

/**
 * Creates a new booking record.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const createBooking = async (data) => {
  return Booking.create(data);
};

export default {
  countMentorDailyBookings,
  findConflictingBooking,
  findConfirmedBookingsByDateIST,
  findBookingsByMentor,
  countParentDailyBookings,
  findParentBookingAtTime,
  findBookingsByParentAndDate,
  createBooking,
};



