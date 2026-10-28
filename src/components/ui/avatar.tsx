import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg font-semibold',
};

const badgeSizeClasses = {
  sm: 'h-2 w-2 bottom-0 right-0 ring-1',
  md: 'h-2.5 w-2.5 bottom-0 right-0 ring-2',
  lg: 'h-3 w-3 bottom-0.5 right-0.5 ring-2',
  xl: 'h-3.5 w-3.5 bottom-1 right-1 ring-2',
};

/**
 * Harmonious, accessible color palettes for initials avatars
 */
const AVATAR_COLOR_PALETTES = [
  'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
  'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
  'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
  'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
];

/**
 * Deterministically maps initials to one of the attractive color palettes
 */
function getAvatarColorClass(initials: string): string {
  if (!initials) return AVATAR_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
}

export function Avatar({
  src,
  alt = 'Student Avatar',
  initials,
  size = 'md',
  isOnline,
  className,
  ...props
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const hasError = Boolean(src && failedSrc === src);

  const initialsColor = React.useMemo(() => getAvatarColorClass(initials), [initials]);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 rounded-full select-none overflow-visible',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailedSrc(src)}
          className="h-full w-full rounded-full object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full font-semibold uppercase tracking-wider border shadow-2xs',
            initialsColor
          )}
        >
          {initials.slice(0, 2)}
        </div>
      )}

      {typeof isOnline === 'boolean' && (
        <span
          aria-label={isOnline ? 'Online' : 'Offline'}
          className={cn(
            'absolute rounded-full ring-white dark:ring-dark-card z-10',
            isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
            badgeSizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
