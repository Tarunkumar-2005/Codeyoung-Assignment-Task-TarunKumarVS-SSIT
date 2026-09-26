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

  const { parent, startTime } = payload;
  const timezone = payload.timezone || parent?.timezone;

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

  // 6. Find initial eligible mentors
  const candidateMentors = await mentorAvailabilityService.getAvailableMentors(startTimeUTC, endTimeUTC);

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

  // Upsert Parent record
  const parentDoc = await parentRepository.findOrCreateParent({
    name: parentName,
    email: parentEmail,
    timezone,
  });

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
        mentorTimezone: mentor.timezone || 'Asia/Kolkata',
        mentorDateIST,
        meetingLink,
        status: 'CONFIRMED',
      });

      assignedBooking = newBooking;
      assignedMentor = mentor;
      assignedMentorDateIST = mentorDateIST;
      break;
    } catch (dbError) {
      if (dbError.code === 11000) {
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
