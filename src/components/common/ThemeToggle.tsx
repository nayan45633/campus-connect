import type { FC } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200 cursor-pointer select-none',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        isDark
          ? 'bg-dark-elevated border-dark-border text-amber-300 hover:bg-dark-card hover:text-amber-200 shadow-xs'
          : 'bg-slate-100/80 border-slate-200/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900',
        className
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="sr-only">Toggle theme (currently {theme})</span>
      <div className="relative h-4.5 w-4.5">
        <Sun
          size={18}
          className={cn(
            'absolute inset-0 transition-transform duration-300',
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          )}
        />
        <Moon
          size={18}
          className={cn(
            'absolute inset-0 transition-transform duration-300',
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          )}
        />
      </div>
    </button>
  );
};
