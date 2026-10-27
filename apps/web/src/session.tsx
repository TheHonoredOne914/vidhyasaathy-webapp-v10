import { MeSchema, type Me } from '@vidhyasaathy/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiClientError, getJson, postEmpty } from './api/client';
import { clearCachedLists, ME_KEY, readCachedMe, removeStorage, writeCachedMe, type CachedMe } from './storage';

type SessionState = {
  status: 'loading' | 'anonymous' | 'ready' | 'error';
  me: Me | null;
  updatedAt: string | null;
  stale: boolean;
  message: string | null;
};

type SessionValue = SessionState & {
  reload: () => void;
  accept: (me: Me) => void;
  signOut: () => Promise<string | null>;
};

const SessionContext = createContext<SessionValue | null>(null);

function failureState(message: string, cached: CachedMe | null): SessionState {
  if (!cached) return { status: 'error', me: null, updatedAt: null, stale: false, message };
  return { status: 'error', me: cached.me, updatedAt: cached.updatedAt, stale: true, message };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: 'loading', me: null, updatedAt: null, stale: false, message: null,
  });
  const [attempt, setAttempt] = useState(0);

  const accept = useCallback((me: Me) => {
    if (readCachedMe()?.me.profile.id !== me.profile.id) clearCachedLists();
    const cached = writeCachedMe(me);
    setState({ status: 'ready', me, updatedAt: cached.updatedAt, stale: false, message: null });
  }, []);

  useEffect(() => {
    const expire = () => {
      removeStorage(ME_KEY);
      clearCachedLists();
      setState({ status: 'anonymous', me: null, updatedAt: null, stale: false, message: 'Your session expired. Please sign in again.' });
    };
    window.addEventListener('session-expired', expire);
    return () => { window.removeEventListener('session-expired', expire); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    void getJson('/me', MeSchema, signal).then((me) => {
      if (controller.signal.aborted) return;
      accept(me);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiClientError && error.status === 401) {
        removeStorage(ME_KEY);
        setState({ status: 'anonymous', me: null, updatedAt: null, stale: false, message: null });
        return;
      }
      const message = error instanceof DOMException && error.name === 'TimeoutError'
        ? 'The request timed out.'
        : error instanceof ApiClientError
          ? error.message
          : 'The request could not be completed.';
      setState(failureState(message, readCachedMe()));
    });
    return () => { controller.abort(); };
  }, [accept, attempt]);

  const signOut = useCallback(async () => {
    try {
      await postEmpty('/auth/logout');
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'The request could not be completed.';
      setState((current) => ({ ...current, status: 'error', stale: current.me !== null, message }));
      return message;
    }
    removeStorage(ME_KEY);
    clearCachedLists();
    setState({ status: 'anonymous', me: null, updatedAt: null, stale: false, message: null });
    return null;
  }, []);

  const value = useMemo<SessionValue>(() => ({
    ...state,
    reload: () => { setAttempt((current) => current + 1); },
    accept,
    signOut,
  }), [accept, signOut, state]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider is missing.');
  return value;
}
