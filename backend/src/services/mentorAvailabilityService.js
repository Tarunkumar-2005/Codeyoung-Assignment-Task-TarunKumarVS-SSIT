import { DateTime } from 'luxon';
import timezoneService from './timezoneService.js';
import mentorRepository from '../repositories/mentorRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';

/**
 * Checks whether a requested appointment interval falls completely within a mentor's working hours.
 * Evaluated strictly in the mentor's local timezone (Asia/Kolkata).
 * 
 * @param {Object} mentor - Mentor entity containing workingHours ({ startIST, endIST }) and timezone
 * @param {string|Date} startTimeUTC - Appointment start in UTC
 * @param {string|Date} endTimeUTC - Appointment end in UTC
 * @returns {boolean}
 */
export const isWithinMentorWorkingHours = (mentor, startTimeUTC, endTimeUTC) => {
  const mentorZone = mentor.timezone || 'Asia/Kolkata';
  const startDt = timezoneService.utcToTimezone(startTimeUTC, mentorZone);
  const endDt = timezoneService.utcToTimezone(endTimeUTC, mentorZone);

  const [startHour, startMin] = (mentor.workingHours?.startIST || '10:00').split(':').map(Number);
  const [endHour, endMin] = (mentor.workingHours?.endIST || '20:00').split(':').map(Number);

  // Check if working hours span across midnight (e.g. 16:00 to 02:00)
  if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    const slotStartMins = startDt.hour * 60 + startDt.minute;
    const slotEndMins = endDt.hour * 60 + endDt.minute + (endDt.hasSame(startDt, 'day') ? 0 : 24 * 60);

    // Case 1: Slot starts on or after startHour today (e.g. 16:00 to 23:59)
    if (slotStartMins >= startMins) {
      return slotEndMins <= (endMins + 24 * 60);
    }
    // Case 2: Slot starts in early morning (00:00 to 02:00)
    if (slotStartMins < endMins) {
      return slotEndMins <= endMins && startDt.hasSame(endDt, 'day');
    }
    return false;
  }

  const workStartDt = startDt.set({ hour: startHour, minute: startMin, second: 0, millisecond: 0 });
  const workEndDt = startDt.set({ hour: endHour, minute: endMin, second: 0, millisecond: 0 });

  // Appointment must start at or after workStart AND end at or before workEnd on the same mentor date
  return startDt >= workStartDt && endDt <= workEndDt && startDt.hasSame(endDt, 'day');
};


/**
 * Checks if a mentor has already reached their maximum daily demo class limit for a given IST calendar day.
 * 
 * @param {string} mentorId - Mentor's unique ID
 * @param {string} mentorDateIST - 'YYYY-MM-DD' strictly in Asia/Kolkata
 * @param {number} maxDailyDemos - Default: 2
 * @param {Object} [injectedBookingRepo] - Optional override for unit testing
 * @returns {Promise<boolean>}
 */
export const hasReachedDailyLimit = async (
  mentorId,
  mentorDateIST,
  maxDailyDemos = 2,
  injectedBookingRepo = bookingRepository
) => {
  const count = await injectedBookingRepo.countMentorDailyBookings(mentorId, mentorDateIST);
  return count >= maxDailyDemos;
};

/**
 * Checks if a mentor has an existing overlapping confirmed booking.
 * Overlap condition in UTC: (existing.startTime < new.endTime) AND (existing.endTime > new.startTime)
 * 
 * @param {string} mentorId - Mentor's unique ID
 * @param {string|Date} startTimeUTC - Appointment start in UTC
 * @param {string|Date} endTimeUTC - Appointment end in UTC
 * @param {Object} [injectedBookingRepo] - Optional override for unit testing
 * @returns {Promise<boolean>}
 */
export const hasScheduleConflict = async (
  mentorId,
  startTimeUTC,
  endTimeUTC,
  injectedBookingRepo = bookingRepository
) => {
  const startUtcDate = startTimeUTC instanceof Date ? startTimeUTC : new Date(startTimeUTC);
  const endUtcDate = endTimeUTC instanceof Date ? endTimeUTC : new Date(endTimeUTC);

  const conflict = await injectedBookingRepo.findConflictingBooking(mentorId, startUtcDate, endUtcDate);
  return Boolean(conflict);
};

