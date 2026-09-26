import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createTrialBooking } from '../src/services/bookingService.js';
import { Mentor } from '../src/models/Mentor.js';
import { Booking } from '../src/models/Booking.js';
import { Parent } from '../src/models/Parent.js';
import { config } from '../src/config/env.js';

describe('BookingService', () => {
  before(async () => {
    await mongoose.connect(config.mongoUri);
    // Clean test state
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});

    // Seed 2 mentors for testing
    await Mentor.create([
      {
        name: 'Ananya Verma',
        email: 'ananya.test@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '10:00', endIST: '20:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
      {
        name: 'Rahul Nair',
        email: 'rahul.test@codeyoung.com',
        timezone: 'Asia/Kolkata',
        workingHours: { startIST: '14:00', endIST: '23:00' },
        maxDailyDemos: 2,
        isActive: true,
      },
    ]);
  });

  after(async () => {
    await Booking.deleteMany({});
    await Parent.deleteMany({});
    await Mentor.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Validation & Error Guardrails', () => {
    it('should reject booking if parent email is invalid', async () => {
      await assert.rejects(
        async () => {
          await createTrialBooking({
            parent: { name: 'John Doe', email: 'not-an-email', timezone: 'America/New_York' },
            startTime: '2028-10-15 10:00',
            timezone: 'America/New_York',
          });
        },
        (err) => err.statusCode === 400 && err.errorCode === 'INVALID_EMAIL'
      );
    });

    it('should reject booking if timezone identifier is invalid', async () => {
      await assert.rejects(
        async () => {
          await createTrialBooking({
            parent: { name: 'John Doe', email: 'john@example.com', timezone: 'Fake/Zone' },
            startTime: '2028-10-15 10:00',
            timezone: 'Fake/Zone',
          });
        },
        (err) => err.statusCode === 400 && err.errorCode === 'INVALID_TIMEZONE'
      );
    });

    it('should reject booking if requested appointment time is in the past', async () => {
      await assert.rejects(
        async () => {
          await createTrialBooking({
            parent: { name: 'John Doe', email: 'john@example.com', timezone: 'America/New_York' },
            startTime: '2020-01-01 10:00',
            timezone: 'America/New_York',
          });
        },
        (err) => err.statusCode === 400 && err.errorCode === 'PAST_APPOINTMENT_TIME'
      );
    });
  });

  describe('Successful Booking Flow & Dual Projections', () => {
    it('should successfully book a trial class and generate dual perspectives', async () => {
      // Future date: 2028-10-15 10:00 AM EDT (14:00 UTC -> 19:30 IST)
      const payload = {
        parent: {
          name: 'Sarah Miller',
          email: 'sarah.miller@example.com',
          timezone: 'America/New_York',
        },
        startTime: '2028-10-15 10:00',
        timezone: 'America/New_York',
      };

      const confirmation = await createTrialBooking(payload);

      assert.ok(confirmation.bookingId);
      assert.equal(confirmation.status, 'CONFIRMED');
      assert.equal(confirmation.parent.name, 'Sarah Miller');
      assert.equal(confirmation.parent.email, 'sarah.miller@example.com');
      assert.ok(confirmation.mentor.name);
      assert.ok(confirmation.appointment.meetingLink.startsWith('https://meet.codeyoung.com/trial/cy-'));

      // Verify parent local time projection
      assert.equal(confirmation.parentLocalTime.time, '10:00 AM');
      assert.equal(confirmation.parentLocalTime.timezone, 'America/New_York');

      // Verify mentor local time projection in Asia/Kolkata
      assert.equal(confirmation.mentorLocalTime.time, '07:30 PM');
      assert.equal(confirmation.mentorLocalTime.timezone, 'Asia/Kolkata');
    });

    it('should return a useful error state (409) when all mentors are saturated or outside hours', async () => {
      // Slot at 3:00 AM IST (21:30 UTC previous day), when no mentors are working
      const payload = {
        parent: {
          name: 'David Smith',
          email: 'david@example.com',
          timezone: 'America/New_York',
        },
        startTime: '2028-10-15 17:30', // 17:30 EDT = 21:30 UTC = 03:00 AM IST next day
        timezone: 'America/New_York',
      };

      await assert.rejects(
        async () => {
          await createTrialBooking(payload);
        },
        (err) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.errorCode, 'NO_MENTOR_AVAILABLE');
          assert.ok(err.details.suggestion);
          return true;
        }
      );
    });
  });
});
