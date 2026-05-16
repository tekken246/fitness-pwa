import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import { BottomNav } from '@/components/app/bottom-nav';

type AppShellProps = {
  children: ReactNode;
};

/** Renders the authenticated mobile application shell. */
export function AppShell({ children }: AppShellProps): ReactNode {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Fit Track</p>
            <h1 className="text-lg font-black tracking-tight">Workout PWA</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
