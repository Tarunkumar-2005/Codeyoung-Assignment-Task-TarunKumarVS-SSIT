import { DateTime } from 'luxon';

export const POPULAR_TIMEZONES = [
  { id: 'America/New_York', label: 'US Eastern Time (New York, Miami, Atlanta)', region: 'US' },
  { id: 'America/Chicago', label: 'US Central Time (Chicago, Dallas, Houston)', region: 'US' },
  { id: 'America/Denver', label: 'US Mountain Time (Denver, Phoenix)', region: 'US' },
  { id: 'America/Los_Angeles', label: 'US Pacific Time (Los Angeles, Seattle, SF)', region: 'US' },
  { id: 'Europe/London', label: 'UK Time (London, Edinburgh, Manchester)', region: 'UK' },
  { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'India' },
];

export const SUPPORTED_TIMEZONES = POPULAR_TIMEZONES;

/**
 * Detects browser timezone using the standard Intl API.
 * @returns {string} - Detected IANA timezone string
 */
export const detectBrowserTimezone = () => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      return detected;
    }
  } catch (e) {
    console.warn('Could not auto-detect browser timezone, falling back to America/New_York');
  }
  return 'America/New_York';
};

/**
 * Gets a clean, comprehensive list of timezone options including the detected user timezone.
 */
export const getAvailableTimezoneOptions = () => {
  const detected = detectBrowserTimezone();
  const exists = POPULAR_TIMEZONES.some((tz) => tz.id === detected);

  if (!exists && detected) {
    return [
      {
        id: detected,
        label: `${detected} (Detected Local)`,
        region: 'Auto-detected',
      },
      ...POPULAR_TIMEZONES,
    ];
  }

  return POPULAR_TIMEZONES;
};

/**
 * Formats a time string or ISO UTC timestamp strictly with an unambiguous timezone badge.
 * e.g., "10:00 AM EDT" or "07:30 PM IST"
 */
export const formatTimeWithZoneBadge = (timeOrUtc, timezone) => {
  try {
    if (!timeOrUtc) return '';
    if (typeof timeOrUtc === 'string' && timeOrUtc.includes('T')) {
      const dt = DateTime.fromISO(timeOrUtc, { zone: 'utc' }).setZone(timezone);
      return `${dt.toFormat('hh:mm a')} ${dt.toFormat('ZZZZ')}`;
    }
    const dt = DateTime.now().setZone(timezone);
    return `${timeOrUtc} ${dt.toFormat('ZZZZ')}`;
  } catch (e) {
    return `${timeOrUtc} (${timezone})`;
  }
};

/**
 * Returns formatted abbreviation for a timezone at the current moment or specific date.
 * e.g., "EDT", "EST", "BST", "GMT", "IST"
 */
export const getTimezoneAbbreviation = (timezone, dateObj = null) => {
  try {
    const dt = dateObj ? DateTime.fromJSDate(dateObj).setZone(timezone) : DateTime.now().setZone(timezone);
    return dt.toFormat('ZZZZ');
  } catch (e) {
    return timezone;
  }
};
