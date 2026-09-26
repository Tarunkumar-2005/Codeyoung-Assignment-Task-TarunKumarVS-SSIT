import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMeetingLink,
  generateMeetingLinkSync,
  DummyMeetingProvider,
} from '../src/services/meetingService.js';

describe('MeetingService & Meeting Link Generator', () => {
  it('should generate a valid URL starting with https://demo.codeyoung.local/class/', async () => {
    const link = await generateMeetingLink();
    assert.ok(link.startsWith('https://demo.codeyoung.local/class/'));

    // Verify format: https://demo.codeyoung.local/class/<UUID>
    const uuidPart = link.replace('https://demo.codeyoung.local/class/', '');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.match(uuidPart, uuidRegex, 'Meeting ID must be an opaque, non-sensitive standard UUID');
  });

  it('should generate completely unique links across successive calls', () => {
    const links = new Set();
    for (let i = 0; i < 100; i++) {
      links.add(generateMeetingLinkSync());
    }
    assert.equal(links.size, 100, 'All 100 generated meeting links must be uniquely distinct');
  });

  it('should not contain or leak any sensitive data in the meeting URL', async () => {
    const sensitiveMetadata = {
      parentEmail: 'confidential.parent@secret.com',
      studentName: 'Private Student',
      mentorId: 'mentor_999',
    };

    const link = await generateMeetingLink(sensitiveMetadata);
    assert.equal(link.includes('confidential'), false);
    assert.equal(link.includes('secret'), false);
    assert.equal(link.includes('Private'), false);
    assert.equal(link.includes('mentor_999'), false);
  });

  it('should allow custom base URL via DummyMeetingProvider instance', async () => {
    const customProvider = new DummyMeetingProvider('https://custom.codeyoung.io/room');
    const room = await customProvider.createMeetingRoom();

    assert.ok(room.meetingLink.startsWith('https://custom.codeyoung.io/room/'));
    assert.equal(room.provider, 'DUMMY_CODEYOUNG');
    assert.ok(room.meetingId);
  });
});
