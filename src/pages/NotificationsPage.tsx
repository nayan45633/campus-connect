import { useState, useMemo, type FC, type ChangeEvent } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  RotateCcw,
  Search,
  X,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';
import { useCampusNotifications } from '@/hooks/useCampusNotifications';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CampusNotification, NotificationTimeframe } from '@/types';

type NotificationFilterTab = 'all' | 'unread';

export const NotificationsPage: FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    toggleReadStatus,
    markAllAsRead,
    resetToDefault,
  } = useCampusNotifications();

  const [activeTab, setActiveTab] = useState<NotificationFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Auto-dismiss transient feedback message
  const triggerFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 3200);
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
    triggerFeedback('All campus notifications marked as read', 'success');
  };

  const handleReset = () => {
    resetToDefault();
    triggerFeedback('Notifications reset to initial demo state', 'info');
  };

  // Filter notifications by active tab and search query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Tab filter
      if (activeTab === 'unread' && notif.isRead) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = notif.title.toLowerCase().includes(q);
        const matchesMessage = notif.message.toLowerCase().includes(q);
        const matchesActor = notif.actor?.name.toLowerCase().includes(q) || false;
        const matchesHandle = notif.actor?.handle?.toLowerCase().includes(q) || false;

        return matchesTitle || matchesMessage || matchesActor || matchesHandle;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Group filtered notifications by timeframe
  const groupedByTimeframe = useMemo(() => {
    const timeframes: NotificationTimeframe[] = ['Today', 'Yesterday', 'Earlier'];
    const groups: { timeframe: NotificationTimeframe; items: CampusNotification[] }[] = [];

    timeframes.forEach((tf) => {
      const items = filteredNotifications.filter((n) => n.timeframe === tf);
      if (items.length > 0) {
        groups.push({ timeframe: tf, items });
      }
    });

    return groups;
  }, [filteredNotifications]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay up to date with what's happening on campus."
        badge={
          unreadCount > 0 ? (
            <Badge variant="indigo" className="gap-1 hidden sm:inline-flex">
              <Bell size={12} />
              <span>{unreadCount} Unread</span>
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1 hidden sm:inline-flex">
              <CheckCheck size={12} />
              <span>All Caught Up</span>
            </Badge>
          )
        }
      />

      {/* Transient Action Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className={cn(
            'flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
          )}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:text-dark-text-muted dark:hover:text-dark-text-main p-1 rounded-md"
            aria-label="Dismiss feedback message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-dark-surface p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        {/* Tab Filters: All vs Unread */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-dark-text-main'
            )}
          >
            <Inbox size={15} />
            <span>All</span>
            <span
              className={cn(
                'ml-1 text-[11px] px-1.5 py-0.5 rounded-md',
                activeTab === 'all'
                  ? 'bg-indigo-700/60 text-white'
                  : 'bg-slate-100 dark:bg-dark-card text-slate-500 dark:text-dark-text-muted'
              )}
            >
              {notifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
              activeTab === 'unread'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-dark-text-main'
            )}
          >
            <Sparkles size={15} />
            <span>Unread</span>
            {unreadCount > 0 ? (
              <span
                className={cn(
                  'ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                  activeTab === 'unread'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-600 text-white'
                )}
              >
                {unreadCount}
              </span>
            ) : (
              <span
                className={cn(
                  'ml-1 text-[11px] px-1.5 py-0.5 rounded-md',
                  activeTab === 'unread'
                    ? 'bg-indigo-700/60 text-white'
                    : 'bg-slate-100 dark:bg-dark-card text-slate-500 dark:text-dark-text-muted'
                )}
              >
                0
              </span>
            )}
          </button>
        </div>

        {/* Search input and action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Input
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              icon={<Search size={14} />}
              className="h-9 text-xs bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main p-0.5"
                aria-label="Clear notification search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Mark all as read */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="h-9 whitespace-nowrap text-xs font-semibold gap-1.5 cursor-pointer disabled:opacity-50"
            title={unreadCount === 0 ? 'No unread notifications' : 'Mark all notifications as read'}
          >
            <CheckCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read all</span>
          </Button>

          {/* Reset Demo Alerts */}
          <button
            type="button"
            onClick={handleReset}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-500 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors cursor-pointer shrink-0"
            title="Reset notifications demo data"
            aria-label="Reset notifications to default demo state"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {groupedByTimeframe.length > 0 ? (
        <div className="space-y-6">
          {groupedByTimeframe.map((group) => (
            <section key={group.timeframe} aria-labelledby={`timeframe-${group.timeframe}`}>
              {/* Group Section Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3
                    id={`timeframe-${group.timeframe}`}
                    className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-dark-text-muted"
                  >
                    {group.timeframe}
                  </h3>
                  <Badge variant="neutral" className="text-[10px] px-1.5 py-0 font-medium">
                    {group.items.length}
                  </Badge>
                </div>

                {group.items.some((i) => !i.isRead) && (
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                    {group.items.filter((i) => !i.isRead).length} unread
                  </span>
                )}
              </div>

              {/* Group Cards Grid/List */}
              <div className="space-y-3">
                {group.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    notification={item}
                    onMarkAsRead={markAsRead}
                    onToggleReadStatus={toggleReadStatus}
                    onActionFeedback={(msg) => triggerFeedback(msg, 'info')}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Empty states */
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200/80 dark:border-dark-border p-8 text-center shadow-xs">
          {activeTab === 'unread' && searchQuery === '' ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up!"
              description="No unread notifications right now. Great job keeping on top of your campus updates."
              actionLabel="View All Notifications"
              onAction={() => setActiveTab('all')}
            />
          ) : searchQuery !== '' ? (
            <EmptyState
              icon={Filter}
              title="No notifications found"
              description={`No notifications matched your search "${searchQuery}".`}
              actionLabel="Clear search"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No notifications yet"
              description="Your notifications will appear here as classmates interact with your posts, announce events, or publish notices."
              actionLabel="Reset Sample Notifications"
              onAction={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
};
