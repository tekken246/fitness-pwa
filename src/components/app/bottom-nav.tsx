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

/** Renders the premium mobile bottom navigation. */
export function BottomNav(): ReactNode {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0a0e1a]/85 px-2 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 backdrop-blur-[20px]">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          // Check if exactly this page, or a sub-page of this route
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1 text-center transition-colors focus:outline-none"
              href={item.href}
              key={item.href}
            >
              {/* Premium Active Pill Indicator */}
              {active && (
                <div className="absolute -top-1.5 left-1/2 h-[2px] w-[4px] -translate-x-1/2 rounded-full bg-[#22C55E]" />
              )}
              
              <Icon 
                aria-hidden="true" 
                className={cn(
                  'h-[22px] w-[22px] transition-colors', 
                  active ? 'text-[#22C55E]' : 'text-white/40 group-hover:text-white/60'
                )} 
              />
              
              <span 
                className={cn(
                  'text-[10px] font-semibold transition-colors', 
                  active ? 'text-[#22C55E]' : 'text-white/40'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}