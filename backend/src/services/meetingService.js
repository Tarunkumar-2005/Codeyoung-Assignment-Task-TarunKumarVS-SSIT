import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * Interface / Contract for Meeting Providers
 * Allows replacing DummyMeetingProvider with Zoom, Google Meet, or Daily.co in the future.
 */
export class DummyMeetingProvider {
  constructor(baseUrl = 'https://demo.codeyoung.local/class') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Generates an opaque, secure, non-sensitive unique room link.
   * @param {Object} [metadata] - Optional session metadata (never exposed in the URL)
   * @returns {{ meetingId: string, meetingLink: string, provider: string }}
   */
  async createMeetingRoom(metadata = {}) {
    const roomId = crypto.randomUUID();
    const meetingLink = `${this.baseUrl}/${roomId}`;

    return {
      meetingId: roomId,
      meetingLink,
      provider: 'DUMMY_CODEYOUNG',
      createdAt: new Date().toISOString(),
    };
  }
}

// Active provider instance
const defaultProvider = new DummyMeetingProvider(
  process.env.MEETING_BASE_URL || 'https://demo.codeyoung.local/class'
);

/**
 * Generates a unique dummy class URL for a trial class booking.
 * Format: https://demo.codeyoung.local/class/<unique-id>
 * 
 * @param {Object} [metadata]
 * @returns {Promise<string>} Full meeting URL
 */
export const generateMeetingLink = async (metadata = {}) => {
  const result = await defaultProvider.createMeetingRoom(metadata);
  return result.meetingLink;
};

/**
 * Synchronous helper for direct link generation.
 * @returns {string}
 */
export const generateMeetingLinkSync = () => {
  const roomId = crypto.randomUUID();
  const baseUrl = (process.env.MEETING_BASE_URL || 'https://demo.codeyoung.local/class').replace(/\/+$/, '');
  return `${baseUrl}/${roomId}`;
};

export default {
  generateMeetingLink,
  generateMeetingLinkSync,
  DummyMeetingProvider,
};
