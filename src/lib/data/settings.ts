import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { userSettings } from '@/db/schema';
import type { ThemePreference, UnitPreference, UserSettings } from '@/lib/types';

const DEFAULT_SETTINGS: Omit<UserSettings, 'clerkUserId'> = {
  unit: 'lb',
  theme: 'dark',
  timezone: 'UTC',
};

/** Gets settings for the user, creating defaults on first access. */
export async function getOrCreateUserSettings(clerkUserId: string): Promise<UserSettings> {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) {
    return {
      clerkUserId: existing[0].clerkUserId,
      unit: existing[0].unit as UnitPreference,
      theme: existing[0].theme as ThemePreference,
      timezone: existing[0].timezone,
    };
  }

  const created = await db
    .insert(userSettings)
    .values({ clerkUserId, ...DEFAULT_SETTINGS })
    .onConflictDoNothing()
    .returning();

  const row = created[0] ?? {
    clerkUserId,
    unit: DEFAULT_SETTINGS.unit,
    theme: DEFAULT_SETTINGS.theme,
    timezone: DEFAULT_SETTINGS.timezone,
  };

  return {
    clerkUserId: row.clerkUserId,
    unit: row.unit as UnitPreference,
    theme: row.theme as ThemePreference,
    timezone: row.timezone,
  };
}

/** Updates settings for the authenticated user. */
export async function updateUserSettings(
  clerkUserId: string,
  values: Omit<UserSettings, 'clerkUserId'>,
): Promise<UserSettings> {
  const updated = await db
    .insert(userSettings)
    .values({
      clerkUserId,
      unit: values.unit,
      theme: values.theme,
      timezone: values.timezone,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.clerkUserId,
      set: {
        unit: values.unit,
        theme: values.theme,
        timezone: values.timezone,
        updatedAt: new Date(),
      },
    })
    .returning();

  const row = updated[0];

  if (!row) {
    throw new Error('Unable to update settings.');
  }

  return {
    clerkUserId: row.clerkUserId,
    unit: row.unit as UnitPreference,
    theme: row.theme as ThemePreference,
    timezone: row.timezone,
  };
}
