import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Parent email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    timezone: {
      type: String,
      required: [true, 'Parent timezone is required'],
      trim: true,
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

export const Parent = mongoose.model('Parent', ParentSchema);
