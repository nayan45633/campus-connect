import type { FC } from 'react';
import type { CampusEvent } from '@/types';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FeaturedEventBannerProps {
  event: CampusEvent;
  onSelect: (event: CampusEvent) => void;
  onToggleRsvp: (eventId: string) => void;
}

export const FeaturedEventBanner: FC<FeaturedEventBannerProps> = ({
  event,
  onSelect,
  onToggleRsvp,
}) => {
  return (
    <section
      aria-label="Featured Campus Event"
      className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-700/60"
    >
      {/* Decorative ambient auras */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-60 w-60 rounded-full bg-indigo-400/20 blur-2xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Badge + Title + Details */}
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-semibold backdrop-blur-xs">
              <Sparkles size={12} className="text-amber-300" />
              <span>Flagship Campus Event</span>
            </span>

            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20 text-xs"
            >
              {event.category} Track
            </Badge>

            {event.isRsvpd && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-xs font-medium">
                <Check size={12} />
                <span>RSVP Confirmed</span>
              </span>
            )}
          </div>

          <h2
            onClick={() => onSelect(event)}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight cursor-pointer hover:text-indigo-200 transition-colors"
          >
            {event.title}
          </h2>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-xl">
            {event.shortDescription}
          </p>

          {/* Quick logistical details */}
          <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-indigo-200">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-indigo-300" />
              {event.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-indigo-300" />
              {event.time}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-indigo-300" />
              {event.location}
            </span>
          </div>

          {/* Highlights pills */}
          {event.highlights && (
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {event.highlights.slice(0, 3).map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-100 border border-white/10"
                >
                  <Trophy size={11} className="text-amber-300" />
                  <span>{h}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Big RSVP Card & Stats */}
        <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
          <div className="text-left lg:text-right space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 block">
              Current Enrollment
            </span>
            <div className="flex items-baseline gap-1.5 justify-start lg:justify-end">
              <Users size={18} className="text-indigo-300" />
              <span className="text-2xl font-black text-white">
                {event.attendeesCount}
              </span>
              {event.capacity && (
                <span className="text-xs text-indigo-200">
                  / {event.capacity} capacity
                </span>
              )}
            </div>
            <span className="text-[11px] text-emerald-300 block">
              Free registration for students
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelect(event)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold cursor-pointer gap-1.5"
            >
              <span>Explore Details</span>
              <ArrowRight size={14} />
            </Button>

            <Button
              type="button"
              variant={event.isRsvpd ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => onToggleRsvp(event.id)}
              className="font-bold cursor-pointer gap-1.5 shadow-sm"
            >
              {event.isRsvpd ? (
                <>
                  <X size={14} />
                  <span>Cancel RSVP</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>RSVP Now</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
