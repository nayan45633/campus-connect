import { useEffect, type FC } from 'react';
import type { CampusAnnouncement } from '@/types';
import { X, Megaphone, Calendar, Building, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AnnouncementDialogProps {
  announcement: CampusAnnouncement | null;
  onClose: () => void;
}

export const AnnouncementDialog: FC<AnnouncementDialogProps> = ({
  announcement,
  onClose,
}) => {
  useEffect(() => {
    if (!announcement) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announcement, onClose]);

  if (!announcement) return null;

  const priorityVariants: Record<string, 'indigo' | 'warning' | 'neutral'> = {
    Urgent: 'warning',
    Academic: 'indigo',
    General: 'neutral',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <Megaphone size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-text-muted">
                Official Campus Notice
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            aria-label="Close announcement dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={priorityVariants[announcement.priority] || 'indigo'}>
              {announcement.priority}
            </Badge>
            <span className="text-xs text-slate-400 dark:text-dark-text-muted flex items-center gap-1">
              <Calendar size={13} /> {announcement.date}
            </span>
          </div>

          <h2
            id="announcement-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-dark-text-main leading-snug"
          >
            {announcement.title}
          </h2>

          <p className="text-sm text-slate-600 dark:text-dark-text-main leading-relaxed bg-slate-50 dark:bg-dark-surface/80 p-4 rounded-xl border border-slate-150 dark:border-dark-border">
            {announcement.summary}
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-dark-text-muted">
            <Building size={14} className="text-slate-400 dark:text-dark-text-muted" />
            <span>Issued by: <strong className="text-slate-700 dark:text-dark-text-main font-medium">{announcement.department}</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50">
          <Button variant="primary" size="sm" onClick={onClose} className="gap-1.5 cursor-pointer">
            <CheckCircle2 size={15} />
            <span>Understood</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
