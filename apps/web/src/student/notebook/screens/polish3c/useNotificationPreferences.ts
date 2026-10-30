import { NotificationSettingsSchema, SaveNotificationSettingsSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { putJson } from '../../../../api/client';
import { useRemote } from '../../../../setup/useRemote';

type Preferences = z.infer<typeof NotificationSettingsSchema>;
type Changes = Partial<z.infer<typeof SaveNotificationSettingsSchema>>;

export function useNotificationPreferences() {
  const remote = useRemote('/notification-settings', NotificationSettingsSchema);
  const [data, setData] = useState<Preferences | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setData(remote.data); }, [remote.data]);

  async function save(changes: Changes) {
    if (!data || pending) return;
    setPending(true);
    setError(null);
    try {
      const { updatedAt: _updatedAt, ...current } = data;
      const input = SaveNotificationSettingsSchema.parse({ ...current, ...changes });
      setData(await putJson('/notification-settings', NotificationSettingsSchema, input));
      remote.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your settings. Try again.');
    } finally {
      setPending(false);
    }
  }

  return { ...remote, data, pending, error, save };
}
