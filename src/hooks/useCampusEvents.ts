import { useState, useEffect, useCallback } from 'react';
import type { CampusEvent } from '@/types';
import { upcomingEvents } from '@/data/mockData';

export const EVENTS_RSVP_STORAGE_KEY = 'campus_connect_rsvpd_events';
const EVENTS_UPDATED_EVENT = 'campus_connect_events_updated';

/**
 * Reads stored RSVP ID set from localStorage
 */
function getStoredRsvpIds(): Set<string> {
  if (typeof window === 'undefined') return new Set(['ev_2']); // ev_2 is default RSVP'd in mock data

  try {
    const raw = localStorage.getItem(EVENTS_RSVP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (error) {
    console.error('Failed to parse RSVP events from localStorage:', error);
  }

  // Default initial RSVP from mock data (ev_2)
  const defaultRsvps = upcomingEvents.filter((e) => e.isRsvpd).map((e) => e.id);
  return new Set(defaultRsvps);
}

/**
 * Builds merged events list with current RSVP statuses from localStorage
 */
function getHydratedEvents(): CampusEvent[] {
  const rsvpIds = getStoredRsvpIds();

  return upcomingEvents.map((event) => {
    const isRsvpd = rsvpIds.has(event.id);
    // If it was not originally RSVP'd in mock data but is in localStorage, increment count by 1
    // If it was originally RSVP'd but removed from localStorage, decrement by 1
    const baseCount = event.attendeesCount;
    let attendeesCount = baseCount;

    if (isRsvpd && !event.isRsvpd) {
      attendeesCount = baseCount + 1;
    } else if (!isRsvpd && event.isRsvpd) {
      attendeesCount = Math.max(0, baseCount - 1);
    }

    return {
      ...event,
      isRsvpd,
      attendeesCount,
    };
  });
}

/**
 * Custom hook for campus events management with persistent RSVP synchronization
 */
export function useCampusEvents() {
  const [events, setEvents] = useState<CampusEvent[]>(getHydratedEvents);

  useEffect(() => {
    const handleEventsUpdated = () => {
      setEvents(getHydratedEvents());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === EVENTS_RSVP_STORAGE_KEY) {
        setEvents(getHydratedEvents());
      }
    };

    window.addEventListener(EVENTS_UPDATED_EVENT, handleEventsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENTS_UPDATED_EVENT, handleEventsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleRsvp = useCallback((eventId: string): { isRsvpd: boolean; eventTitle: string } => {
    const rsvpIds = getStoredRsvpIds();
    const currentlyRsvpd = rsvpIds.has(eventId);
    let nextRsvpd = false;

    if (currentlyRsvpd) {
      rsvpIds.delete(eventId);
      nextRsvpd = false;
    } else {
      rsvpIds.add(eventId);
      nextRsvpd = true;
    }

    // Save to localStorage
    try {
      localStorage.setItem(
        EVENTS_RSVP_STORAGE_KEY,
        JSON.stringify(Array.from(rsvpIds))
      );
    } catch (error) {
      console.error('Failed to save RSVP to localStorage:', error);
    }

    // Update state & notify listeners
    const updated = getHydratedEvents();
    setEvents(updated);
    window.dispatchEvent(new CustomEvent(EVENTS_UPDATED_EVENT));

    const targetEvent = updated.find((e) => e.id === eventId);
    return {
      isRsvpd: nextRsvpd,
      eventTitle: targetEvent?.title || 'Campus Event',
    };
  }, []);

  return {
    events,
    toggleRsvp,
  };
}
