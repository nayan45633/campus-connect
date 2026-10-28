import type { FC } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: FC<BrandLogoProps> = ({
  className,
  showTagline = false,
  size = 'md',
}) => {
  const iconSizeClasses = {
    sm: 'h-7 w-7 rounded-lg',
    md: 'h-9 w-9 rounded-xl',
    lg: 'h-11 w-11 rounded-2xl',
  };

  const capIconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg',
        className
      )}
      aria-label="Campus Connect Home"
    >
      {/* Icon Badge */}
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition-transform duration-200 group-hover:scale-105',
          iconSizeClasses[size]
        )}
      >
        <GraduationCap size={capIconSizes[size]} className="text-white" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
        </span>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={cn('font-bold text-slate-900 dark:text-dark-text-main tracking-tight', titleSizes[size])}>
            Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
          </span>
          <Sparkles className="h-3.5 w-3.5 text-amber-500 hidden sm:inline-block" />
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-dark-text-muted tracking-normal mt-0.5">
            College Social Network
          </span>
        )}
      </div>
    </Link>
  );
};
