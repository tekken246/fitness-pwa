import type { ReactNode } from 'react';

/** Renders the static offline fallback shell. */
export default function OfflinePage(): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <section className="max-w-sm rounded-3xl border border-border bg-card/85 p-6 text-center shadow-glow backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Offline</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Workout shell ready</h1>
        <p className="mt-3 text-sm text-muted">
          Open an active workout before going offline to keep local draft logging available. Saved drafts sync when the connection returns.
        </p>
      </section>
    </main>
  );
}
