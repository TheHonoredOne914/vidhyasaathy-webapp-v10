import type { SubmitAttempt } from '@vidhyasaathy/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from '../session';
import { flushOutbox, queueAttempt, readOutbox, readSyncAt, resumeOutbox } from './outbox';
import { pullAssessments } from './pull';

type AttemptSyncValue = {
  offline: boolean;
  pending: number;
  blocked: number;
  updatedAt: string | null;
  notice: string | null;
  revision: number;
  queuedAnswerKeys: string[];
  queue: (event: SubmitAttempt) => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
};

const AttemptSyncContext = createContext<AttemptSyncValue | null>(null);

export function AttemptSyncProvider({ children }: { children: ReactNode }) {
  const { me } = useSession();
  const profileId = me?.profile.role === 'student' ? `${me.school.id}/${me.profile.id}` : null;
  const activeOwner = useRef(profileId);
  activeOwner.current = profileId;
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [pending, setPending] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [nextAttemptAt, setNextAttemptAt] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [queuedAnswerKeys, setQueuedAnswerKeys] = useState<string[]>([]);
  const flight = useRef<Promise<void> | null>(null);

  const applyRows = useCallback(async (id: string) => {
    const rows = await readOutbox(id);
    if (activeOwner.current !== id) return;
    setQueuedAnswerKeys(rows.map((row) => `${row.event.assignmentId}/${row.event.itemId}`));
    const waiting = rows.filter((row) => row.status === 'pending');
    setPending(waiting.length);
    setBlocked(rows.length - waiting.length);
    setNextAttemptAt(waiting.length ? Math.min(...waiting.map((row) => row.nextAttemptAt)) : null);
    setUpdatedAt(readSyncAt(id));
  }, []);

  const refresh = useCallback(async () => {
    const run = async () => {
      if (activeOwner.current !== profileId) return;
      if (!profileId) {
        setPending(0);
        setBlocked(0);
        setNextAttemptAt(null);
        setUpdatedAt(null);
        setNotice(null);
        setQueuedAnswerKeys([]);
        return;
      }
      try {
        const result = await flushOutbox(profileId);
        await applyRows(profileId);
        if (activeOwner.current !== profileId) return;
        setNotice(result.error);
        if (result.sent > 0) setRevision((current) => current + 1);
        if (navigator.onLine) {
          const stamp = await pullAssessments(profileId);
          if (activeOwner.current !== profileId) return;
          setUpdatedAt(stamp);
          setRevision((current) => current + 1);
        }
      } catch (error) {
        if (activeOwner.current === profileId) setNotice(error instanceof Error ? error.message : 'Could not sync saved answers.');
      }
    };
    const next = (flight.current ?? Promise.resolve()).then(run, run);
    flight.current = next;
    await next;
  }, [applyRows, profileId]);

  const queue = useCallback(async (event: SubmitAttempt) => {
    if (!profileId) return;
    await queueAttempt(profileId, event);
    await applyRows(profileId);
    if (typeof navigator === 'undefined' || navigator.onLine) await refresh();
  }, [applyRows, profileId, refresh]);

  const retry = useCallback(async () => {
    if (!profileId) return;
    try {
      await resumeOutbox(profileId);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read saved answers.');
    }
  }, [profileId, refresh]);

  useEffect(() => {
    if (offline || nextAttemptAt === null) return;
    const timer = window.setTimeout(() => { void refresh(); }, Math.max(1000, nextAttemptAt - Date.now()));
    return () => { window.clearTimeout(timer); };
  }, [nextAttemptAt, offline, refresh]);

  useEffect(() => {
    const on = () => { setOffline(false); void refresh(); };
    const off = () => { setOffline(true); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    void refresh();
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [refresh]);

  const value = useMemo(() => ({
    offline, pending, blocked, updatedAt, notice, revision, queuedAnswerKeys, queue, refresh, retry,
  }), [blocked, notice, offline, pending, queue, queuedAnswerKeys, refresh, retry, revision, updatedAt]);

  return <AttemptSyncContext.Provider value={value}>{children}</AttemptSyncContext.Provider>;
}

export function useAttemptSync(): AttemptSyncValue {
  const value = useContext(AttemptSyncContext);
  if (!value) throw new Error('Attempt sync is missing.');
  return value;
}
