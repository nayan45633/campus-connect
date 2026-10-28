import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useCampusNotices } from '@/hooks/useCampusNotices';
import { useCampusNotifications } from '@/hooks/useCampusNotifications';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ className, onNavigate }) => {
  const { profile } = useStudentProfile();
  const { unreadCount: unreadNoticesCount } = useCampusNotices();
  const { unreadCount: unreadNotificationsCount } = useCampusNotifications();

  return (
    <aside
      className={cn(
        'flex flex-col justify-between w-64 shrink-0 border-r border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-surface p-4 h-[calc(100dvh-4rem)] sticky top-16 select-none transition-colors duration-200',
        className
      )}
    >
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted mb-2">
            Main Feeds
          </p>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const badge =
                item.path === '/notice-board'
                  ? unreadNoticesCount > 0
                    ? unreadNoticesCount
                    : undefined
                  : item.path === '/notifications'
                    ? unreadNotificationsCount > 0
                      ? unreadNotificationsCount
                      : undefined
                    : item.badge;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100/80 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-500 dark:text-dark-text-muted group-hover:text-slate-900 dark:group-hover:text-dark-text-main group-hover:bg-slate-200/50 dark:group-hover:bg-dark-card'
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      {badge !== undefined && (
                        <Badge
                          variant={isActive ? 'indigo' : 'neutral'}
                          className="text-[10px] px-2 py-0"
                        >
                          {badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Campus Shortcuts */}
        <div className="pt-2 border-t border-slate-100 dark:border-dark-border">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
            Campus Quick Links
          </p>
        </div>
      </div>

      {/* User profile card footer */}
      <NavLink
        to="/profile"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'rounded-xl border p-3 block transition-all duration-150',
            isActive
              ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
              : 'border-slate-200/90 dark:border-dark-border bg-slate-50/70 dark:bg-dark-card/70 hover:bg-slate-100/90 dark:hover:bg-dark-elevated'
          )
        }
      >
        <div className="flex items-center gap-3">
          <Avatar
            src={profile.avatarUrl}
            initials={profile.initials}
            size="md"
            isOnline={true}
            alt={profile.name}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-dark-text-main truncate">
              {profile.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-dark-text-muted truncate">
              Class of '{profile.graduationYear.toString().slice(-2)}
            </span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-dark-border flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-text-muted">
          <span className="truncate">{profile.major}</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">View Profile</span>
        </div>
      </NavLink>
    </aside>
  );
};