/**
 * Evaluates full availability of a single mentor for a specific time interval.
 * 
 * @param {Object} mentor - Mentor object
 * @param {string|Date} startTimeUTC - UTC start timestamp
 * @param {string|Date} endTimeUTC - UTC end timestamp
 * @param {Object} [options] - Optional overrides ({ bookingRepo, existingBookings })
 * @returns {Promise<{ isAvailable: boolean, reason?: string, mentorDateIST: string, currentDailyDemos?: number }>}
 */
export const isMentorAvailable = async (mentor, startTimeUTC, endTimeUTC, options = {}) => {
  const repo = options.bookingRepo || bookingRepository;

  // 1. Mentor active status
  if (!mentor.isActive) {
    return { isAvailable: false, reason: 'MENTOR_INACTIVE', mentorDateIST: null };
  }

  // 2. Working hours evaluation in mentor's local timezone (Asia/Kolkata)
  if (!isWithinMentorWorkingHours(mentor, startTimeUTC, endTimeUTC)) {
    return { isAvailable: false, reason: 'OUTSIDE_WORKING_HOURS', mentorDateIST: null };
  }

  // 3. Extract mentor's local calendar date in Asia/Kolkata
  const mentorDateIST = timezoneService.getMentorDateIST(startTimeUTC);
  const mentorId = mentor._id?.toString() || mentor.id?.toString() || mentor.email;

  // 4. Daily quota limit evaluation (max 2 demos per IST calendar day)
  const currentDailyCount = await repo.countMentorDailyBookings(mentorId, mentorDateIST);
  const maxDemos = mentor.maxDailyDemos || 2;
  if (currentDailyCount >= maxDemos) {
    return {
      isAvailable: false,
      reason: 'DAILY_LIMIT_REACHED',
      mentorDateIST,
      currentDailyDemos: currentDailyCount,
    };
  }

  // 5. Schedule overlap conflict evaluation in UTC
  const hasConflict = await hasScheduleConflict(mentorId, startTimeUTC, endTimeUTC, repo);
  if (hasConflict) {
    return {
      isAvailable: false,
      reason: 'SCHEDULE_CONFLICT',
      mentorDateIST,
      currentDailyDemos: currentDailyCount,
    };
  }

  return {
    isAvailable: true,
    reason: null,
    mentorDateIST,
    currentDailyDemos: currentDailyCount,
    remainingDemosToday: maxDemos - currentDailyCount,
  };
};

/**
 * Retrieves all mentors available for a requested trial class slot.
 * 
 * @param {string|Date} startTimeUTC - UTC start timestamp
 * @param {string|Date} endTimeUTC - UTC end timestamp
 * @param {Object} [options] - Options ({ mentors, bookingRepo, mentorRepo })
 * @returns {Promise<Array<Object>>} - Array of available mentors with daily load metadata
 */
export const getAvailableMentors = async (startTimeUTC, endTimeUTC, options = {}) => {
  const mRepo = options.mentorRepo || mentorRepository;
  const bRepo = options.bookingRepo || bookingRepository;

  // Fetch all active mentors
  const mentors = options.mentors || (await mRepo.findActiveMentors());

  const availableMentors = [];

  for (const mentor of mentors) {
    const check = await isMentorAvailable(mentor, startTimeUTC, endTimeUTC, { bookingRepo: bRepo });
    if (check.isAvailable) {
      availableMentors.push({
        mentor,
        mentorDateIST: check.mentorDateIST,
        currentDailyDemos: check.currentDailyDemos,
        remainingDemosToday: check.remainingDemosToday,
      });
    }
  }

  // Sort candidates by least load first (load balancing)
  availableMentors.sort((a, b) => a.currentDailyDemos - b.currentDailyDemos);

  return availableMentors;
};

export default {
  isWithinMentorWorkingHours,
  hasReachedDailyLimit,
  hasScheduleConflict,
  isMentorAvailable,
  getAvailableMentors,
};
