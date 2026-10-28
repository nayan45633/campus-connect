import { useState, useEffect, type FC } from 'react';
import type { CampusNotice, NoticeCategory } from '@/types';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Pin,
  AlertCircle,
  Share2,
  Check,
  Mail,
  FileText,
  BookOpen,
  Briefcase,
  Award,
  Download,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoticeDetailsDialogProps {
  isOpen: boolean;
  notice: CampusNotice | null;
  onClose: () => void;
  onToggleRead: (noticeId: string) => void;
}

const categoryIcons: Record<NoticeCategory, typeof BookOpen> = {
  Academics: BookOpen,
  Examinations: FileText,
  Placements: Briefcase,
  Scholarships: Award,
  Events: Calendar,
};

export const NoticeDetailsDialog: FC<NoticeDetailsDialogProps> = ({
  isOpen,
  notice,
  onClose,
  onToggleRead,
}) => {
  // Hooks must be called unconditionally
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !notice) return null;

  const CategoryIcon = categoryIcons[notice.category] || FileText;
  const isUnread = !notice.isRead;

  const handleShare = async () => {
    const text = `Campus Notice: ${notice.title} (${notice.department})`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title,
          text,
          url,
        });
        setFeedback('Notice shared successfully!');
        setTimeout(() => setFeedback(null), 2500);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setFeedback('Notice link copied to clipboard!');
    } catch {
      setFeedback('Link copied!');
    }

    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDownloadAttachment = () => {
    if (notice.attachmentName) {
      setFeedback(`Downloading ${notice.attachmentName}...`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-start justify-between">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-white/15 text-white border-white/20 text-xs font-semibold backdrop-blur-xs inline-flex items-center gap-1"
              >
                <CategoryIcon size={12} />
                <span>{notice.category}</span>
              </Badge>

              {notice.isPinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/25 text-amber-200 border border-amber-300/30">
                  <Pin size={11} className="rotate-45" />
                  <span>Pinned Notice</span>
                </span>
              )}

              {notice.isImportant && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/25 text-rose-100 border border-rose-400/30">
                  <AlertCircle size={11} />
                  <span>Important</span>
                </span>
              )}

              {notice.referenceNumber && (
                <span className="text-[11px] font-mono bg-black/20 text-indigo-100 px-2 py-0.5 rounded border border-white/10">
                  Ref: {notice.referenceNumber}
                </span>
              )}
            </div>

            <h2
              id="notice-dialog-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug pt-1"
            >
              {notice.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close notice details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Transient feedback toast */}
          {feedback && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Key Logistical Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-150 dark:border-dark-border text-xs sm:text-sm">
            {/* Published Date */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Date Published
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{notice.publishedDate}</span>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  'p-2 rounded-lg shrink-0',
                  notice.expiryDate ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-dark-elevated text-slate-400 dark:text-dark-text-muted'
                )}
              >
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Validity / Expiry
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    notice.expiryDate ? 'text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-dark-text-muted'
                  )}
                >
                  {notice.expiryDate ? notice.expiryDate : 'Permanent Record'}
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Issuing Authority
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main block truncate">
                  {notice.department}
                </span>
                {notice.contactEmail && (
                  <a
                    href={`mailto:${notice.contactEmail}`}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <Mail size={12} />
                    <span>{notice.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Full Description & Notice Body */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
              Official Notice Directive
            </h3>
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-dark-surface/70 border border-slate-150 dark:border-dark-border text-sm text-slate-700 dark:text-dark-text-main leading-relaxed whitespace-pre-line font-normal">
              {notice.fullDescription}
            </div>
          </div>

          {/* Official Attachment if available */}
          {notice.attachmentName && (
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                Attached University Document
              </h3>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 shrink-0">
                    <FileDown size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-dark-text-main truncate">
                      {notice.attachmentName}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-dark-text-muted">
                      Official PDF Circular • {notice.attachmentSize || 'PDF Document'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAttachment}
                  className="gap-1.5 text-xs font-medium shrink-0 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-slate-600 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main cursor-pointer"
          >
            <Share2 size={15} />
            <span>Share Notice</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant={isUnread ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onToggleRead(notice.id)}
              className="gap-1.5 cursor-pointer font-semibold"
            >
              {isUnread ? (
                <>
                  <Check size={14} />
                  <span>Mark as Read</span>
                </>
              ) : (
                <>
                  <Mail size={14} />
                  <span>Mark as Unread</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
