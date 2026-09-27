import { DateTime } from 'luxon';
import timezoneService from './timezoneService.js';
import mentorAvailabilityService from './mentorAvailabilityService.js';
import { config } from '../config/env.js';

/**
 * Standard slot times offered to parents throughout their local daytime (09:00 to 20:00).
 */
const DEFAULT_LOCAL_SLOT_HOURS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
];

/**
 * Computes slot availability matrix for a target date in the parent's timezone.
 * 
 * @param {string} dateStr - 'YYYY-MM-DD' in parent's local timezone
 * @param {string} timezone - Valid IANA timezone identifier (e.g. 'America/New_York')
 * @returns {Promise<Array<Object>>}
 */
export const getAvailableSlotsForDate = async (dateStr, timezone) => {
  timezoneService.assertValidTimezone(timezone);

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const err = new Error("Invalid or missing date parameter. Expected 'YYYY-MM-DD'.");
    err.statusCode = 400;
    err.errorCode = 'INVALID_DATE_FORMAT';
    throw err;
  }

  const durationMinutes = config.demoDurationMinutes || 45;
  const slots = [];
  const nowUtc = DateTime.utc();

  for (const timeStr of DEFAULT_LOCAL_SLOT_HOURS) {
    const localDateTimeStr = `${dateStr}T${timeStr}:00`;
    
    // Convert parent local slot time to UTC
    let startTimeUTC;
    try {
      startTimeUTC = timezoneService.localTimeToUTC(localDateTimeStr, timezone);
    } catch (e) {
      continue;
    }

    const startDtUtc = DateTime.fromISO(startTimeUTC, { zone: 'utc' });

    // Skip past slots if target date is today
    if (startDtUtc <= nowUtc) {
      continue;
    }

    const endDtUtc = startDtUtc.plus({ minutes: durationMinutes });
    const endTimeUTC = endDtUtc.toISO();

    // Query mentor fleet availability for this specific UTC slot
    const availableMentors = await mentorAvailabilityService.getAvailableMentors(
      startTimeUTC,
      endTimeUTC
    );

    const localProjection = timezoneService.formatForUser(startTimeUTC, timezone);
    const mentorProjection = timezoneService.formatForUser(startTimeUTC, 'Asia/Kolkata');

    slots.push({
      slotId: `slot_${dateStr}_${timeStr.replace(':', '')}`,
      localDate: dateStr,
      localTime: localProjection.time,
      localTimeFormatted: `${localProjection.time} ${localProjection.zoneAbbreviation}`,
      parentTimezone: timezone,
      startTimeUTC,
      endTimeUTC,
      durationMinutes,
      isAvailable: availableMentors.length > 0,
      availableMentorsCount: availableMentors.length,
      mentorTimeIST: `${mentorProjection.time} IST`,
    });
  }

  return slots;
};

export default {
  getAvailableSlotsForDate,
};
