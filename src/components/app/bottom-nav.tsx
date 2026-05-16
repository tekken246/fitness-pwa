'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Activity, CalendarDays, Dumbbell, LineChart, Settings } from 'lucide-react';

import { cn } from '@/lib/utils';

const items = [
  { href: '/today', label: 'Today', icon: Dumbbell },
  { href: '/workouts', label: 'Plan', icon: CalendarDays },
  { href: '/history', label: 'History', icon: Activity },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Renders the mobile bottom navigation. */
export function BottomNav(): ReactNode {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] font-semibold text-muted transition focus:outline-none focus:ring-2 focus:ring-primary',
                active && 'bg-primary/15 text-foreground',
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
