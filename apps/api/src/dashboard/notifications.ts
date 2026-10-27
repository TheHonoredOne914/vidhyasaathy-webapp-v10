import { randomUUID } from 'node:crypto';
import type { Notification, SaveNotificationSettings } from '@vidhyasaathy/contracts';
import { and, eq, lte } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { notifications, notificationSettings } from '../db/schema.ts';

export function nextDeliveryAt(timestamp: number, settings: SaveNotificationSettings): number | null {
  if (!settings.enabled || settings.quietStart === settings.quietEnd) return settings.enabled ? timestamp : null;
  const offsetMs = settings.utcOffsetMinutes * 60_000;
  const local = timestamp + offsetMs;
  const minuteOfDay = ((Math.floor(local / 60_000) % 1440) + 1440) % 1440;
  const { quietStart, quietEnd } = settings;
  const inQuiet = quietStart < quietEnd
    ? minuteOfDay >= quietStart && minuteOfDay < quietEnd
    : minuteOfDay >= quietStart || minuteOfDay < quietEnd;
  if (!inQuiet) return timestamp;
  const untilEnd = quietStart < quietEnd || minuteOfDay < quietEnd
    ? quietEnd - minuteOfDay
    : 1440 - minuteOfDay + quietEnd;
  return Math.floor(local / 60_000) * 60_000 + untilEnd * 60_000 - offsetMs;
}

export const defaultNotificationSettings: SaveNotificationSettings = {
  enabled: true, quietStart: 1320, quietEnd: 420, utcOffsetMinutes: 330, reducedMotion: false,
};

export function settingsFor(db: Db, schoolId: string, profileId: string) {
  const row = db.select().from(notificationSettings).where(and(eq(notificationSettings.schoolId, schoolId),
    eq(notificationSettings.profileId, profileId))).get();
  return row ? { enabled: row.enabled, quietStart: row.quietStart, quietEnd: row.quietEnd,
    utcOffsetMinutes: row.utcOffsetMinutes, reducedMotion: row.reducedMotion, updatedAt: row.updatedAt }
    : { ...defaultNotificationSettings, updatedAt: 0 };
}

export function queueNotification(db: Db, input: Omit<typeof notifications.$inferInsert,
  'id' | 'status' | 'deliverAfter' | 'deliveredAt' | 'readAt' | 'failure'>) {
  db.insert(notifications).values({ ...input, id: randomUUID(), status: 'queued', deliverAfter: input.createdAt })
    .onConflictDoNothing({ target: notifications.dedupeKey }).run();
}

export function notificationView(row: typeof notifications.$inferSelect): Notification {
  return { id: row.id, kind: row.kind, title: row.title, body: row.body, href: row.href, channel: row.channel,
    status: row.status, failure: row.failure, createdAt: row.createdAt, deliverAfter: row.deliverAfter,
    deliveredAt: row.deliveredAt, readAt: row.readAt };
}

export function deliverNotifications(db: Db, timestamp: number, schoolId?: string) {
  const queued = db.select().from(notifications).where(and(eq(notifications.status, 'queued'),
    lte(notifications.deliverAfter, timestamp), schoolId ? eq(notifications.schoolId, schoolId) : undefined)).all();
  for (const row of queued) {
    const deliverAt = nextDeliveryAt(timestamp, settingsFor(db, row.schoolId, row.profileId));
    if (deliverAt === null) continue;
    if (deliverAt > timestamp) {
      db.update(notifications).set({ deliverAfter: deliverAt }).where(eq(notifications.id, row.id)).run();
    } else if (row.channel === 'in_app') {
      db.update(notifications).set({ status: 'delivered', deliveredAt: timestamp }).where(eq(notifications.id, row.id)).run();
    } else {
      db.update(notifications).set({ status: 'failed', failure: `${row.channel} delivery is not configured.` })
        .where(eq(notifications.id, row.id)).run();
    }
  }
}
