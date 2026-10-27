import { MeSchema, type Me } from '@vidhyasaathy/contracts';
import { z, type ZodType } from 'zod';

export const ME_KEY = 'vidhyasaathy.me';
export const PROFILE_KEY = 'vidhyasaathy.studentProfileId';
const STUDENTS_KEY = 'vidhyasaathy.studentProfiles';
export const CACHE_PREFIX = 'vidhyasaathy.cache.';

export type CachedMe = { me: Me; updatedAt: string };

export function parseCachedMe(raw: string): CachedMe | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as { me?: unknown; updatedAt?: unknown };
    const me = MeSchema.safeParse(record.me);
    if (!me.success || typeof record.updatedAt !== 'string') return null;
    return { me: me.data, updatedAt: record.updatedAt };
  } catch {
    return null;
  }
}

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function readCachedMe(): CachedMe | null {
  const raw = readStorage(ME_KEY);
  return raw ? parseCachedMe(raw) : null;
}

export function writeCachedMe(me: Me): CachedMe {
  const cached = { me, updatedAt: new Date().toISOString() };
  writeStorage(ME_KEY, JSON.stringify(cached));
  if (me.profile.role === 'student') {
    writeStorage(PROFILE_KEY, me.profile.id);
    const students = readStudentProfiles().filter((student) => student.id !== me.profile.id);
    students.push({ id: me.profile.id, name: me.profile.name, school: me.school.name });
    writeStorage(STUDENTS_KEY, JSON.stringify(students));
  }
  return cached;
}

const CachedShape = z.object({ data: z.unknown(), updatedAt: z.string() }).strict();
const StudentProfilesSchema = z.array(z.object({ id: z.string().uuid(), name: z.string(), school: z.string() }).strict());

export function readStudentProfiles(): z.infer<typeof StudentProfilesSchema> {
  try {
    const result = StudentProfilesSchema.safeParse(JSON.parse(readStorage(STUDENTS_KEY) ?? '[]'));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function cacheKey(key: string): string {
  const me = readCachedMe()?.me;
  return `${CACHE_PREFIX}${me ? `${me.school.id}.${me.profile.id}` : 'anonymous'}.${key}`;
}

export function parseCached<T>(raw: string, schema: ZodType<T>): { data: T; updatedAt: string } | null {
  try {
    const wrapper = CachedShape.safeParse(JSON.parse(raw));
    if (!wrapper.success) return null;
    const data = schema.safeParse(wrapper.data.data);
    if (!data.success) return null;
    return { data: data.data, updatedAt: wrapper.data.updatedAt };
  } catch {
    return null;
  }
}

export function readCached<T>(key: string, schema: ZodType<T>): { data: T; updatedAt: string } | null {
  const raw = readStorage(cacheKey(key));
  return raw ? parseCached(raw, schema) : null;
}

export function writeCached(key: string, data: unknown): { updatedAt: string } {
  const updatedAt = new Date().toISOString();
  writeStorage(cacheKey(key), JSON.stringify({ data, updatedAt }));
  return { updatedAt };
}

export function clearCachedLists(): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
