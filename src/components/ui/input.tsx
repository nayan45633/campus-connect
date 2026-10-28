import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-dark-text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1 text-sm text-slate-900 dark:text-dark-text-main shadow-xs transition-colors',
            'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted',
            'focus-visible:outline-none focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-9',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
