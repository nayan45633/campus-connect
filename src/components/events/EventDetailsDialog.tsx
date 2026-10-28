import { useState, useEffect, type FC } from 'react';
import type { CampusEvent } from '@/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Share2,
  Check,
  Sparkles,
  Laptop,
  Music,
  Lightbulb,
  Trophy,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface EventDetailsDialogProps {
  isOpen: boolean;
  event: CampusEvent | null;
  onClose: () => void;
  onToggleRsvp: (eventId: string) => void;
}

const categoryIcons = {
  Technical: Laptop,
  Cultural: Music,
  Workshop: Lightbulb,
  Sports: Trophy,
  General: Compass,
};

const categoryBadgeVariants: Record<
  string,
  { variant: 'indigo' | 'accent' | 'warning' | 'success' | 'neutral' }
> = {
  Technical: { variant: 'indigo' },
  Cultural: { variant: 'accent' },
  Workshop: { variant: 'warning' },
  Sports: { variant: 'success' },
  General: { variant: 'neutral' },
};

export const EventDetailsDialog: FC<EventDetailsDialogProps> = ({
  isOpen,
  event,
  onClose,
  onToggleRsvp,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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

  if (!isOpen || !event) return null;

  const CategoryIcon = categoryIcons[event.category] || Compass;
  const badgeConfig = categoryBadgeVariants[event.category] || { variant: 'indigo' };

  const handleShare = async () => {
    const text = `Join me at "${event.title}" on ${event.date} at ${event.location}!`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text,
          url,
        });
        setShareFeedback('Shared!');
        setTimeout(() => setShareFeedback(null), 2500);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareFeedback('Event link copied to clipboard!');
    } catch {
      setShareFeedback('Link copied!');
    }

    setTimeout(() => setShareFeedback(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Event Category & Close button */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-start justify-between">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-white/15 text-white border-white/20 text-xs font-semibold backdrop-blur-xs inline-flex items-center gap-1"
              >
                <CategoryIcon size={12} />
                <span>{event.category}</span>
              </Badge>

              {event.isFeatured && (
                <Badge
                  variant="outline"
                  className="bg-amber-400/20 text-amber-200 border-amber-300/30 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Sparkles size={11} />
                  <span>Featured Flagship</span>
                </Badge>
              )}

              {event.isRsvpd && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/25 text-emerald-100 border-emerald-400/30 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  <span>You're Attending</span>
                </Badge>
              )}
            </div>

            <h2
              id="event-details-dialog-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug pt-1"
            >
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close event details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Share feedback toast */}
          {shareFeedback && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2 animate-fadeIn">
              <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Key Logistical Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-150 dark:border-dark-border text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{event.date}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Time
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{event.time}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Venue Location
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{event.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Attendance
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">
                  {event.attendeesCount} RSVP'd
                  {event.capacity ? ` / ${event.capacity} capacity` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 dark:border-dark-border bg-white dark:bg-dark-surface">
            <div className="flex items-center gap-3">
              <Avatar
                initials={event.organizer.avatarInitials}
                size="md"
                alt={event.organizer.name}
              />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-dark-text-muted block">
                  Hosted by
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-dark-text-main">
                  {event.organizer.name}
                </span>
                {event.organizer.role && (
                  <span className="text-xs text-slate-500 dark:text-dark-text-muted block">
                    {event.organizer.role}
                  </span>
                )}
              </div>
            </div>

            <Badge variant={badgeConfig.variant} className="text-xs">
              {event.category}
            </Badge>
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
              About This Event
            </h3>
            <p className="text-sm text-slate-700 dark:text-dark-text-main leading-relaxed whitespace-pre-line">
              {event.fullDescription}
            </p>
          </div>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                Event Highlights & Perks
              </h3>
              <ul className="space-y-1.5">
                {event.highlights.map((highlight, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-dark-text-main"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
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
            <span>Share Event</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              variant={event.isRsvpd ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => onToggleRsvp(event.id)}
              className="gap-1.5 cursor-pointer font-semibold px-4"
            >
              {event.isRsvpd ? (
                <>
                  <X size={15} />
                  <span>Cancel RSVP</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>RSVP to Event</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
