import { DateTime } from 'luxon';

export const SUPPORTED_TIMEZONES = [
  { id: 'America/New_York', label: 'US Eastern Time (New York, Miami, Atlanta)', region: 'US' },
  { id: 'America/Chicago', label: 'US Central Time (Chicago, Dallas, Houston)', region: 'US' },
  { id: 'America/Denver', label: 'US Mountain Time (Denver, Phoenix)', region: 'US' },
  { id: 'America/Los_Angeles', label: 'US Pacific Time (Los Angeles, Seattle, SF)', region: 'US' },
  { id: 'Europe/London', label: 'UK Time (London, Edinburgh, Manchester)', region: 'UK' },
  { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'India' },
];

export const detectBrowserTimezone = () => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      // If exact match in supported list
      const matched = SUPPORTED_TIMEZONES.find((tz) => tz.id === detected);
      if (matched) return matched.id;

      // Map US generic zones
      if (detected.includes('New_York') || detected.includes('Detroit') || detected.includes('Indiana')) return 'America/New_York';
      if (detected.includes('Chicago') || detected.includes('Menominee')) return 'America/Chicago';
      if (detected.includes('Denver') || detected.includes('Boise') || detected.includes('Phoenix')) return 'America/Denver';
      if (detected.includes('Los_Angeles')) return 'America/Los_Angeles';
      if (detected.includes('London')) return 'Europe/London';
      if (detected.includes('Calcutta') || detected.includes('Kolkata')) return 'Asia/Kolkata';

      return detected;
    }
  } catch (e) {
    // fallback
  }
  return 'America/New_York';
};

export const getTimezoneOffsetLabel = (timezone) => {
  try {
    const dt = DateTime.now().setZone(timezone);
    return `${dt.toFormat('ZZZZ')} (${dt.offsetNameLong || timezone})`;
  } catch (e) {
    return timezone;
  }
};
