import { describe, expect, it } from 'vitest';
import { EvidenceSummarySchema, SaveAnnouncementSchema, SaveNotificationSettingsSchema } from './dashboard.ts';

describe('dashboard contracts', () => {
  it('requires evidence and confidence alongside every pass rate', () => {
    expect(EvidenceSummarySchema.safeParse({ passRate: 1 }).success).toBe(false);
    expect(EvidenceSummarySchema.parse({ attempts: 0, correct: 0, pendingReview: 0,
      passRate: null, confidence: 'insufficient', minAttempts: 3 }).passRate).toBeNull();
  });
  it('rejects invalid quiet hours, unknown preferences and duplicate channels', () => {
    const settings = { enabled: true, quietStart: 1320, quietEnd: 420, utcOffsetMinutes: 330, reducedMotion: false };
    expect(SaveNotificationSettingsSchema.safeParse(settings).success).toBe(true);
    expect(SaveNotificationSettingsSchema.safeParse({ ...settings, quietEnd: 1440 }).success).toBe(false);
    expect(SaveNotificationSettingsSchema.safeParse({ ...settings, profileId: 'someone-else' }).success).toBe(false);
    expect(SaveAnnouncementSchema.safeParse({ sectionId: '00000000-0000-4000-8000-000000000001',
      title: 'Practice', body: 'Review fractions.', audience: 'all', channels: ['in_app', 'in_app'] }).success).toBe(false);
  });
});
