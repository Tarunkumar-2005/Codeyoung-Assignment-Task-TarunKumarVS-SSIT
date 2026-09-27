import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createTrialBooking } from '../src/services/bookingService.js';
import { Booking } from '../src/models/Booking.js';
import { Parent } from '../src/models/Parent.js';
import { Mentor } from '../src/models/Mentor.js';
import { INITIAL_MENTORS } from '../src/seeds/seedMentors.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/codeyoung_booking';

describe('Parent Booking Rules & Daily Quota Guardrails (12 Test Cases)', () => {
  before(async () => {
    await mongoose.connect(MONGO_URI);
    // Seed fresh mentors
    await Mentor.deleteMany({});
    await Mentor.insertMany(INITIAL_MENTORS);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear bookings and parents before each test for clean isolation
    await Booking.deleteMany({});
    await Parent.deleteMany({});
  });

  // TEST 1: Parent has 0 bookings today -> Booking succeeds
  it('TEST 1: should allow booking when parent has 0 bookings today', async () => {
    const res = await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    assert.ok(res.bookingId);
    assert.equal(res.status, 'CONFIRMED');
    assert.equal(res.parent.email, 'sohan@gmail.com');

    const count = await Booking.countDocuments({ parentId: res.parent.id, status: 'CONFIRMED' });
    assert.equal(count, 1);
  });

  // TEST 2: Parent has 1 booking today -> Second different time succeeds
  it('TEST 2: should allow second booking on the same day for a different time', async () => {
    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    const res2 = await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T11:30:00',
      timezone: 'Asia/Kolkata',
    });

    assert.ok(res2.bookingId);
    assert.equal(res2.status, 'CONFIRMED');

    const count = await Booking.countDocuments({ parentId: res2.parent.id, status: 'CONFIRMED' });
    assert.equal(count, 2);
  });

  // TEST 3: Parent has 2 bookings today -> Third booking is rejected
  it('TEST 3: should reject a third booking on the same calendar day for the same parent', async () => {
    // Booking 1
    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    // Booking 2
    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T11:30:00',
      timezone: 'Asia/Kolkata',
    });

    // Booking 3 -> Must be rejected with 409 PARENT_DAILY_LIMIT_REACHED
    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
          startTime: '2026-10-05T14:00:00',
          timezone: 'Asia/Kolkata',
        });
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.errorCode, 'PARENT_DAILY_LIMIT_REACHED');
        assert.match(err.message, /maximum of 2 trial classes/i);
        return true;
      }
    );

    const parentDoc = await Parent.findOne({ email: 'sohan@gmail.com' });
    const count = await Booking.countDocuments({ parentId: parentDoc._id, status: 'CONFIRMED' });
    assert.equal(count, 2, 'Must never exceed 2 active bookings in database');
  });

  // TEST 4: Same parent + same time -> Duplicate rejected
  it('TEST 4: should reject duplicate booking for the exact same time by the same parent', async () => {
    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
          startTime: '2026-10-05T10:00:00',
          timezone: 'Asia/Kolkata',
        });
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.errorCode, 'DUPLICATE_PARENT_BOOKING');
        assert.match(err.message, /already have a trial class booked for this time/i);
        return true;
      }
    );
  });

  // TEST 5: Same parent email with different email casing -> Treated as the same parent
  it('TEST 5: should treat SOHAN@GMAIL.COM and sohan@gmail.com as the exact same parent identity', async () => {
    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    await createTrialBooking({
      parent: { name: 'Sohan', email: 'SOHAN@GMAIL.COM', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T11:30:00',
      timezone: 'Asia/Kolkata',
    });

    // 3rd booking with mixed casing must be rejected
    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Sohan', email: 'Sohan@Gmail.Com', timezone: 'Asia/Kolkata' },
          startTime: '2026-10-05T14:00:00',
          timezone: 'Asia/Kolkata',
        });
      },
      (err) => {
        assert.equal(err.errorCode, 'PARENT_DAILY_LIMIT_REACHED');
        return true;
      }
    );
  });

  // TEST 6: Same parent with whitespace around email -> Treated as the same parent
  it('TEST 6: should trim whitespace around email and treat as the same parent identity', async () => {
    await createTrialBooking({
      parent: { name: 'Sohan', email: '  sohan@gmail.com  ', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T11:30:00',
      timezone: 'Asia/Kolkata',
    });

    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Sohan', email: '   sohan@gmail.com ', timezone: 'Asia/Kolkata' },
          startTime: '2026-10-05T14:00:00',
          timezone: 'Asia/Kolkata',
        });
      },
      (err) => {
        assert.equal(err.errorCode, 'PARENT_DAILY_LIMIT_REACHED');
        return true;
      }
    );
  });

  // TEST 7: Different parent + same time -> Can book if a different mentor is available
  it('TEST 7: should allow different parents to book the exact same time slot with different mentors', async () => {
    const resA = await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    const resB = await createTrialBooking({
      parent: { name: 'Rahul', email: 'rahul@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    assert.ok(resA.bookingId);
    assert.ok(resB.bookingId);
    assert.notEqual(resA.bookingId, resB.bookingId);
    assert.notEqual(resA.mentor.id, resB.mentor.id, 'Different mentors should be assigned for the same slot');
  });

  // TEST 8: Different parent + same mentor + same time -> Mentor conflict prevents overlapping assignment
  it('TEST 8: should never assign the same mentor to two overlapping appointments at the same time', async () => {
    const resA = await createTrialBooking({
      parent: { name: 'Sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
    });

    const assignedMentorId = resA.mentor.id;

    // Try booking with preferredMentorId set to the same mentor at the same time
    const resB = await createTrialBooking({
      parent: { name: 'Rahul', email: 'rahul@gmail.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
      preferredMentorId: assignedMentorId,
      strictMentor: false,
    });

    assert.notEqual(resB.mentor.id, assignedMentorId, 'System must assign another available mentor rather than conflict');
  });

  // TEST 9: Mentor has 2 classes -> Third class cannot be assigned to that mentor
  it('TEST 9: should enforce 2-class maximum daily limit for a mentor', async () => {
    const mentorDoc = await Mentor.findOne({ email: 'rohan.sharma@codeyoung.com' });

    // Booking 1 for Rohan
    await createTrialBooking({
      parent: { name: 'Parent 1', email: 'p1@test.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Asia/Kolkata',
      preferredMentorId: mentorDoc._id.toString(),
    });

    // Booking 2 for Rohan
    await createTrialBooking({
      parent: { name: 'Parent 2', email: 'p2@test.com', timezone: 'Asia/Kolkata' },
      startTime: '2026-10-05T11:30:00',
      timezone: 'Asia/Kolkata',
      preferredMentorId: mentorDoc._id.toString(),
    });

    const rohanCount = await Booking.countDocuments({
      mentorId: mentorDoc._id,
      mentorDateIST: '2026-10-05',
      status: 'CONFIRMED',
    });
    assert.equal(rohanCount, 2);

    // Attempt 3rd booking strictly for Rohan -> Must fail
    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Parent 3', email: 'p3@test.com', timezone: 'Asia/Kolkata' },
          startTime: '2026-10-05T14:00:00',
          timezone: 'Asia/Kolkata',
          preferredMentorId: mentorDoc._id.toString(),
          strictMentor: true,
        });
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.errorCode, 'MENTOR_CAPACITY_REACHED');
        return true;
      }
    );
  });

  // TEST 10: Parent has 2 bookings on one local calendar day but UTC timestamps span two UTC dates -> Still counts as 2 bookings for parent's local day
  it('TEST 10: should calculate parent daily quota using parent local calendar date when spanning UTC dates', async () => {
    // Parent in America/New_York (UTC-4 in Oct)
    // Booking 1: 2026-10-05 10:00 AM EDT (14:00 UTC on 2026-10-05)
    await createTrialBooking({
      parent: { name: 'Sarah', email: 'sarah.ny@test.com', timezone: 'America/New_York' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'America/New_York',
    });

    // Booking 2: 2026-10-05 03:00 PM EDT (15:00 EDT = 19:00 UTC on 2026-10-05 = 00:30 IST on 2026-10-06!)
    await createTrialBooking({
      parent: { name: 'Sarah', email: 'sarah.ny@test.com', timezone: 'America/New_York' },
      startTime: '2026-10-05T15:00:00',
      timezone: 'America/New_York',
    });

    // Both belong to 2026-10-05 in parent's timezone. Attempting a 3rd on 2026-10-05 must be rejected
    await assert.rejects(
      async () => {
        await createTrialBooking({
          parent: { name: 'Sarah', email: 'sarah.ny@test.com', timezone: 'America/New_York' },
          startTime: '2026-10-05T11:00:00',
          timezone: 'America/New_York',
        });
      },
      (err) => {
        assert.equal(err.errorCode, 'PARENT_DAILY_LIMIT_REACHED');
        return true;
      }
    );
  });

  // TEST 11: Mentor local calendar day differs from parent calendar day -> Respective timezones used
  it('TEST 11: should evaluate parent quota in parent timezone and mentor quota in IST independently', async () => {
    // 2026-10-05 03:00 PM EDT = 19:00 UTC = 2026-10-06 00:30 IST (Next Day in India)
    const res = await createTrialBooking({
      parent: { name: 'Liam', email: 'liam@test.com', timezone: 'America/New_York' },
      startTime: '2026-10-05T15:00:00',
      timezone: 'America/New_York',
    });

    const bookingDoc = await Booking.findById(res.bookingId);
    assert.equal(bookingDoc.parentDateLocal, '2026-10-05', 'Parent local date must be 2026-10-05');
    assert.equal(bookingDoc.mentorDateIST, '2026-10-06', 'Mentor IST date must be 2026-10-06');
  });

  // TEST 12: Two concurrent booking requests from the same parent -> Max 2-per-day rule remains intact
  it('TEST 12: should prevent race condition when parent concurrently submits multiple bookings', async () => {
    // Pre-populate 1 booking for parent
    await createTrialBooking({
      parent: { name: 'Concurrent Parent', email: 'concurrent@test.com', timezone: 'Europe/London' },
      startTime: '2026-10-05T10:00:00',
      timezone: 'Europe/London',
    });

    // Submit two requests simultaneously for slots 11:30 and 13:00
    const [p1, p2] = await Promise.allSettled([
      createTrialBooking({
        parent: { name: 'Concurrent Parent', email: 'concurrent@test.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T11:30:00',
        timezone: 'Europe/London',
      }),
      createTrialBooking({
        parent: { name: 'Concurrent Parent', email: 'concurrent@test.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T13:00:00',
        timezone: 'Europe/London',
      }),
    ]);

    const parentDoc = await Parent.findOne({ email: 'concurrent@test.com' });
    const totalBookings = await Booking.countDocuments({
      parentId: parentDoc._id,
      parentDateLocal: '2026-10-05',
      status: 'CONFIRMED',
    });

    assert.equal(totalBookings, 2, 'Concurrency race condition must never result in > 2 confirmed bookings');
    const fulfilledCount = [p1, p2].filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = [p1, p2].filter((r) => r.status === 'rejected').length;
    assert.equal(fulfilledCount, 1, 'Exactly one concurrent booking should succeed');
    assert.equal(rejectedCount, 1, 'The competing concurrent booking must be rejected');
  });

});
