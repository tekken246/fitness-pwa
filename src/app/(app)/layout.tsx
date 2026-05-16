import type { ReactNode } from 'react';

import { AppShell } from '@/components/app/app-shell';
import { requireClerkUserId } from '@/lib/auth';

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

/** Renders the protected application shell for authenticated users. */
export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps): Promise<ReactNode> {
  await requireClerkUserId();

  return <AppShell>{children}</AppShell>;
}
