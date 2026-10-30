import type { Notification } from '@vidhyasaathy/contracts';
import { IST_OFFSET_MS, istDay, shiftIstDay } from '@vidhyasaathy/core/streak';
import { and, eq } from 'drizzle-orm';
import { deliverNotifications, queueNotification, settingsFor } from '../dashboard/notifications.ts';
import type { Db } from '../db/index.ts';
import {
  assignments, attempts, badgeCatalog, learningSessions, profiles, streakTouches,
} from '../db/schema.ts';

const DAY_MS = 86_400_000;

/** Next 07:00 IST when quiet-after-9 is on and the clock is in the night window. */
export function quietDelivery(now: number, quietAfter21: boolean) {
  if (!quietAfter21) return now;
  const hour = Math.floor(((now + IST_OFFSET_MS) % DAY_MS) / 3_600_000);
  if (hour >= 7 && hour < 21) return now;
  const day = hour >= 21 ? shiftIstDay(istDay(now), 1) : istDay(now);
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) - IST_OFFSET_MS + 7 * 3_600_000;
}

function istHour(now: number) {
  return Math.floor(((now + IST_OFFSET_MS) % DAY_MS) / 3_600_000);
}

function eightIst(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) - IST_OFFSET_MS + 8 * 3_600_000;
}

export function groupInbox(rows: readonly Notification[], now: number) {
  const today = istDay(now);
  const start = shiftIstDay(today, -6);
  return {
    today: rows.filter((row) => istDay(row.createdAt) === today),
    earlier: rows.filter((row) => {
      const day = istDay(row.createdAt);
      return day < today && day >= start;
    }),
  };
}

function send(db: Db, input: {
  schoolId: string; profileId: string; topic: string; dedupeKey: string; title: string; body: string; href: string; now: number;
}) {
  const settings = settingsFor(db, input.schoolId, input.profileId);
  const allowed = input.topic === 'session_open' ? settings.notifySessions
    : input.topic === 'homework_due' || input.topic === 'graded' ? settings.notifyHomework
    : input.topic === 'streak' ? settings.notifyStreak
    : input.topic === 'parent_viewed' ? settings.notifyParentView
    : input.topic === 'game_of_day' ? settings.notifyGame
    : true;
  if (!settings.enabled || !allowed) return;
  queueNotification(db, {
    schoolId: input.schoolId, profileId: input.profileId, announcementId: null, topic: input.topic,
    dedupeKey: input.dedupeKey, kind: 'content_publish', title: input.title, body: input.body, href: input.href,
    channel: 'in_app', createdAt: input.now,
  }, quietDelivery(input.now, settings.quietAfter21));
}

/** Queue today's topics for one student. Safe to call on every home or inbox read. */
export function dispatchStudent(db: Db, schoolId: string, profileId: string, now: number) {
  const student = db.select().from(profiles).where(and(eq(profiles.id, profileId), eq(profiles.schoolId, schoolId))).get();
  if (!student?.sectionId) return;
  const today = istDay(now);
  const hour = istHour(now);
  const sessions = db.select().from(learningSessions).where(and(
    eq(learningSessions.schoolId, schoolId), eq(learningSessions.sectionId, student.sectionId), eq(learningSessions.status, 'published'),
  )).all();
  for (const session of sessions) {
    if (session.releaseAt == null || session.releaseAt > now || istDay(session.releaseAt) !== today) continue;
    send(db, {
      schoolId, profileId, topic: 'session_open', dedupeKey: `session_open:${session.id}:${profileId}`,
      title: session.title, body: 'A session is open.', href: `/student/sessions/${session.id}`, now,
    });
  }
  if (hour >= 8) {
    const homework = db.select().from(assignments).where(and(
      eq(assignments.schoolId, schoolId), eq(assignments.sectionId, student.sectionId), eq(assignments.status, 'published'),
    )).all();
    for (const row of homework) {
      if (istDay(row.dueAt) !== today || now < eightIst(today)) continue;
      const started = db.select({ id: attempts.id }).from(attempts).where(and(
        eq(attempts.assignmentId, row.id), eq(attempts.profileId, profileId),
      )).get();
      if (started) continue;
      send(db, {
        schoolId, profileId, topic: 'homework_due', dedupeKey: `homework_due:${row.id}:${today}`,
        title: row.title, body: 'Homework is due today.', href: `/student/homework/${row.id}`, now,
      });
    }
  }
  if (hour >= 19) {
    const touched = db.select().from(streakTouches).where(and(
      eq(streakTouches.profileId, profileId), eq(streakTouches.day, today),
    )).get();
    if (!touched) {
      send(db, {
        schoolId, profileId, topic: 'streak', dedupeKey: `streak:${profileId}:${today}`,
        title: 'A short sitting is enough', body: 'Keep it going with 15 minutes today', href: '/student/home', now,
      });
    }
  }
  deliverNotifications(db, now, schoolId);
}

export function notifyParentViewed(db: Db, schoolId: string, childId: string, now: number) {
  send(db, {
    schoolId, profileId: childId, topic: 'parent_viewed', dedupeKey: `parent_viewed:${childId}:${istDay(now)}`,
    title: 'A parent looked at your progress',
    body: 'Papa looked at your weekly progress report. Parents can see progress, never your Saathy chats.',
    href: '/student/progress', now,
  });
  deliverNotifications(db, now, schoolId);
}

export function notifyGraded(db: Db, schoolId: string, profileId: string, assignmentId: string, now: number) {
  const assignment = db.select().from(assignments).where(eq(assignments.id, assignmentId)).get();
  send(db, {
    schoolId, profileId, topic: 'graded', dedupeKey: `graded:${assignmentId}:${profileId}:${istDay(now)}`,
    title: assignment?.title ?? 'Homework marked', body: 'Your teacher marked this work.',
    href: `/student/homework/${assignmentId}`, now,
  });
  deliverNotifications(db, now, schoolId);
}

export function notifyBadge(db: Db, schoolId: string, profileId: string, badgeId: string, scopeKey: string, now: number) {
  const badge = db.select().from(badgeCatalog).where(eq(badgeCatalog.id, badgeId as 'fixed_it')).get();
  send(db, {
    schoolId, profileId, topic: 'badge', dedupeKey: `badge:${profileId}:${badgeId}:${scopeKey}`,
    title: badge?.nameEn ?? 'A new badge', body: badge?.descriptionEn ?? 'You earned a badge.',
    href: '/student/progress', now,
  });
}

