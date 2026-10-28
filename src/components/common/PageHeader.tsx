import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-6 border-b border-slate-200/80 dark:border-dark-border md:flex-row md:items-center md:justify-between transition-colors duration-200',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-text-main">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-dark-text-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 pt-2 md:pt-0 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
