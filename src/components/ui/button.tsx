import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500',
        secondary:
          'bg-slate-100 dark:bg-dark-elevated text-slate-800 dark:text-dark-text-main hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:border dark:border-dark-border',
        outline:
          'border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-dark-text-main shadow-sm hover:bg-slate-50 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-dark-border-strong',
        ghost:
          'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main',
        soft:
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:bg-indigo-200 font-semibold border border-transparent dark:border-indigo-800/40',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

