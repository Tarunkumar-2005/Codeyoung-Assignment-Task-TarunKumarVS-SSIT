import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createTrialBooking } from '../src/services/bookingService.js';
import { Mentor } from '../src/models/Mentor.js';
import { Booking } from '../src/models/Booking.js';
import { Parent } from '../src/models/Parent.js';
import { config } from '../src/config/env.js';

describe('Concurrency & Race Condition Mitigation Tests', () => {
  before(async () => {
    await mongoose.connect(config.mongoUri);
    // Clean database before concurrency tests
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});
  });

  after(async () => {
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});
    await mongoose.disconnect();
  });

  it('Scenario 1: Multiple concurrent booking requests for the exact same time slot', async () => {
    // 0. Clean all collections for strict concurrency isolation
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});

    // 1. Seed exactly 2 mentors available for the slot
    const mentors = await Mentor.create([

      {
        name: 'Concurrent Mentor Alpha',
        email: 'alpha.concurrent@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '10:00', endIST: '22:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
      {
        name: 'Concurrent Mentor Beta',
        email: 'beta.concurrent@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '10:00', endIST: '22:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
    ]);

    // 2. Prepare 3 simultaneous booking requests for the exact same slot: 2028-11-20 10:00 AM EDT
    const slotTime = '2028-11-20 10:00';
    const timezone = 'America/New_York';

    const requests = [
      createTrialBooking({
        parent: { name: 'Parent One', email: 'parent1@example.com', timezone },
        startTime: slotTime,
        timezone,
      }),
      createTrialBooking({
        parent: { name: 'Parent Two', email: 'parent2@example.com', timezone },
        startTime: slotTime,
        timezone,
      }),
      createTrialBooking({
        parent: { name: 'Parent Three', email: 'parent3@example.com', timezone },
        startTime: slotTime,
        timezone,
      }),
    ];

    // 3. Fire all 3 requests concurrently via Promise.allSettled
    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 2 should succeed (since only 2 mentors exist)
    assert.equal(fulfilled.length, 2, 'Exactly 2 bookings must succeed for 2 available mentors');
    // Exactly 1 should be rejected with 409
    assert.equal(rejected.length, 1, 'The 3rd concurrent request must be rejected');

    const rejectedError = rejected[0].reason;
    assert.equal(rejectedError.statusCode, 409);
    assert.equal(rejectedError.errorCode, 'NO_MENTOR_AVAILABLE');

    // 4. Verify in Database that the 2 mentors got distinct bookings
    const confirmedBookings = await Booking.find({
      startTimeUTC: new Date('2028-11-20T15:00:00.000Z'), // 10:00 AM EST in Nov = 15:00 UTC
      status: 'CONFIRMED',
    });

    assert.equal(confirmedBookings.length, 2);
    const assignedMentorIds = confirmedBookings.map((b) => b.mentorId.toString());
    const uniqueMentorIds = new Set(assignedMentorIds);
    assert.equal(uniqueMentorIds.size, 2, 'Zero double-booking: Both mentors must be distinct');
  });

  it('Scenario 2: Concurrent requests trying to exceed a mentor 2-demo daily limit', async () => {
    // 1. Clean and seed exactly 1 mentor
    await Booking.deleteMany({});
    await Mentor.deleteMany({});

    const mentor = await Mentor.create({
      name: 'Solo Mentor Gamma',
      email: 'gamma.solo@codeyoung.com',
      timezone: 'Asia/Kolkata',
      workingHours: { startIST: '10:00', endIST: '22:00' },
      maxDailyDemos: 2,
      isActive: true,
    });

    // 2. Pre-book 1 class on 2028-11-25 (so 1 slot remains today)
    const existingParent = await Parent.create({
      name: 'Early Parent',
      email: 'early@example.com',
      timezone: 'America/New_York',
    });

    await Booking.create({
      parentId: existingParent._id,
      mentorId: mentor._id,
      startTimeUTC: new Date('2028-11-25T14:00:00.000Z'),
      endTimeUTC: new Date('2028-11-25T14:45:00.000Z'),
      parentTimezone: 'America/New_York',
      mentorTimezone: 'Asia/Kolkata',
      mentorDateIST: '2028-11-25',
      meetingLink: 'https://meet.codeyoung.com/trial/cy-existing',
      status: 'CONFIRMED',
    });

    // 3. Fire 2 simultaneous booking requests for DIFFERENT slots on that same day
    const timezone = 'America/New_York';
    const reqA = createTrialBooking({
      parent: { name: 'Contender A', email: 'contender.a@example.com', timezone },
      startTime: '2028-11-25 10:00', // Slot A
      timezone,
    });

    const reqB = createTrialBooking({
      parent: { name: 'Contender B', email: 'contender.b@example.com', timezone },
      startTime: '2028-11-25 11:00', // Slot B
      timezone,
    });

    const results = await Promise.allSettled([reqA, reqB]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 should succeed (filling the 2nd and final slot of the day)
    assert.equal(fulfilled.length, 1, 'Only 1 request may claim the remaining daily slot');
    assert.equal(rejected.length, 1, 'The other request must fail as mentor reaches 2/day quota');

    // 4. Verify total bookings in DB for this mentor on this IST date is strictly 2
    const totalDemos = await Booking.countDocuments({
      mentorId: mentor._id,
      mentorDateIST: '2028-11-25',
      status: 'CONFIRMED',
    });

    assert.equal(totalDemos, 2, 'Daily quota of 2 demos must never be exceeded');
  });
});
