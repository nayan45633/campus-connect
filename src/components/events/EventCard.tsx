import type { FC, MouseEvent } from 'react';
import type { CampusEvent } from '@/types';
import {
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Sparkles,
  Laptop,
  Music,
  Lightbulb,
  Trophy,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CampusEvent;
  onSelect: (event: CampusEvent) => void;
  onToggleRsvp: (eventId: string) => void;
}

const categoryIcons = {
  Technical: Laptop,
  Cultural: Music,
  Workshop: Lightbulb,
  Sports: Trophy,
  General: Compass,
};

const categoryBadgeConfig: Record<
  string,
  { variant: 'indigo' | 'accent' | 'warning' | 'success' | 'neutral'; barColor: string }
> = {
  Technical: { variant: 'indigo', barColor: 'bg-indigo-600' },
  Cultural: { variant: 'accent', barColor: 'bg-purple-600' },
  Workshop: { variant: 'warning', barColor: 'bg-amber-500' },
  Sports: { variant: 'success', barColor: 'bg-emerald-600' },
  General: { variant: 'neutral', barColor: 'bg-slate-500' },
};

export const EventCard: FC<EventCardProps> = ({
  event,
  onSelect,
  onToggleRsvp,
}) => {
  const CategoryIcon = categoryIcons[event.category] || Compass;
  const config = categoryBadgeConfig[event.category] || {
    variant: 'indigo',
    barColor: 'bg-indigo-600',
  };

  const handleRsvpClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleRsvp(event.id);
  };

  return (
    <Card
      hoverable
      onClick={() => onSelect(event)}
      className="group relative flex flex-col justify-between overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs hover:border-indigo-200 dark:hover:border-indigo-500/60 transition-all cursor-pointer"
    >
      {/* Top Category Accent Line */}
      <div className={cn('h-1 w-full', config.barColor)} />

      <div>
        <CardHeader className="p-4 sm:p-5 pb-3">
          {/* Top row: Category badge + Date badge + Featured tag */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant={config.variant}
                className="text-xs inline-flex items-center gap-1 font-medium"
              >
                <CategoryIcon size={12} />
                <span>{event.category}</span>
              </Badge>

              {event.isFeatured && (
                <Badge
                  variant="warning"
                  className="text-[11px] inline-flex items-center gap-0.5"
                >
                  <Sparkles size={11} />
                  <span>Featured</span>
                </Badge>
              )}
            </div>

            {/* Calendar Stamp */}
            <div className="flex flex-col items-center justify-center h-11 w-11 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:border-indigo-150 dark:group-hover:border-indigo-800 transition-colors">
              <span className="text-[9px] font-bold tracking-wider text-slate-500 dark:text-dark-text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400 uppercase">
                {event.month}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-dark-text-main group-hover:text-indigo-900 dark:group-hover:text-indigo-200 leading-none">
                {event.day}
              </span>
            </div>
          </div>

          <CardTitle className="text-base sm:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {event.title}
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-dark-text-muted line-clamp-2 pt-1 leading-relaxed">
            {event.shortDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-5 pb-4 space-y-2.5">
          {/* Logistical details */}
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-dark-text-muted">
            <div className="flex items-center gap-2 truncate">
              <Clock size={13} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <MapPin size={13} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Organizer preview */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                initials={event.organizer.avatarInitials}
                size="sm"
                alt={event.organizer.name}
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-dark-text-main truncate">
                {event.organizer.name}
              </span>
            </div>

            <span className="text-[11px] text-slate-400 dark:text-dark-text-muted flex items-center gap-1 shrink-0">
              <Users size={12} />
              {event.attendeesCount} RSVP'd
            </span>
          </div>
        </CardContent>
      </div>

      {/* Card Footer: Action buttons */}
      <CardFooter className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline inline-flex items-center gap-1">
          <span>View Details</span>
          <ArrowRight size={13} />
        </span>

        <Button
          type="button"
          variant={event.isRsvpd ? 'destructive' : 'primary'}
          size="sm"
          onClick={handleRsvpClick}
          className="h-8 px-3 text-xs font-semibold gap-1 cursor-pointer select-none"
        >
          {event.isRsvpd ? (
            <>
              <X size={13} />
              <span>Cancel RSVP</span>
            </>
          ) : (
            <>
              <Check size={13} />
              <span>RSVP</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
