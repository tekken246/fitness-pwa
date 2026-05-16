import { clsx, type ClassValue } from 'clsx';

/** Joins conditional class names into one class string. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
