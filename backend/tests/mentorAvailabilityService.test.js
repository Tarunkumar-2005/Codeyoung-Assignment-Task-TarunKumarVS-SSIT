import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isWithinMentorWorkingHours,
  hasReachedDailyLimit,
  hasScheduleConflict,
  isMentorAvailable,
  getAvailableMentors,
} from '../src/services/mentorAvailabilityService.js';
import { localTimeToUTC } from '../src/services/timezoneService.js';

// Mock Mentor Fixture
const mockMentor = {
  _id: 'mentor_001',
  name: 'Ananya Verma',
  email: 'ananya.verma@codeyoung.com',
  timezone: 'Asia/Kolkata',
  workingHours: { startIST: '10:00', endIST: '20:00' },
  maxDailyDemos: 2,
  isActive: true,
};

const mockMentorEvening = {
  _id: 'mentor_002',
  name: 'Rahul Nair',
  email: 'rahul.nair@codeyoung.com',
  timezone: 'Asia/Kolkata',
  workingHours: { startIST: '14:00', endIST: '23:00' },
  maxDailyDemos: 2,
  isActive: true,
};

describe('MentorAvailabilityService', () => {
  describe('isWithinMentorWorkingHours', () => {
    it('should return true when slot falls within 10:00 - 20:00 IST', () => {
      // 14:00 to 14:45 UTC on Oct 15, 2026
      // In IST (UTC+5:30): 19:30 to 20:15... wait: 14:00 UTC = 19:30 IST. 45 min demo ends at 20:15 IST (after 20:00).
      // Let's test 13:00 UTC (18:30 to 19:15 IST) -> within 10:00 - 20:00 IST.
      const startUtc = '2026-10-15T13:00:00.000Z';
      const endUtc = '2026-10-15T13:45:00.000Z';

      const result = isWithinMentorWorkingHours(mockMentor, startUtc, endUtc);
      assert.equal(result, true);
    });

    it('should return false when slot ends after mentor working hours', () => {
      // 14:30 to 15:15 UTC -> 20:00 to 20:45 IST (exceeds 20:00 IST)
      const startUtc = '2026-10-15T14:30:00.000Z';
      const endUtc = '2026-10-15T15:15:00.000Z';

      const result = isWithinMentorWorkingHours(mockMentor, startUtc, endUtc);
      assert.equal(result, false);
    });

    it('should return false when slot is before mentor working hours in IST', () => {
      // 03:00 UTC -> 08:30 IST (before 10:00 IST)
      const startUtc = '2026-10-15T03:00:00.000Z';
      const endUtc = '2026-10-15T03:45:00.000Z';

      const result = isWithinMentorWorkingHours(mockMentor, startUtc, endUtc);
      assert.equal(result, false);
    });
  });

  describe('hasScheduleConflict (UTC Overlap Check)', () => {
    it('should detect direct and partial overlaps in UTC', async () => {
      const mockBookingRepo = {
        findConflictingBooking: async (mentorId, start, end) => {
          // Simulate an existing confirmed booking from 14:00 to 14:45 UTC
          const existingStart = new Date('2026-10-15T14:00:00.000Z');
          const existingEnd = new Date('2026-10-15T14:45:00.000Z');

          if (start < existingEnd && end > existingStart) {
            return { _id: 'b1', mentorId, status: 'CONFIRMED' };
          }
          return null;
        },
      };

      // Case 1: Exact conflict
      const exactConflict = await hasScheduleConflict(
        'mentor_001',
        '2026-10-15T14:00:00.000Z',
        '2026-10-15T14:45:00.000Z',
        mockBookingRepo
      );
      assert.equal(exactConflict, true);

      // Case 2: Partial overlap (starts 15 min earlier)
      const partialConflict = await hasScheduleConflict(
        'mentor_001',
        '2026-10-15T13:45:00.000Z',
        '2026-10-15T14:30:00.000Z',
        mockBookingRepo
      );
      assert.equal(partialConflict, true);

      // Case 3: No overlap (adjacent slot at 14:45 UTC)
      const noConflict = await hasScheduleConflict(
        'mentor_001',
        '2026-10-15T14:45:00.000Z',
        '2026-10-15T15:30:00.000Z',
        mockBookingRepo
      );
      assert.equal(noConflict, false);
    });
  });

  describe('hasReachedDailyLimit (2 Demos/Day in IST)', () => {
    it('should return false when mentor has 0 or 1 demo on that IST date', async () => {
      const mockBookingRepo = {
        countMentorDailyBookings: async () => 1,
      };

      const reached = await hasReachedDailyLimit('mentor_001', '2026-10-15', 2, mockBookingRepo);
      assert.equal(reached, false);
    });

    it('should return true when mentor already has 2 demos on that IST date', async () => {
      const mockBookingRepo = {
        countMentorDailyBookings: async () => 2,
      };

      const reached = await hasReachedDailyLimit('mentor_001', '2026-10-15', 2, mockBookingRepo);
      assert.equal(reached, true);
    });
  });

  describe('Timezone & Midnight Drift Difference (Parent Date vs UTC Date vs Mentor IST Date)', () => {
    it('should evaluate the 2-demo daily quota on the Mentor IST date even when Parent local date differs', async () => {
      // Parent in New York selects: Monday Oct 12, 2026 at 9:00 PM EDT (21:00 EDT)
      // Parent local date = "2026-10-12" (Monday)
      // UTC timestamp = "2026-10-13T01:00:00.000Z" (Tuesday in UTC)
      // Mentor local time in IST = Tuesday Oct 13, 2026 at 06:30 AM (Tuesday in IST)
      // Mentor calendar date = "2026-10-13"
      const startUtc = localTimeToUTC('2026-10-12T21:00:00', 'America/New_York');
      const endUtc = '2026-10-13T01:45:00.000Z';

      let queriedDate = null;
      const mockBookingRepo = {
        countMentorDailyBookings: async (mentorId, dateIST) => {
          queriedDate = dateIST;
          return 0;
        },
        findConflictingBooking: async () => null,
      };

      // Mock mentor working late night/early morning for test
      const nightMentor = {
        ...mockMentor,
        workingHours: { startIST: '06:00', endIST: '15:00' },
      };

      const check = await isMentorAvailable(nightMentor, startUtc, endUtc, { bookingRepo: mockBookingRepo });
      assert.equal(check.isAvailable, true);
      assert.equal(queriedDate, '2026-10-13', 'Quota MUST be checked against Tuesday 2026-10-13 in IST');
      assert.equal(check.mentorDateIST, '2026-10-13');
    });
  });

  describe('getAvailableMentors', () => {
    it('should return available mentors sorted by lowest daily workload', async () => {
      const mentorsList = [
        {
          _id: 'm1',
          name: 'Mentor 1 (Busy)',
          timezone: 'Asia/Kolkata',
          workingHours: { startIST: '10:00', endIST: '20:00' },
          maxDailyDemos: 2,
          isActive: true,
        },
        {
          _id: 'm2',
          name: 'Mentor 2 (Free)',
          timezone: 'Asia/Kolkata',
          workingHours: { startIST: '10:00', endIST: '20:00' },
          maxDailyDemos: 2,
          isActive: true,
        },
        {
          _id: 'm3',
          name: 'Mentor 3 (Maxed Out)',
          timezone: 'Asia/Kolkata',
          workingHours: { startIST: '10:00', endIST: '20:00' },
          maxDailyDemos: 2,
          isActive: true,
        },
      ];

      const mockBookingRepo = {
        countMentorDailyBookings: async (mentorId) => {
          if (mentorId === 'm1') return 1; // 1 demo booked
          if (mentorId === 'm2') return 0; // 0 demos booked
          if (mentorId === 'm3') return 2; // Maxed out (2 demos booked)
          return 0;
        },
        findConflictingBooking: async () => null,
      };

      const startUtc = '2026-10-15T08:00:00.000Z'; // 13:30 IST
      const endUtc = '2026-10-15T08:45:00.000Z';   // 14:15 IST

      const available = await getAvailableMentors(startUtc, endUtc, {
        mentors: mentorsList,
        bookingRepo: mockBookingRepo,
      });

      // m3 is excluded because it reached 2-demo daily limit
      assert.equal(available.length, 2);

      // m2 (0 demos) should come first due to least-load sorting
      assert.equal(available[0].mentor._id, 'm2');
      assert.equal(available[0].currentDailyDemos, 0);
      assert.equal(available[0].remainingDemosToday, 2);

      // m1 (1 demo) should come second
      assert.equal(available[1].mentor._id, 'm1');
      assert.equal(available[1].currentDailyDemos, 1);
      assert.equal(available[1].remainingDemosToday, 1);
    });
  });
});
