'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { updateUserSettings } from '@/lib/data/settings';
import { toErrorMessage } from '@/lib/errors';
import { requireClerkUserId } from '@/lib/auth';
import type { ActionResult } from '@/lib/actions/workout-actions';
import { parseSettingsInput } from '@/lib/validation';

/** Updates authenticated user settings and persists the theme cookie for first paint. */
export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = parseSettingsInput(input);
    const clerkUserId = await requireClerkUserId();
    await updateUserSettings(clerkUserId, parsed);
    const cookieStore = await cookies();
    cookieStore.set('fit_theme', parsed.theme, {
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath('/settings');
    revalidatePath('/today');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
