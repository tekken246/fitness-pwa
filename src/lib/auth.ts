import 'server-only';

import { auth } from '@clerk/nextjs/server';

import { AppError } from '@/lib/errors';

/** Returns the authenticated Clerk user ID or throws a controlled authorization error. */
export async function requireClerkUserId(): Promise<string> {
  const authState = await auth();

  if (!authState.userId) {
    throw new AppError('unauthorized', 'You must be signed in.');
  }

  return authState.userId;
}
