import mongoose from 'mongoose';
import { DateTime } from 'luxon';

const BookingSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: [true, 'Parent reference is required'],
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor reference is required'],
    },
    startTimeUTC: {
      type: Date,
      required: [true, 'Start time in UTC is required'],
      index: true,
    },
    endTimeUTC: {
      type: Date,
      required: [true, 'End time in UTC is required'],
      validate: {
        validator: function (value) {
          return this.startTimeUTC ? value > this.startTimeUTC : true;
        },
        message: 'End time must be after start time',
      },
    },
    parentTimezone: {
      type: String,
      required: [true, "Parent's original timezone is required"],
      trim: true,
    },
    parentDateLocal: {
      type: String,
      required: [true, 'Parent local calendar date (YYYY-MM-DD) is required for daily quota partitioning'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
      index: true,
    },
    mentorTimezone: {
      type: String,
      required: [true, "Mentor's timezone is required"],
      default: 'Asia/Kolkata',
      trim: true,
    },
    mentorDateIST: {
      type: String,
      required: [true, 'Mentor IST calendar date (YYYY-MM-DD) is required for daily quota partitioning'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'CONFIRMED',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-validation hook to ensure parentDateLocal and mentorDateIST are always populated
BookingSchema.pre('validate', function () {
  if (this.startTimeUTC) {
    const utcDate = this.startTimeUTC instanceof Date ? this.startTimeUTC : new Date(this.startTimeUTC);
    if (!this.parentDateLocal) {
      const pTz = this.parentTimezone || 'Asia/Kolkata';
      try {
        this.parentDateLocal = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(pTz).toISODate();
      } catch (e) {
        this.parentDateLocal = utcDate.toISOString().split('T')[0];
      }
    }
    if (!this.mentorDateIST) {
      try {
        this.mentorDateIST = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone('Asia/Kolkata').toISODate();
      } catch (e) {
        this.mentorDateIST = utcDate.toISOString().split('T')[0];
      }
    }
  }
});


/**
 * INDEXES FOR CONCURRENCY & PERFORMANCE
 */


// 1. Mentor Double-Booking Prevention: A mentor cannot have two active bookings at the exact same startTimeUTC.
BookingSchema.index(
  { mentorId: 1, startTimeUTC: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'CONFIRMED' },
    name: 'unique_active_mentor_slot',
  }
);

// 2. Parent Duplicate-Booking Prevention: A parent cannot have two active bookings at the exact same startTimeUTC.
BookingSchema.index(
  { parentId: 1, startTimeUTC: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'CONFIRMED' },
    name: 'unique_active_parent_slot',
  }
);

// 3. Parent Daily Quota Index: Fast lookup to count parent's active bookings on their local calendar date.
BookingSchema.index(
  { parentId: 1, parentDateLocal: 1, status: 1 },
  { name: 'idx_parent_daily_quota' }
);

// 4. Mentor Daily Quota Index: Fast lookup to count mentor's active demo bookings on any given IST calendar day.
BookingSchema.index(
  { mentorId: 1, mentorDateIST: 1, status: 1 },
  { name: 'idx_mentor_daily_quota' }
);

// 5. Parent Booking History Index
BookingSchema.index(
  { parentId: 1, startTimeUTC: -1 },
  { name: 'idx_parent_history' }
);

export const Booking = mongoose.model('Booking', BookingSchema);

