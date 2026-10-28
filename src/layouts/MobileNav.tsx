import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '@/data/mockData';
import { cn } from '@/lib/utils';

export const MobileNav: FC = () => {
  // Select top 5 primary destinations for mobile thumb navigation
  const mobileItems = navigationItems.filter(item =>
    ['/', '/explore', '/communities', '/events', '/profile'].includes(item.path)
  );

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 backdrop-blur px-2 py-1 shadow-lg select-none transition-colors duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-2'} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-dark-surface" />
                    )}
                  </div>
                  <span className="text-[11px] mt-1">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
