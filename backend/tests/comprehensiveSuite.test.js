import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { Mentor } from '../src/models/Mentor.js';
import { Booking } from '../src/models/Booking.js';
import { Parent } from '../src/models/Parent.js';
import { createTrialBooking } from '../src/services/bookingService.js';
import { getAvailableSlotsForDate } from '../src/services/slotService.js';
import timezoneService from '../src/services/timezoneService.js';
import mentorAvailabilityService from '../src/services/mentorAvailabilityService.js';
import { generateMeetingLink } from '../src/utils/meetingLink.js';
import { DummyMeetingProvider } from '../src/services/meetingService.js';

describe('Codeyoung Trial Booking System - Comprehensive Test Suite (17 Requirements)', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Start ephemeral Express HTTP server for API validation tests
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Reset database state before each test
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});

    // Seed standard fleet of mentors
    await Mentor.create([
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '10:00', endIST: '18:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '14:00', endIST: '22:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '16:00', endIST: '23:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
    ]);
  });

  // =========================================================================
  // Requirement 1: Normal booking
  // =========================================================================
  it('1. Normal booking: should successfully book a trial class and return complete confirmation details', async () => {
    // 2028-10-15 at 10:00 AM EDT (14:00 UTC -> 19:30 IST) -> Within Priya (14-22) & Rohan (16-23)
    const payload = {
      parent: {
        name: 'Jessica Taylor',
        email: 'jessica.taylor@example.com',
        timezone: 'America/New_York',
      },
      startTime: '2028-10-15 10:00',
      timezone: 'America/New_York',
    };

    const confirmation = await createTrialBooking(payload);

    assert.ok(confirmation.bookingId, 'Booking ID must be present');
    assert.equal(confirmation.status, 'CONFIRMED');
    assert.equal(confirmation.parent.name, 'Jessica Taylor');
    assert.equal(confirmation.parent.email, 'jessica.taylor@example.com');
    assert.ok(confirmation.mentor.name, 'Assigned mentor must be present');
    assert.ok(confirmation.appointment.meetingLink.startsWith('https://demo.codeyoung.local/class/'));
    assert.equal(confirmation.parentLocalTime.time, '10:00 AM');
    assert.equal(confirmation.parentLocalTime.zoneAbbreviation, 'EDT');
    assert.equal(confirmation.mentorLocalTime.time, '07:30 PM');
    assert.equal(confirmation.mentorLocalTime.zoneAbbreviation, 'GMT+5:30');

    // Verify database record
    const savedBooking = await Booking.findById(confirmation.bookingId);
    assert.ok(savedBooking);
    assert.equal(savedBooking.status, 'CONFIRMED');
  });

  // =========================================================================
  // Requirement 2: Invalid email
  // =========================================================================
  it('2. Invalid email: should reject malformed email addresses', async () => {
    const invalidEmails = ['plainaddress', 'missing@domain', '@missinguser.com', 'user@domain.'];

    for (const email of invalidEmails) {
      await assert.rejects(
        async () => {
          await createTrialBooking({
            parent: { name: 'Test User', email, timezone: 'America/New_York' },
            startTime: '2028-10-15 10:00',
            timezone: 'America/New_York',
          });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.errorCode, 'INVALID_EMAIL');
          return true;
        }
      );
    }
  });

  // =========================================================================
  // Requirement 3: Invalid timezone
  // =========================================================================
  it('3. Invalid timezone: should reject invalid or non-IANA timezone identifiers', async () => {
    const invalidTimezones = ['Invalid/Timezone', 'Fake/Zone', 'Mars/Curiosity', 'Not_A_Timezone'];

    for (const tz of invalidTimezones) {
      await assert.rejects(
        async () => {
          await createTrialBooking({
            parent: { name: 'Test User', email: 'test@example.com', timezone: tz },
            startTime: '2028-10-15 10:00',
            timezone: tz,
          });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.errorCode, 'INVALID_TIMEZONE');
          return true;
        }
      );
    }
  });

  // =========================================================================
  // Requirement 4: Past appointment
  // =========================================================================
  it('4. Past appointment: should reject booking requests for dates/times in the past', async () => {
    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Past User', email: 'past@example.com', timezone: 'America/New_York' },
          startTime: '2021-05-10 14:00',
          timezone: 'America/New_York',
        });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'PAST_APPOINTMENT_TIME');
        return true;
      }
    );
  });

  // =========================================================================
  // Requirement 5: Mentor working hours
  // =========================================================================
  it('5. Mentor working hours: should strictly evaluate slot against mentor IST working hours', async () => {
    const mentorAarav = await Mentor.findOne({ name: 'Aarav Sharma' }); // 10:00 to 18:00 IST

    // Slot 1: 10:00 to 10:45 IST -> Inside working hours
    const slot1StartUTC = '2028-10-15T04:30:00.000Z'; // 10:00 IST
    const slot1EndUTC = '2028-10-15T05:15:00.000Z';   // 10:45 IST
    assert.equal(mentorAvailabilityService.isWithinMentorWorkingHours(mentorAarav, slot1StartUTC, slot1EndUTC), true);

    // Slot 2: 09:30 to 10:15 IST -> Starts before 10:00 IST
    const slot2StartUTC = '2028-10-15T04:00:00.000Z'; // 09:30 IST
    const slot2EndUTC = '2028-10-15T04:45:00.000Z';   // 10:15 IST
    assert.equal(mentorAvailabilityService.isWithinMentorWorkingHours(mentorAarav, slot2StartUTC, slot2EndUTC), false);

    // Slot 3: 17:30 to 18:15 IST -> Ends after 18:00 IST
    const slot3StartUTC = '2028-10-15T12:00:00.000Z'; // 17:30 IST
    const slot3EndUTC = '2028-10-15T12:45:00.000Z';   // 18:15 IST
    assert.equal(mentorAvailabilityService.isWithinMentorWorkingHours(mentorAarav, slot3StartUTC, slot3EndUTC), false);
  });

  // =========================================================================
  // Requirement 6: Mentor already booked
  // =========================================================================
  it('6. Mentor already booked: should detect schedule conflicts for overlapping intervals', async () => {
    const mentor = await Mentor.findOne({ name: 'Aarav Sharma' });
    const parent = await Parent.create({ name: 'Parent 1', email: 'p1@test.com', timezone: 'America/New_York' });

    // Existing booking: 11:00 to 11:45 IST (05:30 - 06:15 UTC)
    await Booking.create({
      parentId: parent._id,
      mentorId: mentor._id,
      startTimeUTC: new Date('2028-10-15T05:30:00.000Z'),
      endTimeUTC: new Date('2028-10-15T06:15:00.000Z'),
      parentTimezone: 'America/New_York',
      mentorTimezone: 'Asia/Kolkata',
      mentorDateIST: '2028-10-15',
      meetingLink: generateMeetingLink(),
      status: 'CONFIRMED',
    });

    // Exact overlap: 05:30 to 06:15 UTC
    const exactConflict = await mentorAvailabilityService.hasScheduleConflict(
      mentor._id,
      '2028-10-15T05:30:00.000Z',
      '2028-10-15T06:15:00.000Z'
    );
    assert.equal(exactConflict, true);

    // Partial overlap: 05:45 to 06:30 UTC
    const partialConflict = await mentorAvailabilityService.hasScheduleConflict(
      mentor._id,
      '2028-10-15T05:45:00.000Z',
      '2028-10-15T06:30:00.000Z'
    );
    assert.equal(partialConflict, true);

    // Non-overlapping slot: 06:30 to 07:15 UTC
    const noConflict = await mentorAvailabilityService.hasScheduleConflict(
      mentor._id,
      '2028-10-15T06:30:00.000Z',
      '2028-10-15T07:15:00.000Z'
    );
    assert.equal(noConflict, false);
  });

  // =========================================================================
  // Requirement 7: Mentor reaches 2 classes/day
  // =========================================================================
  it('7. Mentor reaches 2 classes/day: should enforce daily quota strictly on mentor IST calendar date', async () => {
    const mentor = await Mentor.findOne({ name: 'Aarav Sharma' });
    const parent = await Parent.create({ name: 'Parent 2', email: 'p2@test.com', timezone: 'America/New_York' });

    // Insert 2 bookings on 2028-10-15 IST
    await Booking.create([
      {
        parentId: parent._id,
        mentorId: mentor._id,
        startTimeUTC: new Date('2028-10-15T05:30:00.000Z'), // 11:00 IST
        endTimeUTC: new Date('2028-10-15T06:15:00.000Z'),
        parentTimezone: 'America/New_York',
        mentorTimezone: 'Asia/Kolkata',
        mentorDateIST: '2028-10-15',
        meetingLink: generateMeetingLink(),
        status: 'CONFIRMED',
      },
      {
        parentId: parent._id,
        mentorId: mentor._id,
        startTimeUTC: new Date('2028-10-15T07:00:00.000Z'), // 12:30 IST
        endTimeUTC: new Date('2028-10-15T07:45:00.000Z'),
        parentTimezone: 'America/New_York',
        mentorTimezone: 'Asia/Kolkata',
        mentorDateIST: '2028-10-15',
        meetingLink: generateMeetingLink(),
        status: 'CONFIRMED',
      },
    ]);

    // Check availability on 2028-10-15 IST (Slot at 14:00 IST -> 08:30 UTC)
    const checkSameDay = await mentorAvailabilityService.isMentorAvailable(
      mentor,
      '2028-10-15T08:30:00.000Z',
      '2028-10-15T09:15:00.000Z'
    );
    assert.equal(checkSameDay.isAvailable, false);
    assert.equal(checkSameDay.reason, 'DAILY_LIMIT_REACHED');

    // Check availability on next calendar day 2028-10-16 IST -> should be available
    const checkNextDay = await mentorAvailabilityService.isMentorAvailable(
      mentor,
      '2028-10-16T05:30:00.000Z',
      '2028-10-16T06:15:00.000Z'
    );
    assert.equal(checkNextDay.isAvailable, true);
  });

  // =========================================================================
  // Requirement 8: Multiple mentors available (Load Balancing)
  // =========================================================================
  it('8. Multiple mentors available: should prioritize least-loaded mentor when multiple candidates match', async () => {
    // Both Priya (14-22 IST) and Rohan (16-23 IST) are available at 18:00 IST (12:30 UTC)
    const priya = await Mentor.findOne({ name: 'Priya Patel' });
    const rohan = await Mentor.findOne({ name: 'Rohan Gupta' });
    const parent = await Parent.create({ name: 'Parent Load', email: 'load@test.com', timezone: 'America/New_York' });

    // Give Priya 1 demo already on 2028-10-15 IST
    await Booking.create({
      parentId: parent._id,
      mentorId: priya._id,
      startTimeUTC: new Date('2028-10-15T09:00:00.000Z'),
      endTimeUTC: new Date('2028-10-15T09:45:00.000Z'),
      parentTimezone: 'America/New_York',
      mentorTimezone: 'Asia/Kolkata',
      mentorDateIST: '2028-10-15',
      meetingLink: generateMeetingLink(),
      status: 'CONFIRMED',
    });

    // Request booking for 12:30 UTC (18:00 IST)
    const available = await mentorAvailabilityService.getAvailableMentors(
      '2028-10-15T12:30:00.000Z',
      '2028-10-15T13:15:00.000Z'
    );

    assert.equal(available.length, 2);
    // Rohan has 0 bookings today, Priya has 1 booking today -> Rohan must be first in sorted candidates
    assert.equal(available[0].mentor.name, 'Rohan Gupta');
    assert.equal(available[0].currentDailyDemos, 0);
    assert.equal(available[1].mentor.name, 'Priya Patel');
    assert.equal(available[1].currentDailyDemos, 1);
  });

  // =========================================================================
  // Requirement 9: No mentors available
  // =========================================================================
  it('9. No mentors available: should return 409 status with suggested alternative slots on the same day', async () => {
    // 03:00 AM IST (21:30 UTC) is outside all mentors working hours
    const payload = {
      parent: {
        name: 'Late Parent',
        email: 'late@example.com',
        timezone: 'America/New_York',
      },
      startTime: '2028-10-15 17:30', // 17:30 EDT = 21:30 UTC = 03:00 IST
      timezone: 'America/New_York',
    };

    await assert.rejects(
      async () => {
        await createTrialBooking(payload);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.errorCode, 'NO_MENTOR_AVAILABLE');
        assert.equal(err.message, 'No mentor is available for this time.');
        assert.ok(Array.isArray(err.details.suggestedAlternativeSlots));
        assert.ok(err.details.suggestion);
        return true;
      }
    );
  });

  // =========================================================================
  // Requirement 10: Parent in America/New_York
  // =========================================================================
  it('10. Parent in America/New_York: should accurately convert slots during EDT and EST', async () => {
    // Case A: October (EDT, UTC-4)
    const edtLocal = '2028-10-15 10:00';
    const edtUtc = timezoneService.localTimeToUTC(edtLocal, 'America/New_York');
    assert.equal(edtUtc, '2028-10-15T14:00:00.000Z');
    const edtProjection = timezoneService.formatForUser(edtUtc, 'America/New_York');
    assert.equal(edtProjection.time, '10:00 AM');
    assert.equal(edtProjection.zoneAbbreviation, 'EDT');
    assert.equal(edtProjection.isDST, true);

    // Case B: December (EST, UTC-5)
    const estLocal = '2028-12-15 10:00';
    const estUtc = timezoneService.localTimeToUTC(estLocal, 'America/New_York');
    assert.equal(estUtc, '2028-12-15T15:00:00.000Z');
    const estProjection = timezoneService.formatForUser(estUtc, 'America/New_York');
    assert.equal(estProjection.time, '10:00 AM');
    assert.equal(estProjection.zoneAbbreviation, 'EST');
    assert.equal(estProjection.isDST, false);
  });

  // =========================================================================
  // Requirement 11: Parent in Europe/London
  // =========================================================================
  it('11. Parent in Europe/London: should accurately convert slots during BST and GMT', async () => {
    // Case A: October (BST, UTC+1)
    const bstLocal = '2028-10-15 14:00';
    const bstUtc = timezoneService.localTimeToUTC(bstLocal, 'Europe/London');
    assert.equal(bstUtc, '2028-10-15T13:00:00.000Z');
    const bstProjection = timezoneService.formatForUser(bstUtc, 'Europe/London');
    assert.equal(bstProjection.time, '02:00 PM');
    assert.equal(bstProjection.zoneNameLong, 'British Summer Time');
    assert.equal(bstProjection.offsetMinutes, 60);
    assert.equal(bstProjection.isDST, true);

    // Case B: December (GMT, UTC+0)
    const gmtLocal = '2028-12-15 14:00';
    const gmtUtc = timezoneService.localTimeToUTC(gmtLocal, 'Europe/London');
    assert.equal(gmtUtc, '2028-12-15T14:00:00.000Z');
    const gmtProjection = timezoneService.formatForUser(gmtUtc, 'Europe/London');
    assert.equal(gmtProjection.time, '02:00 PM');
    assert.equal(gmtProjection.zoneNameLong, 'Greenwich Mean Time');
    assert.equal(gmtProjection.offsetMinutes, 0);
    assert.equal(gmtProjection.isDST, false);
  });

  // =========================================================================
  // Requirement 12: Mentor in Asia/Kolkata
  // =========================================================================
  it('12. Mentor in Asia/Kolkata: should handle midnight drift where parent evening is mentor next-day morning', async () => {
    // Sunday 9:00 PM EDT (2028-10-15 21:00 EDT)
    // 21:00 EDT = 01:00 UTC (2028-10-16) = 06:30 AM IST (2028-10-16)
    const startUtc = '2028-10-16T01:00:00.000Z';

    const parentView = timezoneService.formatForUser(startUtc, 'America/New_York');
    assert.equal(parentView.date, '2028-10-15');
    assert.equal(parentView.time, '09:00 PM');

    const mentorView = timezoneService.formatForUser(startUtc, 'Asia/Kolkata');
    assert.equal(mentorView.date, '2028-10-16');
    assert.equal(mentorView.time, '06:30 AM');

    const mentorDateIST = timezoneService.getMentorDateIST(startUtc);
    assert.equal(mentorDateIST, '2028-10-16');
  });

  // =========================================================================
  // Requirement 13: DST transition dates
  // =========================================================================
  it('13. DST transition dates: should handle daylight saving transitions without manual offset math', () => {
    // US Spring Forward: 2028-03-12 (2:00 AM jumps to 3:00 AM)
    // Before transition (Standard Time EST): 2028-03-11 10:00 EST -> UTC-5
    const usBefore = timezoneService.localTimeToUTC('2028-03-11 10:00', 'America/New_York');
    assert.equal(usBefore, '2028-03-11T15:00:00.000Z');

    // After transition (Daylight Time EDT): 2028-03-13 10:00 EDT -> UTC-4
    const usAfter = timezoneService.localTimeToUTC('2028-03-13 10:00', 'America/New_York');
    assert.equal(usAfter, '2028-03-13T14:00:00.000Z');

    // UK Fall Back: 2028-10-29 (2:00 AM falls back to 1:00 AM)
    // Before transition (British Summer Time BST): 2028-10-28 10:00 BST -> UTC+1
    const ukBefore = timezoneService.localTimeToUTC('2028-10-28 10:00', 'Europe/London');
    assert.equal(ukBefore, '2028-10-28T09:00:00.000Z');

    // After transition (Greenwich Mean Time GMT): 2028-10-30 10:00 GMT -> UTC+0
    const ukAfter = timezoneService.localTimeToUTC('2028-10-30 10:00', 'Europe/London');
    assert.equal(ukAfter, '2028-10-30T10:00:00.000Z');
  });

  // =========================================================================
  // Requirement 14: Same-time concurrent booking attempts
  // =========================================================================
  it('14. Same-time concurrent booking attempts: should prevent double bookings and assign distinct mentors safely', async () => {
    // Slot: 2028-10-15 10:00 EDT -> 14:00 UTC (19:30 IST)
    // Priya (14-22 IST) and Rohan (16-23 IST) are available -> exactly 2 capacity for this slot
    const concurrentRequests = Array.from({ length: 4 }).map((_, index) =>
      createTrialBooking({
        parent: {
          name: `Concurrent Parent ${index + 1}`,
          email: `concurrent${index + 1}@example.com`,
          timezone: 'America/New_York',
        },
        startTime: '2028-10-15 10:00',
        timezone: 'America/New_York',
      })
    );

    const results = await Promise.allSettled(concurrentRequests);
    const successful = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const rejected = results.filter((r) => r.status === 'rejected').map((r) => r.reason);

    // Exactly 2 bookings must succeed (Priya and Rohan)
    assert.equal(successful.length, 2, 'Exactly 2 mentors should be booked for this slot');
    assert.equal(rejected.length, 2, '2 excess requests must receive 409 error');

    // Ensure mentors are distinct (zero double booking of the same mentor)
    const bookedMentorIds = successful.map((b) => b.mentor.id);
    const uniqueMentorIds = new Set(bookedMentorIds);
    assert.equal(uniqueMentorIds.size, 2, 'Each mentor must have at most 1 confirmed booking for this slot');

    // Confirm DB has exactly 2 records
    const dbCount = await Booking.countDocuments({
      startTimeUTC: new Date('2028-10-15T14:00:00.000Z'),
      status: 'CONFIRMED',
    });
    assert.equal(dbCount, 2);
  });

  // =========================================================================
  // Requirement 15: Meeting link generation
  // =========================================================================
  it('15. Meeting link generation: should create secure, unique dummy class links without leaking PII', async () => {
    const link1 = generateMeetingLink();
    const link2 = generateMeetingLink();

    assert.ok(link1.startsWith('https://demo.codeyoung.local/class/'));
    assert.notEqual(link1, link2, 'Generated links must be unique');

    // Meeting ID must be a valid UUID v4
    const uuid = link1.replace('https://demo.codeyoung.local/class/', '');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(uuid, uuidRegex);

    // Ensure custom provider works
    const customProvider = new DummyMeetingProvider('https://custom.codeyoung.com/room');
    const result = await customProvider.createMeetingRoom();
    assert.ok(result.meetingLink.startsWith('https://custom.codeyoung.com/room/'));
  });

  // =========================================================================
  // Requirement 16: API validation (HTTP Layer)
  // =========================================================================
  it('16. API validation: should enforce input validation, malformed ID handling, and standard error envelopes', async () => {
    // 16.1 Missing JSON payload
    const resEmpty = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(resEmpty.status, 400);
    const jsonEmpty = await resEmpty.json();
    assert.equal(jsonEmpty.success, false);
    assert.equal(jsonEmpty.error.code, 'MISSING_PARENT_DETAILS');

    // 16.2 Malformed Mentor ID
    const resId = await fetch(`${baseUrl}/api/mentors/invalid-mongo-id-123`);
    assert.equal(resId.status, 400);
    const jsonId = await resId.json();
    assert.equal(jsonId.success, false);
    assert.equal(jsonId.error.code, 'MALFORMED_ID');

    // 16.3 Missing date in slots endpoint
    const resSlots = await fetch(`${baseUrl}/api/slots/available?timezone=America/New_York`);
    assert.equal(resSlots.status, 400);
    const jsonSlots = await resSlots.json();
    assert.equal(jsonSlots.success, false);
    assert.equal(jsonSlots.error.code, 'INVALID_DATE_FORMAT');

    // 16.4 Health endpoint
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.equal(resHealth.status, 200);
    const jsonHealth = await resHealth.json();
    assert.equal(jsonHealth.data.status, 'healthy');
  });

  // =========================================================================
  // Requirement 17: Slot generation
  // =========================================================================
  it('17. Slot generation: should generate daytime slots matrix with mentor availability indicators', async () => {
    const slots = await getAvailableSlotsForDate('2028-10-15', 'America/New_York');

    assert.ok(Array.isArray(slots));
    assert.ok(slots.length > 0);

    // Verify slot structure
    const firstSlot = slots[0];
    assert.ok(firstSlot.slotId);
    assert.equal(firstSlot.localDate, '2028-10-15');
    assert.equal(firstSlot.parentTimezone, 'America/New_York');
    assert.equal(firstSlot.durationMinutes, 45);
    assert.equal(typeof firstSlot.isAvailable, 'boolean');
    assert.ok(firstSlot.localTimeFormatted);
    assert.ok(firstSlot.mentorTimeIST);

    // 10:00 AM slot EDT (14:00 UTC -> 19:30 IST) should have 2 mentors available (Priya & Rohan)
    const slot10am = slots.find((s) => s.localTime === '10:00 AM');
    assert.ok(slot10am);
    assert.equal(slot10am.isAvailable, true);
    assert.equal(slot10am.availableMentorsCount, 2);
  });
});
