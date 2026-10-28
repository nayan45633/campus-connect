import { useState, useMemo, type FC, type ChangeEvent } from 'react';
import type { CampusNotice, NoticeCategory } from '@/types';
import {
  Megaphone,
  Search,
  X,
  Filter,
  CheckCheck,
  CheckCircle2,
  BookOpen,
  FileText,
  Briefcase,
  Award,
  Calendar,
  Pin,
  MailCheck,
} from 'lucide-react';
import { useCampusNotices } from '@/hooks/useCampusNotices';
import { PageHeader } from '@/components/common/PageHeader';
import { NoticeCard } from '@/components/notices/NoticeCard';
import { NoticeDetailsDialog } from '@/components/notices/NoticeDetailsDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categories: { label: NoticeCategory | 'All'; icon?: typeof BookOpen }[] = [
  { label: 'All' },
  { label: 'Academics', icon: BookOpen },
  { label: 'Examinations', icon: FileText },
  { label: 'Placements', icon: Briefcase },
  { label: 'Scholarships', icon: Award },
  { label: 'Events', icon: Calendar },
];

export const NoticeBoardPage: FC = () => {
  const {
    notices,
    unreadCount,
    toggleReadStatus,
    markAsRead,
    markAllAsRead,
  } = useCampusNotices();

  // Search, category, and unread-only filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | 'All'>('All');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Modal dialog state
  const [selectedNotice, setSelectedNotice] = useState<CampusNotice | null>(null);

  // Transient feedback banner
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Filter notices conjunctively based on search, category, and unread status
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      // 1. Unread filter
      if (showOnlyUnread && notice.isRead) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && notice.category !== selectedCategory) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = notice.title.toLowerCase().includes(query);
        const matchesShortDesc = notice.shortDescription.toLowerCase().includes(query);
        const matchesFullDesc = notice.fullDescription.toLowerCase().includes(query);
        const matchesDept = notice.department.toLowerCase().includes(query);
        const matchesRef = notice.referenceNumber?.toLowerCase().includes(query);

        return matchesTitle || matchesShortDesc || matchesFullDesc || matchesDept || matchesRef;
      }

      return true;
    });
  }, [notices, selectedCategory, searchQuery, showOnlyUnread]);

  // Split into pinned notices and general notices
  const pinnedNotices = useMemo(() => {
    return filteredNotices.filter((n) => n.isPinned);
  }, [filteredNotices]);

  const regularNotices = useMemo(() => {
    return filteredNotices.filter((n) => !n.isPinned);
  }, [filteredNotices]);

  // Handle opening notice: opens dialog and marks as read
  const handleSelectNotice = (notice: CampusNotice) => {
    setSelectedNotice(notice);
    if (!notice.isRead) {
      markAsRead(notice.id);
    }
  };

  // Handle manual toggle of read/unread
  const handleToggleRead = (noticeId: string) => {
    const result = toggleReadStatus(noticeId);
    if (result.isRead) {
      setFeedback({
        message: `Marked "${result.noticeTitle}" as read.`,
        type: 'info',
      });
    } else {
      setFeedback({
        message: `Marked "${result.noticeTitle}" as unread.`,
        type: 'info',
      });
    }

    // Keep active dialog in sync if open
    setSelectedNotice((current) => {
      if (current && current.id === noticeId) {
        return {
          ...current,
          isRead: result.isRead,
        };
      }
      return current;
    });

    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Handle Mark All as Read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setFeedback({
      message: 'All notices have been marked as read. You are completely caught up! 🎓',
      type: 'success',
    });

    if (selectedNotice) {
      setSelectedNotice((current) => (current ? { ...current, isRead: true } : null));
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setShowOnlyUnread(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* 1. Page Header with Title, Subtitle, and Quick Actions */}
      <PageHeader
        title="Campus Notice Board"
        description="Stay updated with important campus announcements."
        badge={
          unreadCount > 0 ? (
            <Badge variant="indigo" className="gap-1 hidden sm:inline-flex">
              <Megaphone size={12} />
              <span>{unreadCount} Unread</span>
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1 hidden sm:inline-flex">
              <CheckCheck size={12} />
              <span>All Caught Up</span>
            </Badge>
          )
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter toggle: Show Unread Only */}
          <button
            type="button"
            onClick={() => setShowOnlyUnread((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border',
              showOnlyUnread
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-elevated'
            )}
          >
            <MailCheck size={14} />
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  showOnlyUnread ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted'
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mark all as read button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="gap-1.5 text-xs font-medium cursor-pointer bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border"
          >
            <CheckCheck size={14} className="text-slate-500 dark:text-dark-text-muted" />
            <span>Mark all as read</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. Visual Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={18}
              className={feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}
            />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Search and Category Filters Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, directive, department, or ref #..."
              icon={<Search size={16} />}
              className="bg-white dark:bg-dark-card pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Result Counter */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500 dark:text-dark-text-muted">
            <span>
              Showing <strong className="text-slate-900 dark:text-dark-text-main">{filteredNotices.length}</strong>{' '}
              {filteredNotices.length === 1 ? 'announcement' : 'announcements'}
            </span>

            {showOnlyUnread && (
              <Badge variant="indigo" className="text-xs">
                Filter: Unread Only
              </Badge>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80 dark:border-dark-border">
          <span className="text-xs font-semibold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Categories:
          </span>
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label;
            // Count for category
            const count =
              label === 'All'
                ? notices.length
                : notices.filter((n) => n.category === label).length;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(label)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer select-none',
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-dark-card border border-slate-200/90 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main'
                )}
              >
                {Icon && <Icon size={12} />}
                <span>{label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-dark-elevated text-slate-500 dark:text-dark-text-muted'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Notices Section */}
      {filteredNotices.length > 0 ? (
        <div className="space-y-8">
          {/* Pinned & Urgent Notices Section (shown if any pinned notices match filter) */}
          {pinnedNotices.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <Pin size={13} className="rotate-45" />
                </div>
                <span>Pinned & Priority Bulletins</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onSelect={handleSelectNotice}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regular Announcements Section */}
          {regularNotices.length > 0 && (
            <section className="space-y-3">
              {pinnedNotices.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-text-muted pt-2">
                  <div className="p-1 rounded-md bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted">
                    <FileText size={13} />
                  </div>
                  <span>Recent Campus Directives</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onSelect={handleSelectNotice}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={Megaphone}
          title="No campus notices found"
          description={
            showOnlyUnread
              ? 'You have read all announcements matching this view! Toggle off "Unread Only" to review past notices.'
              : searchQuery
              ? `No official notices matched your search query "${searchQuery}". Try searching for another topic or department.`
              : `There are currently no announcements posted under the "${selectedCategory}" category.`
          }
          actionLabel="Reset Filters & Show All Notices"
          onAction={handleResetFilters}
        />
      )}

      {/* 5. Notice Details Modal Dialog */}
      <NoticeDetailsDialog
        isOpen={Boolean(selectedNotice)}
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        onToggleRead={handleToggleRead}
      />
    </div>
  );
};
