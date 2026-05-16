import type { ReactNode } from 'react';

import { ThemeSelector } from '@/components/settings/theme-selector';
import { Card } from '@/components/ui/card';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';

/** Renders authenticated user settings. */
export default async function SettingsPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Preferences</h1>
      </Card>
      <ThemeSelector settings={settings} />
      <Card>
        <h2 className="text-lg font-black tracking-tight">Install</h2>
        <p className="mt-2 text-sm text-muted">
          On iOS Safari, use Share then Add to Home Screen. On Chromium mobile, use the browser install prompt when available.
        </p>
      </Card>
    </div>
  );
}
