import type { FastifyRateLimitOptions, FastifyRateLimitStore, FastifyRateLimitStoreCtor } from '@fastify/rate-limit';
import { lte, sql } from 'drizzle-orm';
import type { Db } from './db/index.ts';
import { rateLimits } from './db/schema.ts';

export function sqliteRateLimitStore(db: Db, now: () => number): FastifyRateLimitStoreCtor {
  let nextCleanup = 0;

  return class SqliteRateLimitStore {
    private readonly timeWindow: number;

    constructor(options: FastifyRateLimitOptions) {
      this.timeWindow = 'timeWindow' in options && typeof options.timeWindow === 'number' ? options.timeWindow : 60000;
    }

    incr(key: string, callback: (error: Error | null, result: { current: number; ttl: number }) => void, timeWindow?: number): void {
      try {
        const currentTime = now();
        if (currentTime >= nextCleanup) {
          db.delete(rateLimits).where(lte(rateLimits.expiresAt, currentTime)).run();
          nextCleanup = currentTime + 60000;
        }
        const expiresAt = currentTime + (timeWindow ?? this.timeWindow);
        const result = db.insert(rateLimits).values({ key, count: 1, expiresAt })
          .onConflictDoUpdate({
            target: rateLimits.key,
            set: {
              count: sql`case when ${rateLimits.expiresAt} <= ${currentTime} then 1 else ${rateLimits.count} + 1 end`,
              expiresAt: sql`case when ${rateLimits.expiresAt} <= ${currentTime} then ${expiresAt} else ${rateLimits.expiresAt} end`,
            },
          }).returning().get();
        if (!result) throw new Error('Rate limit state was not persisted.');
        callback(null, { current: result.count, ttl: Math.max(0, result.expiresAt - currentTime) });
      } catch (error) {
        callback(error instanceof Error ? error : new Error('Rate limit store failed.'), { current: 0, ttl: 0 });
      }
    }

    child(options: Parameters<FastifyRateLimitStore['child']>[0]): SqliteRateLimitStore {
      return new SqliteRateLimitStore(options);
    }
  };
}
