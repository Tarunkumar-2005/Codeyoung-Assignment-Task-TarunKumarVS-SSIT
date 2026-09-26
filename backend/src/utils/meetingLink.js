import { generateMeetingLinkSync, generateMeetingLink } from '../services/meetingService.js';

/**
 * Utility wrapper for generating meeting links.
 * Isolated interface delegating to meetingService.
 */
export const createMeetingLink = generateMeetingLink;
export { generateMeetingLinkSync as generateMeetingLink };

export default {
  generateMeetingLink: generateMeetingLinkSync,
  createMeetingLink: generateMeetingLink,
};
