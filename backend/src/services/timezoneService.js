import { DateTime, IANAZone } from 'luxon';

/**
 * Reusable Timezone Service powered by Luxon & IANA Database
 * Strictly enforces UTC for storage/network and dynamic IANA resolution for local views.
 */

/**
 * Validates whether a given timezone string is a valid IANA identifier.
 * @param {string} timezone - e.g. 'America/New_York', 'Asia/Kolkata', 'Europe/London'
 * @returns {boolean}
 */
export const validateTimezone = (timezone) => {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }
  return IANAZone.isValidZone(timezone.trim());
};

/**
 * Asserts timezone validity or throws a descriptive error.
 * @param {string} timezone
 */
export const assertValidTimezone = (timezone) => {
  if (!validateTimezone(timezone)) {
    const error = new Error(`Invalid IANA timezone identifier: '${timezone}'. Expected format like 'America/New_York', 'Europe/London', or 'Asia/Kolkata'.`);
    error.statusCode = 400;
    error.errorCode = 'INVALID_TIMEZONE';
    throw error;
  }
};

/**
 * Converts a local date/time string within a specified IANA timezone into an unambiguous UTC ISO 8601 string.
 * Automatically resolves DST rules for that specific date.
 * 
 * @param {string|Date} localDateTime - e.g. '2026-10-15T10:00:00' or '2026-10-15 10:00'
 * @param {string} timezone - Valid IANA timezone identifier (e.g. 'America/New_York')
 * @returns {string} - Unambiguous UTC ISO string (e.g. '2026-10-15T14:00:00.000Z')
 */
export const localTimeToUTC = (localDateTime, timezone) => {
  assertValidTimezone(timezone);

  if (!localDateTime) {
    throw new Error('localDateTime parameter is required.');
  }

  let dt;
  if (localDateTime instanceof Date) {
    dt = DateTime.fromISO(localDateTime.toISOString(), { zone: 'utc' }).setZone(timezone);
  } else if (typeof localDateTime === 'string') {
    const normalized = localDateTime.trim().replace(' ', 'T');
    dt = DateTime.fromISO(normalized, { zone: timezone });
  } else {
    throw new Error('Unsupported localDateTime format. Expected ISO string or Date.');
  }

  if (!dt.isValid) {
    const error = new Error(`Failed to parse local datetime '${localDateTime}' in timezone '${timezone}': ${dt.invalidReason}`);
    error.statusCode = 400;
    error.errorCode = 'INVALID_DATETIME';
    throw error;
  }

  return dt.toUTC().toISO();
};

/**
 * Converts a UTC timestamp into a Luxon DateTime instance in the target IANA timezone.
 * 
 * @param {string|Date} utcDateTime - UTC timestamp (e.g. '2026-10-15T14:00:00.000Z' or Date)
 * @param {string} timezone - Target IANA timezone identifier (e.g. 'Asia/Kolkata')
 * @returns {DateTime} - Luxon DateTime instance set to target zone
 */
export const utcToTimezone = (utcDateTime, timezone) => {
  assertValidTimezone(timezone);

  if (!utcDateTime) {
    throw new Error('utcDateTime parameter is required.');
  }

  let dtUtc;
  if (utcDateTime instanceof Date) {
    dtUtc = DateTime.fromJSDate(utcDateTime, { zone: 'utc' });
  } else if (typeof utcDateTime === 'string') {
    dtUtc = DateTime.fromISO(utcDateTime, { zone: 'utc' });
  } else if (DateTime.isDateTime(utcDateTime)) {
    dtUtc = utcDateTime.setZone('utc');
  } else {
    throw new Error('Unsupported utcDateTime format. Expected ISO string, Date, or Luxon DateTime.');
  }

  if (!dtUtc.isValid) {
    const error = new Error(`Failed to parse UTC datetime '${utcDateTime}': ${dtUtc.invalidReason}`);
    error.statusCode = 400;
    error.errorCode = 'INVALID_UTC_DATETIME';
    throw error;
  }

  return dtUtc.setZone(timezone);
};

/**
 * Formats a UTC timestamp for presentation to a parent or mentor in their local timezone.
 * Includes clear date, time, and timezone abbreviation badges (e.g. EDT, BST, IST) to prevent ambiguity.
 * 
 * @param {string|Date} utcDateTime - UTC timestamp
 * @param {string} timezone - Target IANA timezone identifier
 * @returns {Object} Structured presentation object
 */
export const formatForUser = (utcDateTime, timezone) => {
  const dtLocal = utcToTimezone(utcDateTime, timezone);

  return {
    isoUtc: dtLocal.toUTC().toISO(),
    timezone: timezone,
    date: dtLocal.toFormat('yyyy-MM-dd'),
    time: dtLocal.toFormat('hh:mm a'),
    fullFormatted: dtLocal.toFormat("cccc, LLL dd, yyyy 'at' hh:mm a (ZZZZ)"),
    shortFormatted: dtLocal.toFormat('LLL dd, yyyy · hh:mm a ZZZZ'),
    zoneAbbreviation: dtLocal.toFormat('ZZZZ'), // e.g. "EDT", "GMT+1", "GMT+5:30"
    zoneNameLong: dtLocal.offsetNameLong, // e.g. "British Summer Time", "Eastern Daylight Time", "India Standard Time"
    offsetMinutes: dtLocal.offset,
    isDST: dtLocal.isInDST,
  };
};

/**
 * Helper to get the Mentor Calendar Date in IST ('YYYY-MM-DD') for daily quota indexing.
 * @param {string|Date} utcDateTime
 * @returns {string} - 'YYYY-MM-DD'
 */
export const getMentorDateIST = (utcDateTime) => {
  const dtIst = utcToTimezone(utcDateTime, 'Asia/Kolkata');
  return dtIst.toFormat('yyyy-MM-dd');
};

/**
 * Helper to generate dual presentation (Parent perspective + Mentor perspective).
 * @param {string|Date} startUtc
 * @param {string|Date} endUtc
 * @param {string} parentTimezone
 * @param {string} mentorTimezone
 */
export const formatDualBookingPerspective = (startUtc, endUtc, parentTimezone, mentorTimezone = 'Asia/Kolkata') => {
  return {
    startUtc: typeof startUtc === 'string' ? startUtc : startUtc.toISOString(),
    endUtc: typeof endUtc === 'string' ? endUtc : endUtc.toISOString(),
    parent: {
      timezone: parentTimezone,
      start: formatForUser(startUtc, parentTimezone),
      end: formatForUser(endUtc, parentTimezone),
    },
    mentor: {
      timezone: mentorTimezone,
      start: formatForUser(startUtc, mentorTimezone),
      end: formatForUser(endUtc, mentorTimezone),
    },
  };
};

export default {
  validateTimezone,
  assertValidTimezone,
  localTimeToUTC,
  utcToTimezone,
  formatForUser,
  getMentorDateIST,
  formatDualBookingPerspective,
};
