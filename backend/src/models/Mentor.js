import mongoose from 'mongoose';

const MentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Mentor email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    timezone: {
      type: String,
      required: [true, 'Mentor timezone is required'],
      default: 'Asia/Kolkata',
      trim: true,
    },
    workingHours: {
      startIST: {
        type: String,
        required: [true, 'Working hours start time (IST) is required'],
        default: '10:00',
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24-hour)'],
      },
      endIST: {
        type: String,
        required: [true, 'Working hours end time (IST) is required'],
        default: '20:00',
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24-hour)'],
      },
    },
    maxDailyDemos: {
      type: Number,
      required: true,
      default: 2,
      min: [1, 'Must conduct at least 1 demo per day'],
      max: [10, 'Daily limit cannot exceed 10'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const Mentor = mongoose.model('Mentor', MentorSchema);
