import type { FC, MouseEvent } from 'react';
import type { CampusNotice, NoticeCategory } from '@/types';
import {
  Pin,
  AlertCircle,
  Calendar,
  Clock,
  Building2,
  Check,
  Mail,
  FileText,
  BookOpen,
  Briefcase,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NoticeCardProps {
  notice: CampusNotice;
  onSelect: (notice: CampusNotice) => void;
  onToggleRead: (noticeId: string) => void;
}

const categoryIcons: Record<NoticeCategory, typeof BookOpen> = {
  Academics: BookOpen,
  Examinations: FileText,
  Placements: Briefcase,
  Scholarships: Award,
  Events: Calendar,
};

const categoryBadgeConfig: Record<
  NoticeCategory,
  { variant: 'indigo' | 'warning' | 'success' | 'accent' | 'neutral' }
> = {
  Academics: { variant: 'indigo' },
  Examinations: { variant: 'warning' },
  Placements: { variant: 'success' },
  Scholarships: { variant: 'accent' },
  Events: { variant: 'indigo' },
};

export const NoticeCard: FC<NoticeCardProps> = ({
  notice,
  onSelect,
  onToggleRead,
}) => {
  const CategoryIcon = categoryIcons[notice.category] || FileText;
  const badgeConfig = categoryBadgeConfig[notice.category] || { variant: 'indigo' };

  const handleToggleRead = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleRead(notice.id);
  };

  const isUnread = !notice.isRead;

  return (
    <Card
      hoverable
      onClick={() => onSelect(notice)}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden transition-all duration-200 border cursor-pointer',
        isUnread
          ? 'border-l-4 border-l-indigo-600 border-slate-200/90 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-md'
          : 'border-l-4 border-l-slate-300 dark:border-l-slate-700 border-slate-200/70 dark:border-dark-border bg-slate-50/40 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card hover:border-slate-300 dark:hover:border-slate-600 shadow-none'
      )}
    >
      <div>
        <CardHeader className="p-4 sm:p-5 pb-3 space-y-2.5">
          {/* Top row: Category, Pinned/Important, and Read Status Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category Badge */}
              <Badge
                variant={badgeConfig.variant}
                className="text-xs inline-flex items-center gap-1 font-medium"
              >
                <CategoryIcon size={12} />
                <span>{notice.category}</span>
              </Badge>

              {/* Pinned Notice Tag */}
              {notice.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  <Pin size={11} className="rotate-45" />
                  <span>Pinned</span>
                </span>
              )}

              {/* Important Tag */}
              {notice.isImportant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                  <AlertCircle size={11} />
                  <span>Important</span>
                </span>
              )}
            </div>

            {/* Read/Unread Status Tag */}
            <div className="flex items-center gap-1.5 text-xs">
              {isUnread ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-150 dark:border-indigo-900/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  <span>Unread</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-elevated px-2 py-0.5 rounded-full">
                  <Check size={11} />
                  <span>Read</span>
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <CardTitle
            className={cn(
              'text-base sm:text-lg tracking-tight transition-colors line-clamp-2 leading-snug pt-0.5',
              isUnread
                ? 'font-bold text-slate-900 dark:text-dark-text-main group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                : 'font-semibold text-slate-700 dark:text-dark-text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            )}
          >
            {notice.title}
          </CardTitle>

          {/* Short Description */}
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-dark-text-muted line-clamp-2 leading-relaxed">
            {notice.shortDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-5 pb-4 space-y-2.5">
          {/* Metadata Row: Publication Date, Expiry Date, Reference Number */}
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 dark:text-dark-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
              <span>Published: <strong className="text-slate-700 dark:text-dark-text-main">{notice.publishedDate}</strong></span>
            </span>

            {notice.expiryDate && (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Clock size={13} className="text-amber-500 shrink-0" />
                <span>Expires: <strong>{notice.expiryDate}</strong></span>
              </span>
            )}
          </div>

          {/* Department badge & Reference */}
          <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs text-slate-500 dark:text-dark-text-muted">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 size={13} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
              <span className="truncate font-medium text-slate-700 dark:text-dark-text-main">{notice.department}</span>
            </div>

            {notice.referenceNumber && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-dark-text-muted shrink-0 ml-2">
                #{notice.referenceNumber}
              </span>
            )}
          </div>
        </CardContent>
      </div>

      {/* Card Footer: Quick Actions */}
      <CardFooter className="px-4 sm:px-5 py-3 border-t border-slate-100/90 dark:border-dark-border bg-slate-50/60 dark:bg-dark-surface/60 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline inline-flex items-center gap-1">
          <span>Read Notice</span>
          <ArrowRight size={13} />
        </span>

        <Button
          type="button"
          variant={isUnread ? 'soft' : 'outline'}
          size="sm"
          onClick={handleToggleRead}
          className="h-7 px-2.5 text-xs font-medium cursor-pointer"
          title={isUnread ? 'Mark as read' : 'Mark as unread'}
        >
          {isUnread ? (
            <>
              <Check size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>Mark Read</span>
            </>
          ) : (
            <>
              <Mail size={12} className="text-slate-500 dark:text-dark-text-muted" />
              <span>Mark Unread</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
