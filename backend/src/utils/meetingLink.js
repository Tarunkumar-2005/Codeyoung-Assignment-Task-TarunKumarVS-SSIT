import crypto from 'crypto';

/**
 * Generates a unique, deterministic-length dummy meeting link for demo classes.
 * @returns {string} - e.g. "https://meet.codeyoung.com/trial/cy-7f9a2b1c-8e3d"
 */
export const generateMeetingLink = () => {
  const uniqueToken = crypto.randomBytes(6).toString('hex');
  return `https://meet.codeyoung.com/trial/cy-${uniqueToken}`;
};

export default {
  generateMeetingLink,
};
