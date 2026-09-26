import { createTrialBooking } from '../services/bookingService.js';

/**
 * HTTP Controller for Trial Class Booking
 * Pure transport layer; delegates business logic to bookingService.
 */
export const handleCreateBooking = async (req, res, next) => {
  try {
    const confirmation = await createTrialBooking(req.body);
    return res.status(201).json({
      success: true,
      data: confirmation,
      message: 'Trial class appointment booked successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  handleCreateBooking,
};
