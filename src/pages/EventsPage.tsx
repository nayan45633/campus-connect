import { useState, useMemo, type FC, type ChangeEvent } from 'react';
import type { CampusEvent, EventCategory } from '@/types';
import {
  Calendar,
  Search,
  X,
  Filter,
  CheckCircle2,
  BookmarkCheck,
  Compass,
  Laptop,
  Music,
  Lightbulb,
  Trophy,
} from 'lucide-react';
import { useCampusEvents } from '@/hooks/useCampusEvents';
import { PageHeader } from '@/components/common/PageHeader';
import { FeaturedEventBanner } from '@/components/events/FeaturedEventBanner';
import { EventCard } from '@/components/events/EventCard';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories: { label: EventCategory | 'All'; icon?: typeof Laptop }[] = [
  { label: 'All' },
  { label: 'Technical', icon: Laptop },
  { label: 'Cultural', icon: Music },
  { label: 'Workshop', icon: Lightbulb },
  { label: 'Sports', icon: Trophy },
  { label: 'General', icon: Compass },
];

export const EventsPage: FC = () => {
  const { events, toggleRsvp } = useCampusEvents();

  // Search, category, and joined filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);

  // Modal dialog state
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  // Transient feedback banner
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Identify featured event
  const featuredEvent = useMemo(() => {
    return events.find((e) => e.isFeatured) || events[0];
  }, [events]);

  // Count joined / RSVP'd events
  const joinedCount = useMemo(() => {
    return events.filter((e) => e.isRsvpd).length;
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Joined filter
      if (showOnlyJoined && !event.isRsvpd) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && event.category !== selectedCategory) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.shortDescription.toLowerCase().includes(query);
        const matchesLocation = event.location.toLowerCase().includes(query);
        const matchesOrganizer = event.organizer.name.toLowerCase().includes(query);
        const matchesTags = event.tags?.some((t) => t.toLowerCase().includes(query));

        return matchesTitle || matchesDesc || matchesLocation || matchesOrganizer || matchesTags;
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, showOnlyJoined]);

  // Handle RSVP toggle with real-time feedback
  const handleToggleRsvp = (eventId: string) => {
    const result = toggleRsvp(eventId);

    if (result.isRsvpd) {
      setFeedback({
        message: `RSVP confirmed for "${result.eventTitle}"! Added to your campus schedule. 📅`,
        type: 'success',
      });
    } else {
      setFeedback({
        message: `RSVP cancelled for "${result.eventTitle}". Your spot has been released.`,
        type: 'info',
      });
    }

    // Keep modal in sync if open
    setSelectedEvent((current) => {
      if (current && current.id === eventId) {
        const updated = events.find((e) => e.id === eventId);
        if (updated) {
          return {
            ...updated,
            isRsvpd: result.isRsvpd,
            attendeesCount: result.isRsvpd
              ? updated.attendeesCount + 1
              : Math.max(0, updated.attendeesCount - 1),
          };
        }
      }
      return current;
    });

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
    setShowOnlyJoined(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Campus Events"
        description="Discover hackathons, creative workshops, guest panels, and athletic tournaments happening across Pacific Coast University."
        badge={
          <Badge variant="indigo" className="hidden sm:inline-flex gap-1">
            <Calendar size={12} />
            <span>Spring Semester 2026</span>
          </Badge>
        }
      >
        <button
          type="button"
          onClick={() => setShowOnlyJoined((prev) => !prev)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border',
            showOnlyJoined
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-elevated'
          )}
        >
          <BookmarkCheck size={15} />
          <span>My RSVPs</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px]',
              showOnlyJoined ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted'
            )}
          >
            {joinedCount}
          </span>
        </button>
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

      {/* 3. Featured Flagship Event Section (shown when no search/joined filter is active) */}
      {!searchQuery && !showOnlyJoined && selectedCategory === 'All' && featuredEvent && (
        <FeaturedEventBanner
          event={featuredEvent}
          onSelect={(ev) => setSelectedEvent(ev)}
          onToggleRsvp={handleToggleRsvp}
        />
      )}

      {/* 4. Search and Category Filters Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full md:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, topic (#AI, #Figma), or venue..."
              icon={<Search size={16} />}
              className="bg-white dark:bg-dark-card pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main cursor-pointer"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Result Counter & Joined Filter Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500 dark:text-dark-text-muted">
            <span>
              Showing <strong className="text-slate-900 dark:text-dark-text-main">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>

            {showOnlyJoined && (
              <Badge variant="indigo" className="text-xs">
                Filter: Attending Only
              </Badge>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80 dark:border-dark-border">
          <span className="text-xs font-semibold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Tracks:
          </span>
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label;
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
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={(ev) => setSelectedEvent(ev)}
              onToggleRsvp={handleToggleRsvp}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No campus events found"
          description={
            showOnlyJoined
              ? "You haven't RSVP'd to any events yet. Browse the full schedule and join hackathons, workshops, and concerts!"
              : searchQuery
              ? `No events matched your search query "${searchQuery}". Try searching for another keyword or topic.`
              : `There are currently no events scheduled under the "${selectedCategory}" category.`
          }
          actionLabel="Reset Filters & Show All Events"
          onAction={handleResetFilters}
        />
      )}

      {/* 6. Event Details Modal Dialog */}
      <EventDetailsDialog
        isOpen={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onToggleRsvp={handleToggleRsvp}
      />
    </div>
  );
};
