import { useState, type FC } from 'react';
import type { CampusAnnouncement, CampusCommunity, CampusEvent } from '@/types';
import {
  Calendar,
  Users,
  Megaphone,
  MapPin,
  Clock,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnnouncementDialog } from '@/components/feed/AnnouncementDialog';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface RightSidebarProps {
  events: CampusEvent[];
  communities: CampusCommunity[];
  announcements: CampusAnnouncement[];
  onToggleEventRsvp: (eventId: string) => void;
  onToggleCommunityJoin: (communityId: string) => void;
  className?: string;
}

export const RightSidebar: FC<RightSidebarProps> = ({
  events,
  communities,
  announcements,
  onToggleEventRsvp,
  onToggleCommunityJoin,
  className,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CampusAnnouncement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  // Derive active event with current RSVP and attendee counts
  const activeSelectedEvent = selectedEvent
    ? events.find((e) => e.id === selectedEvent.id) || selectedEvent
    : null;

  const priorityBadgeVariant: Record<string, 'warning' | 'indigo' | 'neutral'> = {
    Urgent: 'warning',
    Academic: 'indigo',
    General: 'neutral',
  };

  return (
    <>
      <aside className={cn('space-y-6', className)}>
        {/* 1. Upcoming Campus Events */}
        <Card className="overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-dark-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Calendar size={16} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-dark-text-main">
                Upcoming Events
              </CardTitle>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 group/link transition-colors cursor-pointer"
              aria-label="View all campus events"
            >
              <span>View all</span>
              <ChevronRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-dark-text-muted italic py-2 text-center">
                No upcoming events scheduled right now.
              </p>
            ) : (
              events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-elevated border border-transparent hover:border-slate-200/80 dark:hover:border-dark-border transition-all cursor-pointer select-none"
                  title="Click to view event details"
                >
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-11 h-12 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 text-center transition-transform group-hover:scale-105">
                    <span className="text-[9px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                      {event.month}
                    </span>
                    <span className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 leading-none">
                      {event.day}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-dark-text-main truncate leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-dark-text-muted">
                      <span className="flex items-center gap-1 truncate">
                        <Clock size={11} className="text-slate-400 dark:text-dark-text-muted" />
                        {event.time.split('–')[0]}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} className="text-slate-400 dark:text-dark-text-muted" />
                        {event.location.split('&')[0]}
                      </span>
                    </div>

                    {/* Actions & RSVP */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 dark:text-dark-text-muted flex items-center gap-1">
                        <Users size={12} />
                        {event.attendeesCount} going
                      </span>

                      <Button
                        type="button"
                        variant={event.isRsvpd ? 'soft' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleEventRsvp(event.id);
                        }}
                        className={cn(
                          'h-6 px-2.5 text-[11px] font-medium cursor-pointer transition-colors',
                          event.isRsvpd &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-rose-950/60 dark:hover:text-rose-400'
                        )}
                      >
                        {event.isRsvpd ? (
                          <>
                            <Check size={12} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            <span>Going</span>
                          </>
                        ) : (
                          <span>RSVP</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 2. Trending Student Communities */}
        <Card className="overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-dark-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Users size={16} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-dark-text-main">
                Trending Communities
              </CardTitle>
            </div>
            <Link
              to="/communities"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
            >
              <span>Explore</span>
              <ChevronRight size={13} />
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {communities.map((community) => (
              <div
                key={community.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs shadow-xs">
                    {community.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-dark-text-main truncate">
                      {community.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-dark-text-muted truncate">
                      {community.membersCount} members · {community.category}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={community.isJoined ? 'outline' : 'soft'}
                  size="sm"
                  onClick={() => onToggleCommunityJoin(community.id)}
                  className="h-7 px-2.5 text-xs font-medium shrink-0 cursor-pointer"
                >
                  {community.isJoined ? (
                    <>
                      <Check size={12} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>Join</span>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Important Campus Announcements */}
        <Card className="overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-dark-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Megaphone size={16} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-dark-text-main">
                Notice Board
              </CardTitle>
            </div>
            <Link
              to="/notice-board"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
            >
              <span>All Notices</span>
              <ChevronRight size={13} />
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {announcements.map((announcement) => (
              <button
                key={announcement.id}
                type="button"
                onClick={() => setSelectedAnnouncement(announcement)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/60 hover:bg-slate-50 dark:hover:bg-dark-elevated hover:border-slate-200 dark:hover:border-dark-border-strong transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge
                    variant={priorityBadgeVariant[announcement.priority] || 'neutral'}
                    className="text-[10px] px-2 py-0"
                  >
                    {announcement.priority}
                  </Badge>
                  <span className="text-[10px] text-slate-400 dark:text-dark-text-muted">
                    {announcement.date}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900 dark:text-dark-text-main group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {announcement.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-dark-text-muted mt-1 line-clamp-2 leading-relaxed">
                  {announcement.summary}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-dark-border flex items-center justify-between text-[10px] text-slate-400 dark:text-dark-text-muted">
                  <span className="truncate">{announcement.department}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Details</span>
                    <ExternalLink size={10} />
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* Interactive Announcement Details Dialog */}
      <AnnouncementDialog
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />

      {/* Interactive Event Details Dialog */}
      <EventDetailsDialog
        isOpen={Boolean(activeSelectedEvent)}
        event={activeSelectedEvent}
        onClose={() => setSelectedEvent(null)}
        onToggleRsvp={onToggleEventRsvp}
      />
    </>
  );
};
