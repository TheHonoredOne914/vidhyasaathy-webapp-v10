import { createContext, useContext, useState, type ReactNode } from 'react';
import { DEMO_STORAGE_KEY, DemoStateSchema, loadDemoState, validDemoState, type DemoState } from './data';

type Store = { data: DemoState; update: (change: (data: DemoState) => DemoState) => void; reset: () => void; storageNote: string };
const DemoContext = createContext<Store | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => {
    try { return loadDemoState(localStorage.getItem(DEMO_STORAGE_KEY)); } catch { return loadDemoState(null); }
  });
  const [storageNote, setStorageNote] = useState('Sample edits are saved only in this browser.');
  function save(next: DemoState) {
    const parsed = DemoStateSchema.parse(next);
    if (!validDemoState(parsed)) throw new Error('The sample record has an invalid reference.');
    setData(parsed);
    try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(parsed)); setStorageNote('Sample edits are saved only in this browser.'); }
    catch { setStorageNote('Browser storage is unavailable. Edits last until you leave this demo.'); }
  }
  return <DemoContext.Provider value={{ data, update: (change) => save(change(data)), reset: () => save(loadDemoState(null)), storageNote }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const store = useContext(DemoContext);
  if (!store) throw new Error('DemoProvider is required.');
  return store;
}
