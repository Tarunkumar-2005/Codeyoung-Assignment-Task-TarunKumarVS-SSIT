import { getAvailableSlotsForDate } from '../services/slotService.js';

export const handleGetAvailableSlots = async (req, res, next) => {
  try {
    const { date, timezone } = req.query;
    const slots = await getAvailableSlotsForDate(date, timezone);

    return res.status(200).json({
      success: true,
      data: {
        date,
        timezone,
        totalSlots: slots.length,
        availableSlotsCount: slots.filter((s) => s.isAvailable).length,
        slots,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  handleGetAvailableSlots,
};
