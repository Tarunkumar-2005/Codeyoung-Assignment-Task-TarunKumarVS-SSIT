import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTimezone,
  assertValidTimezone,
  localTimeToUTC,
  utcToTimezone,
  formatForUser,
  getMentorDateIST,
  formatDualBookingPerspective,
} from '../src/services/timezoneService.js';

describe('TimezoneService', () => {
  describe('validateTimezone', () => {
    it('should validate valid IANA timezone identifiers', () => {
      assert.equal(validateTimezone('Asia/Kolkata'), true);
      assert.equal(validateTimezone('America/New_York'), true);
      assert.equal(validateTimezone('America/Los_Angeles'), true);
      assert.equal(validateTimezone('America/Chicago'), true);
      assert.equal(validateTimezone('Europe/London'), true);
      assert.equal(validateTimezone('UTC'), true);
    });

    it('should reject invalid or malformed timezone identifiers', () => {
      assert.equal(validateTimezone('Invalid/Zone'), false);
      assert.equal(validateTimezone('America/Fake_City'), false);
      assert.equal(validateTimezone('US/Eastern-Invalid'), false);
      assert.equal(validateTimezone(''), false);
      assert.equal(validateTimezone(null), false);
      assert.equal(validateTimezone(undefined), false);
      assert.equal(validateTimezone(123), false);
    });

    it('assertValidTimezone should throw an error with 400 status for invalid zones', () => {
      assert.throws(
        () => assertValidTimezone('Mars/Olympus_Mons'),
        (err) => err.statusCode === 400 && err.errorCode === 'INVALID_TIMEZONE'
      );
    });
  });

  describe('localTimeToUTC', () => {
    describe('America/New_York (US Eastern)', () => {
      it('should correctly convert during DST (EDT: UTC-4 in October)', () => {
        // Oct 15, 2026 is in EDT (UTC-4)
        // 10:00 AM EDT -> 14:00 UTC (2:00 PM UTC)
        const localTime = '2026-10-15T10:00:00';
        const utcIso = localTimeToUTC(localTime, 'America/New_York');
        assert.equal(utcIso, '2026-10-15T14:00:00.000Z');
      });

      it('should correctly convert during Standard Time (EST: UTC-5 in December)', () => {
        // Dec 15, 2026 is in EST (UTC-5)
        // 10:00 AM EST -> 15:00 UTC (3:00 PM UTC)
        const localTime = '2026-12-15T10:00:00';
        const utcIso = localTimeToUTC(localTime, 'America/New_York');
        assert.equal(utcIso, '2026-12-15T15:00:00.000Z');
      });
    });

    describe('Europe/London (UK)', () => {
      it('should correctly convert during British Summer Time (BST: UTC+1 in October)', () => {
        // Oct 01, 2026 is in BST (UTC+1) 
        // 16:00 (4:00 PM) BST -> 15:00 UTC (3:00 PM UTC)
        const localTime = '2026-10-01T16:00:00';
        const utcIso = localTimeToUTC(localTime, 'Europe/London');
        assert.equal(utcIso, '2026-10-01T15:00:00.000Z');
      });

      it('should correctly convert during Greenwich Mean Time (GMT: UTC+0 in November)', () => {
        // Nov 15, 2026 is in GMT (UTC+0)
        // 16:00 (4:00 PM) GMT -> 16:00 UTC (4:00 PM UTC)
        const localTime = '2026-11-15T16:00:00';
        const utcIso = localTimeToUTC(localTime, 'Europe/London');
        assert.equal(utcIso, '2026-11-15T16:00:00.000Z');
      });
    });

    describe('Asia/Kolkata (India - No DST)', () => {
      it('should consistently convert at UTC+5:30 year-round', () => {
        // July (Summer): 19:30 IST -> 14:00 UTC
        const summerIst = '2026-07-10T19:30:00';
        assert.equal(localTimeToUTC(summerIst, 'Asia/Kolkata'), '2026-07-10T14:00:00.000Z');

        // January (Winter): 19:30 IST -> 14:00 UTC
        const winterIst = '2026-01-10T19:30:00';
        assert.equal(localTimeToUTC(winterIst, 'Asia/Kolkata'), '2026-01-10T14:00:00.000Z');
      });
    });
  });

  describe('utcToTimezone and formatForUser', () => {
    it('should format UTC timestamp for a US parent during EDT', () => {
      const utcString = '2026-10-15T14:00:00.000Z';
      const formatted = formatForUser(utcString, 'America/New_York');

      assert.equal(formatted.date, '2026-10-15');
      assert.equal(formatted.time, '10:00 AM');
      assert.equal(formatted.isDST, true);
      assert.equal(formatted.zoneNameLong, 'Eastern Daylight Time');
      assert.equal(formatted.offsetMinutes, -240); // -4 hours
    });

    it('should format UTC timestamp for a US parent during EST (Winter)', () => {
      const utcString = '2026-12-15T15:00:00.000Z';
      const formatted = formatForUser(utcString, 'America/New_York');

      assert.equal(formatted.date, '2026-12-15');
      assert.equal(formatted.time, '10:00 AM');
      assert.equal(formatted.isDST, false);
      assert.equal(formatted.zoneNameLong, 'Eastern Standard Time');
      assert.equal(formatted.offsetMinutes, -300); // -5 hours
    });

    it('should format UTC timestamp for an India mentor (IST)', () => {
      const utcString = '2026-10-15T14:00:00.000Z';
      const formatted = formatForUser(utcString, 'Asia/Kolkata');

      assert.equal(formatted.date, '2026-10-15');
      assert.equal(formatted.time, '07:30 PM');
      assert.equal(formatted.isDST, false);
      assert.equal(formatted.zoneNameLong, 'India Standard Time');
      assert.equal(formatted.offsetMinutes, 330); // +5.5 hours
    });

    it('should format UTC timestamp for a UK parent during BST', () => {
      const utcString = '2026-10-01T15:00:00.000Z';
      const formatted = formatForUser(utcString, 'Europe/London');

      assert.equal(formatted.date, '2026-10-01');
      assert.equal(formatted.time, '04:00 PM');
      assert.equal(formatted.isDST, true);
      assert.equal(formatted.zoneNameLong, 'British Summer Time');
      assert.equal(formatted.offsetMinutes, 60); // +1 hour
    });

    it('should format UTC timestamp for a UK parent during GMT (Winter)', () => {
      const utcString = '2026-11-15T16:00:00.000Z';
      const formatted = formatForUser(utcString, 'Europe/London');

      assert.equal(formatted.date, '2026-11-15');
      assert.equal(formatted.time, '04:00 PM');
      assert.equal(formatted.isDST, false);
      assert.equal(formatted.zoneNameLong, 'Greenwich Mean Time');
      assert.equal(formatted.offsetMinutes, 0); // 0 hours
    });
  });

  describe('Midnight Drift & Mentor IST Calendar Date (getMentorDateIST)', () => {
    it('should correctly shift calendar day when US evening crosses midnight into IST morning', () => {
      // 8:00 PM EDT on Monday Oct 12, 2026
      // In UTC: 2026-10-13T00:00:00.000Z (Tuesday)
      // In IST (UTC+5:30): 5:30 AM on Tuesday Oct 13, 2026
      const localMondayUs = '2026-10-12T20:00:00';
      const utcIso = localTimeToUTC(localMondayUs, 'America/New_York');

      const mentorDateIST = getMentorDateIST(utcIso);
      assert.equal(mentorDateIST, '2026-10-13', 'Mentor date must be Tuesday in IST despite parent booking on Monday evening');
    });
  });

  describe('formatDualBookingPerspective', () => {
    it('should generate complete dual view for booking confirmation', () => {
      const startUtc = '2026-10-15T14:00:00.000Z';
      const endUtc = '2026-10-15T14:45:00.000Z';
      const dual = formatDualBookingPerspective(startUtc, endUtc, 'America/New_York', 'Asia/Kolkata');

      assert.equal(dual.parent.start.time, '10:00 AM');
      assert.equal(dual.parent.end.time, '10:45 AM');
      assert.equal(dual.parent.timezone, 'America/New_York');

      assert.equal(dual.mentor.start.time, '07:30 PM');
      assert.equal(dual.mentor.end.time, '08:15 PM');
      assert.equal(dual.mentor.timezone, 'Asia/Kolkata');
    });
  });
});
