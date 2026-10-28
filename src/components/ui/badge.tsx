import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        indigo:
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-150/70 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60',
        neutral:
          'bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-dark-text-muted border border-slate-200 dark:border-dark-border hover:bg-slate-200/80 dark:hover:bg-dark-border',
        outline:
          'border border-slate-300 dark:border-dark-border text-slate-600 dark:text-dark-text-muted bg-transparent hover:bg-slate-50 dark:hover:bg-dark-elevated',
        success:
          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
        warning:
          'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60',
        accent:
          'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60',
      },
    },
    defaultVariants: {
      variant: 'indigo',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

