import { DateTime } from 'luxon';
import timezoneService from './timezoneService.js';
import mentorAvailabilityService from './mentorAvailabilityService.js';
import parentRepository from '../repositories/parentRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';
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
 * Creates a trial class booking.
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
    // If incoming string is already an explicit UTC ISO string
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

  // 6, 7, 8, 9. Find available mentors matching working hours, no overlaps, and < 2 daily demos
  const availableMentors = await mentorAvailabilityService.getAvailableMentors(startTimeUTC, endTimeUTC);

  if (!availableMentors || availableMentors.length === 0) {
    const err = new Error(
      'No mentors are currently available for the selected slot. All mentors are either outside their working hours, already booked, or have reached their daily limit of 2 trial classes.'
    );
    err.statusCode = 409;
    err.errorCode = 'NO_MENTOR_AVAILABLE';
    err.details = {
      requestedSlot: {
        startTimeUTC,
        endTimeUTC,
        parentLocalTime: timezoneService.formatForUser(startTimeUTC, timezone).fullFormatted,
        parentTimezone: timezone,
      },
      suggestion: 'Please choose an alternative time slot or select a different date.',
    };
    throw err;
  }

  // Select the least-loaded available mentor (first candidate after sorting)
  const selectedCandidate = availableMentors[0];
  const selectedMentor = selectedCandidate.mentor;
  const mentorDateIST = selectedCandidate.mentorDateIST;

  // 10. Upsert Parent record
  const parentDoc = await parentRepository.findOrCreateParent({
    name: parentName,
    email: parentEmail,
    timezone,
  });

  // 11. Generate unique meeting link
  const meetingLink = generateMeetingLink();

  // Create booking record
  let bookingDoc;
  try {
    bookingDoc = await bookingRepository.createBooking({
      parentId: parentDoc._id,
      mentorId: selectedMentor._id,
      startTimeUTC: new Date(startTimeUTC),
      endTimeUTC: new Date(endTimeUTC),
      parentTimezone: timezone,
      mentorTimezone: selectedMentor.timezone || 'Asia/Kolkata',
      mentorDateIST,
      meetingLink,
      status: 'CONFIRMED',
    });
  } catch (dbError) {
    // Catch MongoDB duplicate key error (code 11000) for concurrency collision
    if (dbError.code === 11000) {
      const err = new Error('The selected mentor was just booked by another parent. Please try booking again.');
      err.statusCode = 409;
      err.errorCode = 'CONCURRENT_BOOKING_COLLISION';
      throw err;
    }
    throw dbError;
  }

  // 12. Build structured confirmation response
  const parentProjection = timezoneService.formatForUser(startTimeUTC, timezone);
  const mentorProjection = timezoneService.formatForUser(startTimeUTC, selectedMentor.timezone || 'Asia/Kolkata');

  return {
    bookingId: bookingDoc._id.toString(),
    status: bookingDoc.status,
    parent: {
      id: parentDoc._id.toString(),
      name: parentDoc.name,
      email: parentDoc.email,
      timezone: parentDoc.timezone,
    },
    mentor: {
      id: selectedMentor._id.toString(),
      name: selectedMentor.name,
      email: selectedMentor.email,
      timezone: selectedMentor.timezone || 'Asia/Kolkata',
    },
    appointment: {
      startTimeUTC,
      endTimeUTC,
      durationMinutes,
      meetingLink,
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
      timezone: selectedMentor.timezone || 'Asia/Kolkata',
      date: mentorProjection.date,
      time: mentorProjection.time,
      formatted: mentorProjection.fullFormatted,
      zoneAbbreviation: mentorProjection.zoneAbbreviation,
      zoneNameLong: mentorProjection.zoneNameLong,
      isDST: mentorProjection.isDST,
      mentorDateIST: mentorDateIST,
    },
    timezoneInformation: {
      parentTimezone: timezone,
      mentorTimezone: selectedMentor.timezone || 'Asia/Kolkata',
      parentUtcOffsetMinutes: parentProjection.offsetMinutes,
      mentorUtcOffsetMinutes: mentorProjection.offsetMinutes,
    },
  };
};

export default {
  createTrialBooking,
};
