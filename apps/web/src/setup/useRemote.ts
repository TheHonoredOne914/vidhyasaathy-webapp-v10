import { useCallback, useEffect, useState } from 'react';
import type { ZodType } from 'zod';
import { ApiClientError, getJson, LEARNER_CHANGED } from '../api/client';
import { readCached, writeCached } from '../storage';
import { useSession } from '../session';

/** Views derived from learning evidence; they refetch after a saved answer (UX02). */
const LEARNER_VIEWS = ['/student/home', '/progress', '/notifications', '/student/badges', '/student/streak'];

export type Remote<T> = {
  status: 'loading' | 'ready' | 'error';
  data: T | null;
  updatedAt: string | null;
  stale: boolean;
  message: string | null;
  denied: boolean;
  reload: () => void;
};

function failureMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'The request timed out.';
  if (error instanceof ApiClientError) return error.message;
  return 'The request could not be completed.';
}

export function useRemote<T>(path: string | null, schema: ZodType<T>): Remote<T> {
  const { me } = useSession();
  const owner = `${me?.school.id ?? ''}/${me?.profile.id ?? ''}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<Remote<T>, 'reload'> & { key: string }>({
    key: `${owner}${path}`,
    status: path ? 'loading' : 'ready',
    data: null,
    updatedAt: null,
    stale: false,
    message: null,
    denied: false,
  });

  useEffect(() => {
    if (!path) {
      setState({ key: `${owner}${path}`, status: 'ready', data: null, updatedAt: null, stale: false, message: null, denied: false });
      return;
    }
    const controller = new AbortController();
    const key = `${owner}${path}`;
    // Keep the previous list while this reload is in flight. Clearing it unmounts the setup forms and drops the year or class the user just picked.
    setState((current) => ({
      key,
      status: 'loading',
      data: current.key === key ? current.data : null,
      updatedAt: current.key === key ? current.updatedAt : null,
      stale: false,
      message: null,
      denied: false,
    }));
    async function fetchWithRetry() {
      for (let retry = 0; ; retry += 1) {
        try {
          return await getJson(path!, schema, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
        } catch (error) {
          const transient = error instanceof ApiClientError && (error.status === 0 || error.status >= 500);
          if (!transient || retry >= 2 || controller.signal.aborted) throw error;
          await new Promise<void>((resolve) => {
            const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve(); };
            const timer = setTimeout(done, 500 * 2 ** retry + Math.random() * 300);
            controller.signal.addEventListener('abort', done, { once: true });
          });
          controller.signal.throwIfAborted();
        }
      }
    }
    void fetchWithRetry().then((data) => {
      if (controller.signal.aborted) return;
      const saved = writeCached(path, data);
      setState({ key, status: 'ready', data, updatedAt: saved.updatedAt, stale: false, message: null, denied: false });
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (controller.signal.aborted) return;
      const message = failureMessage(error);
      const denied = error instanceof ApiClientError && (error.status === 401 || error.status === 403 || error.status === 404);
      const cached = denied ? null : readCached(path, schema);
      if (cached) {
        setState({ key, status: 'ready', data: cached.data, updatedAt: cached.updatedAt, stale: true, message, denied: false });
        return;
      }
      setState({ key, status: 'error', data: null, updatedAt: null, stale: false, message, denied });
    });
    return () => { controller.abort(); };
  }, [attempt, owner, path, schema]);

  const reload = useCallback(() => { setAttempt((current) => current + 1); }, []);
  useEffect(() => {
    if (!path || !LEARNER_VIEWS.some((view) => path === view || path.startsWith(`${view}?`) || path.startsWith(`${view}/`))) return;
    window.addEventListener(LEARNER_CHANGED, reload);
    return () => { window.removeEventListener(LEARNER_CHANGED, reload); };
  }, [path, reload]);
  if (state.key !== `${owner}${path}`) return { status: 'loading', data: null, updatedAt: null, stale: false, message: null, denied: false, reload };
  return { ...state, reload };
}
