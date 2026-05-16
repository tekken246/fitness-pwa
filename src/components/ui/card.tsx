import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type CardProps = {
  children: ReactNode;
  className?: string;
};

/** Renders the standard glass card container. */
export function Card({ children, className }: CardProps): ReactNode {
  return <section className={cn('rounded-3xl border border-border bg-card/80 p-5 shadow-glow backdrop-blur', className)}>{children}</section>;
}
