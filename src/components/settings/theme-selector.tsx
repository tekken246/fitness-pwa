'use client';

import { useState, useTransition } from 'react';
import type { ReactNode } from 'react';

import { updateSettingsAction } from '@/lib/actions/settings-actions';
import type { ThemePreference, UnitPreference, UserSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

type ThemeSelectorProps = {
  settings: UserSettings;
};

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Clean white training interface.' },
  { value: 'dark', label: 'Dark', description: 'High-contrast black training interface.' },
  { value: 'rose', label: 'Rose Glow', description: 'Rose, lavender, gradient, glass styling.' },
];

/** Renders settings controls for theme, unit preference, and timezone. */
export function ThemeSelector({ settings }: ThemeSelectorProps): ReactNode {
  const [theme, setTheme] = useState(settings.theme);
  const [unit, setUnit] = useState(settings.unit);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (): void => {
    startTransition(() => {
      updateSettingsAction({ theme, unit, timezone }).then((result) => {
        if (!result.ok) {
          setMessage(result.error);
          return;
        }

        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem('fit_theme', theme);
        setMessage('Settings saved.');
      });
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card/80 p-5 shadow-glow backdrop-blur">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Appearance</p>
        <h2 className="text-xl font-black tracking-tight">Theme selector</h2>
      </div>

      <div className="grid gap-3">
        {themeOptions.map((option) => (
          <button
            className={cn(
              'rounded-2xl border border-border bg-background/45 p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary',
              theme === option.value && 'border-primary bg-primary/15',
            )}
            key={option.value}
            onClick={() => setTheme(option.value)}
            type="button"
          >
            <span className="block text-base font-black">{option.label}</span>
            <span className="mt-1 block text-sm text-muted">{option.description}</span>
          </button>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Units</span>
        <select
          className="h-12 w-full rounded-2xl border-border bg-background/70 font-bold focus:border-primary focus:ring-primary"
          onChange={(event) => setUnit(event.currentTarget.value as UnitPreference)}
          value={unit}
        >
          <option value="lb">Pounds</option>
          <option value="kg">Kilograms</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Timezone</span>
        <input
          className="h-12 w-full rounded-2xl border-border bg-background/70 font-bold focus:border-primary focus:ring-primary"
          onChange={(event) => setTimezone(event.currentTarget.value)}
          placeholder="America/New_York"
          value={timezone}
        />
      </label>

      {message ? <p className="rounded-2xl bg-background/60 p-3 text-sm font-semibold text-muted">{message}</p> : null}

      <button
        className="h-12 w-full rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.18em] text-background disabled:opacity-60"
        disabled={isPending}
        onClick={save}
        type="button"
      >
        Save settings
      </button>
    </section>
  );
}
