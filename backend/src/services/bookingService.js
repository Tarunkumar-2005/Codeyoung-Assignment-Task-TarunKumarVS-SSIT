import { DateTime } from 'luxon';
import timezoneService from './timezoneService.js';
import mentorAvailabilityService from './mentorAvailabilityService.js';
import parentRepository from '../repositories/parentRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';
import slotService from './slotService.js';
import { generateMeetingLink } from '../utils/meetingLink.js';
import { config } from '../config/env.js';

/**
 * Validates email format with standard RFC 5322 regex.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Creates a trial class booking with concurrency resilience and friendly alternative slot suggestions.
 * 
 * @param {Object} payload - { parent: { name, email, timezone }, startTime, timezone }
 * @returns {Promise<Object>} Confirmation payload
 */
export const createTrialBooking = async (payload) => {
  // 1. Request extraction & validation
  if (!payload || typeof payload !== 'object') {
    const err = new Error('Invalid request payload. Expected JSON body.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_REQUEST';
    throw err;
  }

  const { parent, startTime, mentorId, preferredMentorId, mentorName, strictMentor } = payload;
  const timezone = payload.timezone || parent?.timezone;
  const targetMentorIdentifier = mentorId || preferredMentorId || mentorName;

  if (!parent || typeof parent !== 'object') {
    const err = new Error("Parent details are required under 'parent' object.");
    err.statusCode = 400;
    err.errorCode = 'MISSING_PARENT_DETAILS';
    throw err;
  }

  const parentName = parent.name?.trim();
  const parentEmail = parent.email?.trim();

  if (!parentName || parentName.length < 2) {
    const err = new Error('Parent name must be at least 2 characters long.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_PARENT_NAME';
    throw err;
  }

  // 2. Validate email
  if (!isValidEmail(parentEmail)) {
    const err = new Error(`Invalid email address: '${parentEmail}'. Please provide a valid email.`);
    err.statusCode = 400;
    err.errorCode = 'INVALID_EMAIL';
    throw err;
  }

  // 3. Validate timezone identifier
  if (!timezone) {
    const err = new Error('Timezone identifier is required (e.g. America/New_York, Europe/London).');
    err.statusCode = 400;
    err.errorCode = 'MISSING_TIMEZONE';
    throw err;
  }
  timezoneService.assertValidTimezone(timezone);

  if (!startTime) {
    const err = new Error('Appointment startTime is required.');
    err.statusCode = 400;
    err.errorCode = 'MISSING_START_TIME';
    throw err;
  }

  // 4 & 5. Convert local time to UTC
  let startTimeUTC;
  if (typeof startTime === 'string' && startTime.endsWith('Z')) {
    startTimeUTC = startTime;
  } else {
    startTimeUTC = timezoneService.localTimeToUTC(startTime, timezone);
  }

  // 4. Validate that requested time is not in the past
  const appointmentEpoch = new Date(startTimeUTC).getTime();
  const nowEpoch = Date.now();
  if (appointmentEpoch < nowEpoch) {
    const err = new Error('Cannot book an appointment in the past. Please select a future time slot.');
    err.statusCode = 400;
    err.errorCode = 'PAST_APPOINTMENT_TIME';
    throw err;
  }

  // Calculate 45-minute appointment end time in UTC
  const durationMinutes = config.demoDurationMinutes || 45;
  const endDt = DateTime.fromISO(startTimeUTC, { zone: 'utc' }).plus({ minutes: durationMinutes });
  const endTimeUTC = endDt.toUTC().toISO();

  // Helper to fetch same-day alternative slots if no mentor is available
  const getSameDayAlternatives = async () => {
    try {
      const parentDate = timezoneService.formatForUser(startTimeUTC, timezone).date;
      const daySlots = await slotService.getAvailableSlotsForDate(parentDate, timezone);
      return daySlots
        .filter((s) => s.isAvailable && s.startTimeUTC !== startTimeUTC)
        .slice(0, 4);
    } catch (e) {
      return [];
    }
  };

  // 6. Find initial eligible mentors
  let candidateMentors = await mentorAvailabilityService.getAvailableMentors(startTimeUTC, endTimeUTC);

  // If a specific mentor is requested, check / prioritize that mentor
  if (targetMentorIdentifier) {
    const matchingCandidateIndex = candidateMentors.findIndex((c) => {
      const m = c.mentor;
      const idStr = m._id ? m._id.toString() : '';
      const emailStr = m.email || '';
      const nameStr = m.name || '';
      return (
        idStr === targetMentorIdentifier.toString() ||
        emailStr.toLowerCase() === targetMentorIdentifier.toString().toLowerCase() ||
        nameStr.toLowerCase().includes(targetMentorIdentifier.toString().toLowerCase())
      );
    });

    if (matchingCandidateIndex >= 0) {
      // Put requested mentor at the front of candidate queue
      const [matched] = candidateMentors.splice(matchingCandidateIndex, 1);
      candidateMentors.unshift(matched);
    } else if (strictMentor) {
      // Requested mentor is specifically required but not available
      const alternatives = await getSameDayAlternatives();
      const err = new Error(`Instructor ${mentorName || 'The requested mentor'} is at maximum daily capacity or not available for this time. Please choose another date or instructor.`);
      err.statusCode = 409;
      err.errorCode = 'MENTOR_CAPACITY_REACHED';
      err.details = {
        message: `Instructor ${mentorName || 'The requested mentor'} is at maximum daily capacity. Please choose another date or instructor.`,
        requestedSlot: {
          startTimeUTC,
          endTimeUTC,
          parentLocalTime: timezoneService.formatForUser(startTimeUTC, timezone).fullFormatted,
          parentTimezone: timezone,
        },
        suggestedAlternativeSlots: alternatives,
      };
      throw err;
    }
  }

  if (!candidateMentors || candidateMentors.length === 0) {
    const alternatives = await getSameDayAlternatives();
    const err = new Error('No mentor is available for this time.');
    err.statusCode = 409;
    err.errorCode = 'NO_MENTOR_AVAILABLE';
    err.details = {
      message: 'No mentor is available for this time.',
      requestedSlot: {
        startTimeUTC,
        endTimeUTC,
        parentLocalTime: timezoneService.formatForUser(startTimeUTC, timezone).fullFormatted,
        parentTimezone: timezone,
      },
      suggestedAlternativeSlots: alternatives,
      suggestion: alternatives.length > 0 
        ? 'Please select one of the available alternative slots below on the same day.' 
        : 'Please select an alternative date.',
    };
    throw err;
  }

  // Determine parent's local calendar date strictly in parent's IANA timezone
  const parentLocalProjection = timezoneService.formatForUser(startTimeUTC, timezone);
  const parentDateLocal = parentLocalProjection.date; // 'YYYY-MM-DD'

  // Upsert Parent record using normalized email
  const parentDoc = await parentRepository.findOrCreateParent({
    name: parentName,
    email: parentEmail,
    timezone,
  });

  // Check 1: Prevent duplicate booking for the SAME parent at the EXACT SAME appointment time
  const existingParentSlotBooking = await bookingRepository.findParentBookingAtTime(
    parentDoc._id,
    startTimeUTC
  );
  if (existingParentSlotBooking) {
    const err = new Error('You already have a trial class booked for this time. Please choose another time.');
    err.statusCode = 409;
    err.errorCode = 'DUPLICATE_PARENT_BOOKING';
    err.details = {
      message: 'You already have a trial class booked for this time. Please choose another time.',
      parentEmail: parentDoc.email,
      parentDateLocal,
      requestedSlot: {
        startTimeUTC,
        parentLocalTime: parentLocalProjection.fullFormatted,
      },
    };
    throw err;
  }

  // Check 2: Enforce Parent Maximum Daily Quota (Max 2 trial classes per parent per local calendar day)
  const MAX_PARENT_DAILY_BOOKINGS = 2;
  const parentDailyCount = await bookingRepository.countParentDailyBookings(
    parentDoc._id,
    parentDateLocal
  );

  if (parentDailyCount >= MAX_PARENT_DAILY_BOOKINGS) {
    const err = new Error('You have reached the maximum of 2 trial classes for today. Please choose another date.');
    err.statusCode = 409;
    err.errorCode = 'PARENT_DAILY_LIMIT_REACHED';
    err.details = {
      message: 'You have reached the maximum of 2 trial classes for today. Please choose another date.',
      parentEmail: parentDoc.email,
      parentDateLocal,
      currentBookingsCount: parentDailyCount,
      maxAllowed: MAX_PARENT_DAILY_BOOKINGS,
    };
    throw err;
  }

  // 7, 8, 9, 10. Concurrency-safe candidate allocation loop
  let assignedBooking = null;
  let assignedMentor = null;
  let assignedMentorDateIST = null;

  for (const candidate of candidateMentors) {
    const mentor = candidate.mentor;
    const mentorId = mentor._id;
    const mentorDateIST = candidate.mentorDateIST;
    const maxDemos = mentor.maxDailyDemos || config.maxDailyDemosPerMentor || 2;

    const currentDailyCount = await bookingRepository.countMentorDailyBookings(mentorId, mentorDateIST);
    if (currentDailyCount >= maxDemos) {
      continue;
    }

    const hasConflict = await mentorAvailabilityService.hasScheduleConflict(
      mentorId,
      startTimeUTC,
      endTimeUTC
    );
    if (hasConflict) {
      continue;
    }

    const meetingLink = generateMeetingLink();

    try {
      const newBooking = await bookingRepository.createBooking({
        parentId: parentDoc._id,
        mentorId: mentor._id,
        startTimeUTC: new Date(startTimeUTC),
        endTimeUTC: new Date(endTimeUTC),
        parentTimezone: timezone,
        parentDateLocal,
        mentorTimezone: mentor.timezone || 'Asia/Kolkata',
        mentorDateIST,
        meetingLink,
        status: 'CONFIRMED',
      });

      // Post-creation race-condition safety check for parent daily limit
      const activeParentBookings = await bookingRepository.countParentDailyBookings(
        parentDoc._id,
        parentDateLocal
      );
      if (activeParentBookings > MAX_PARENT_DAILY_BOOKINGS) {
        // Query to check if this specific booking is the excess (> 2nd) one
        const confirmedBookings = await bookingRepository.findBookingsByParentAndDate(
          parentDoc._id,
          parentDateLocal
        );
        if (confirmedBookings.length > MAX_PARENT_DAILY_BOOKINGS && confirmedBookings[confirmedBookings.length - 1]._id.toString() === newBooking._id.toString()) {
          await newBooking.updateOne({ status: 'CANCELLED' });
          const err = new Error('You have reached the maximum of 2 trial classes for today. Please choose another date.');
          err.statusCode = 409;
          err.errorCode = 'PARENT_DAILY_LIMIT_REACHED';
          throw err;
        }
      }

      assignedBooking = newBooking;
      assignedMentor = mentor;
      assignedMentorDateIST = mentorDateIST;
      break;
    } catch (dbError) {
      if (dbError.code === 11000) {
        if (dbError.keyPattern?.parentId && dbError.keyPattern?.startTimeUTC) {
          const err = new Error('You already have a trial class booked for this time. Please choose another time.');
          err.statusCode = 409;
          err.errorCode = 'DUPLICATE_PARENT_BOOKING';
          throw err;
        }
        continue;
      }
      throw dbError;
    }
  }



  // If all candidate mentors collided or were consumed concurrently
  if (!assignedBooking) {
    const alternatives = await getSameDayAlternatives();
    const err = new Error('No mentor is available for this time.');
    err.statusCode = 409;
    err.errorCode = 'NO_MENTOR_AVAILABLE';
    err.details = {
      message: 'No mentor is available for this time.',
      requestedSlot: {
        startTimeUTC,
        endTimeUTC,
        parentLocalTime: timezoneService.formatForUser(startTimeUTC, timezone).fullFormatted,
        parentTimezone: timezone,
      },
      suggestedAlternativeSlots: alternatives,
      suggestion: alternatives.length > 0 
        ? 'Please select one of the available alternative slots below on the same day.' 
        : 'Please select an alternative date.',
    };
    throw err;
  }

  // Build structured confirmation response
  const parentProjection = timezoneService.formatForUser(startTimeUTC, timezone);
  const mentorProjection = timezoneService.formatForUser(startTimeUTC, assignedMentor.timezone || 'Asia/Kolkata');

  return {
    bookingId: assignedBooking._id.toString(),
    status: assignedBooking.status,
    parent: {
      id: parentDoc._id.toString(),
      name: parentDoc.name,
      email: parentDoc.email,
      timezone: parentDoc.timezone,
    },
    mentor: {
      id: assignedMentor._id.toString(),
      name: assignedMentor.name,
      email: assignedMentor.email,
      timezone: assignedMentor.timezone || 'Asia/Kolkata',
    },
    appointment: {
      startTimeUTC,
      endTimeUTC,
      durationMinutes,
      meetingLink: assignedBooking.meetingLink,
    },
    parentLocalTime: {
      timezone: timezone,
      date: parentProjection.date,
      time: parentProjection.time,
      formatted: parentProjection.fullFormatted,
      zoneAbbreviation: parentProjection.zoneAbbreviation,
      zoneNameLong: parentProjection.zoneNameLong,
      isDST: parentProjection.isDST,
    },
    mentorLocalTime: {
      timezone: assignedMentor.timezone || 'Asia/Kolkata',
      date: mentorProjection.date,
      time: mentorProjection.time,
      formatted: mentorProjection.fullFormatted,
      zoneAbbreviation: mentorProjection.zoneAbbreviation,
      zoneNameLong: mentorProjection.zoneNameLong,
      isDST: mentorProjection.isDST,
      mentorDateIST: assignedMentorDateIST,
    },
    timezoneInformation: {
      parentTimezone: timezone,
      mentorTimezone: assignedMentor.timezone || 'Asia/Kolkata',
      parentUtcOffsetMinutes: parentProjection.offsetMinutes,
      mentorUtcOffsetMinutes: mentorProjection.offsetMinutes,
    },
  };
};

export default {
  createTrialBooking,
};
