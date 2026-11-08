import { useEffect, useState } from 'react';
import { z } from 'zod';
import { getJson, postJson, putJson } from '../api/client';

const Settings = z.object({ geminiConfigured: z.boolean(), geminiKeyMasked: z.string().nullable(), geminiModel: z.string(), source: z.enum(['founder', 'environment', 'fallback']) });
const Connection = z.object({ connected: z.boolean(), message: z.string() });

/** Admin-only parent and server route; raw keys never enter browser storage. */
export function SaathyProviderSettings() {
  const [settings, setSettings] = useState<z.infer<typeof Settings> | null>(null);
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    void getJson('/founder/settings', Settings, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setSettings(value); setModel(value.geminiModel); }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);
  async function save(remove = false) {
    setPending(true); setNotice('');
    try {
      const value = await putJson('/founder/settings', Settings, { geminiModel: model, ...(remove ? { geminiApiKey: null } : key.trim() ? { geminiApiKey: key.trim() } : {}) });
      setSettings(value); setKey(''); setNotice('Saved. Use Test connection to check the provider.');
    } catch { setNotice('Could not save the provider settings. Check the model name and try again.'); }
    finally { setPending(false); }
  }
  async function test() {
    setPending(true); setNotice('');
    try { const result = await postJson('/founder/test-connection', Connection, {}); setNotice(result.message); }
    catch { setNotice('The provider could not be tested. Try again.'); }
    finally { setPending(false); }
  }
  return <section className="nb-card" aria-label="Founder settings"><h2 className="nb-h2">Ask Saathy · Founder settings</h2><p>Connect Gemini for adaptive explanations. This key is sent to your API server and is never stored in this browser.</p>
    {failed ? <p role="alert">Could not load provider settings. <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p> : !settings ? <p role="status">Loading provider settings…</p> : <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <p className="nb-meta">{settings.geminiConfigured ? `Key configured (${settings.geminiKeyMasked}) · ${settings.source === 'environment' ? 'Server environment' : 'Saved for this school'}` : 'No Gemini key configured. Server-configured alternatives may still be available.'}</p>
      <label>Gemini API key<input className="nb-input" type="password" autoComplete="off" value={key} maxLength={512} placeholder={settings.geminiConfigured ? 'Leave blank to keep the current key' : 'Enter your Gemini API key'} disabled={pending} onChange={(event) => setKey(event.target.value)} /></label>
      <label>Gemini model<input className="nb-input" value={model} required maxLength={100} disabled={pending} onChange={(event) => setModel(event.target.value)} /></label>
      <div className="proto-actions"><button className="nb-btn nb-btn--primary" type="submit" disabled={pending}>Save AI settings</button><button className="nb-btn" type="button" disabled={pending || !!key.trim()} onClick={() => { void test(); }}>Test connection</button>{settings.source === 'founder' ? <button className="nb-btn nb-btn--ghost" type="button" disabled={pending} onClick={() => { void save(true); }}>Remove saved key</button> : null}</div>
      {key.trim() ? <p className="nb-meta">Save this key before testing.</p> : null}
    </form>}{notice ? <p role="status">{notice}</p> : null}
  </section>;
}
