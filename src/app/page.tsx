import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

/** Routes visitors to the correct authenticated or sign-in entry point. */
export default async function HomePage(): Promise<ReactNode> {
  const authState = await auth();

  if (authState.userId) {
    redirect('/today');
  }

  redirect('/sign-in');
}
