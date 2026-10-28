import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names using clsx and merges conflicting Tailwind classes using tailwind-merge.
 * This is the standard utility function for styling components cleanly in modern React projects.
 *
 * @param inputs - Array or list of class values, objects, or arrays
 * @returns Cleaned and merged class name string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
