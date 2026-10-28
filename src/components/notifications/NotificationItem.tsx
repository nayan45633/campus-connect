import type { FC, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  Users,
  Megaphone,
  CheckCircle2,
  Circle,
  ExternalLink,
} from 'lucide-react';
import type { CampusNotification, NotificationType } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: CampusNotification;
  onMarkAsRead: (id: string) => void;
  onToggleReadStatus: (id: string) => void;
  onActionFeedback?: (message: string) => void;
}

/**
 * Returns configuration for icon styling by notification type
 */
function getNotificationTypeMeta(type: NotificationType) {
  switch (type) {
    case 'like':
      return {
        icon: Heart,
        color: 'text-rose-500 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-200/60 dark:ring-rose-800/40',
        label: 'Like',
      };
    case 'comment':
      return {
        icon: MessageSquare,
        color: 'text-sky-500 dark:text-sky-400',
        bg: 'bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-200/60 dark:ring-sky-800/40',
        label: 'Comment',
      };
    case 'event_announced':
      return {
        icon: Calendar,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40',
        label: 'Event Announcement',
      };
    case 'event_reminder':
      return {
        icon: Clock,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-200/60 dark:ring-purple-800/40',
        label: 'Event Reminder',
      };
    case 'community_joined':
      return {
        icon: Users,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40',
        label: 'Community Update',
      };
    case 'notice_published':
      return {
        icon: Megaphone,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200/60 dark:ring-amber-800/40',
        label: 'Campus Notice',
      };
    default:
      return {
        icon: Megaphone,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40',
        label: 'Notification',
      };
  }
}

export const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onToggleReadStatus,
  onActionFeedback,
}) => {
  const navigate = useNavigate();
  const meta = getNotificationTypeMeta(notification.type);
  const Icon = meta.icon;

  const handleCardClick = () => {
    // Mark as read when opened/clicked
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
      onActionFeedback?.(`Marked "${notification.title}" as read`);
    }

    // Navigate to target section if provided
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
  };

  const handleToggleRead = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleReadStatus(notification.id);
    onActionFeedback?.(
      notification.isRead
        ? `Marked as unread`
        : `Marked as read`
    );
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        'group relative flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none',
        // Unread vs read styling
        !notification.isRead
          ? 'bg-indigo-50/40 dark:bg-dark-card/90 border-indigo-200/80 dark:border-indigo-900/50 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 shadow-xs'
          : 'bg-white dark:bg-dark-card/40 border-slate-200/70 dark:border-dark-border border-l-4 border-l-transparent hover:border-slate-300 dark:hover:border-dark-border/80 hover:bg-slate-50/70 dark:hover:bg-dark-elevated/40'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
    >
      {/* Left Avatar / Icon indicator badge */}
      <div className="relative shrink-0 pt-0.5">
        {notification.actor ? (
          <div className="relative">
            <Avatar
              initials={notification.actor.initials}
              size="md"
              alt={notification.actor.name}
              className="ring-2 ring-white dark:ring-dark-surface shadow-xs"
            />
            {/* Small icon badge overlapping avatar */}
            <div
              className={cn(
                'absolute -bottom-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full shadow-xs',
                meta.bg,
                meta.color
              )}
            >
              <Icon size={12} className="stroke-[2.5]" />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-xs',
              meta.bg,
              meta.color
            )}
          >
            <Icon size={20} className="stroke-2" />
          </div>
        )}
      </div>

      {/* Main Notification Body */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn(
                'text-sm sm:text-base leading-snug tracking-tight line-clamp-1',
                !notification.isRead
                  ? 'font-bold text-slate-900 dark:text-dark-text-main'
                  : 'font-medium text-slate-800 dark:text-dark-text-main/90'
              )}
            >
              {notification.title}
            </h4>

            {notification.actor && (
              <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">
                <span className="font-medium text-slate-700 dark:text-dark-text-main">
                  {notification.actor.name}
                </span>{' '}
                {notification.actor.handle && (
                  <span className="text-slate-400 dark:text-dark-text-muted">
                    {notification.actor.handle}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Time and unread dot */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-400 dark:text-dark-text-muted whitespace-nowrap">
              {notification.timeAgo}
            </span>
            {!notification.isRead && (
              <span
                className="h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-2 ring-indigo-200/50 dark:ring-indigo-900/40 animate-pulse"
                aria-label="Unread notification indicator"
              />
            )}
          </div>
        </div>

        {/* Message description */}
        <p
          className={cn(
            'text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed',
            !notification.isRead
              ? 'text-slate-700 dark:text-dark-text-main/90 font-normal'
              : 'text-slate-600 dark:text-dark-text-muted'
          )}
        >
          {notification.message}
        </p>

        {/* Card Footer / Action Links */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-dark-border/40">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400 dark:text-dark-text-muted">
              {notification.timestamp}
            </span>

            {notification.targetUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                <span>View destination</span>
                <ExternalLink size={11} />
              </span>
            )}
          </div>

          {/* Quick Mark Read / Unread toggle */}
          <button
            type="button"
            onClick={handleToggleRead}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-slate-500 dark:text-dark-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            aria-label={notification.isRead ? 'Mark as unread' : 'Mark as read'}
            title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {notification.isRead ? (
              <>
                <Circle size={13} className="text-slate-400 dark:text-dark-text-muted" />
                <span className="hidden sm:inline text-[11px]">Mark unread</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline text-[11px]">Mark read</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
