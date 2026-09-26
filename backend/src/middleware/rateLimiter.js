import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});

export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit booking requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'BOOKING_RATE_LIMIT_EXCEEDED',
      message: 'Too many booking attempts. Please wait a few moments before trying again.',
    },
  },
});
