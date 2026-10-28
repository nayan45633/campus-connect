import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CampusNotice } from '@/types';
import { initialCampusNotices } from '@/data/mockData';

export const NOTICES_READ_STORAGE_KEY = 'campus_connect_read_notices';
const NOTICES_UPDATED_EVENT = 'campus_connect_notices_updated';

/**
 * Reads the set of read notice IDs from localStorage
 */
function getStoredReadNoticeIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set(initialCampusNotices.filter((n) => n.isRead).map((n) => n.id));
  }

  try {
    const raw = localStorage.getItem(NOTICES_READ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (error) {
    console.error('Failed to parse read notices from localStorage:', error);
  }

  // Default initial read notices from mock data (not_2, not_6)
  return new Set(initialCampusNotices.filter((n) => n.isRead).map((n) => n.id));
}

/**
 * Merges mock notice definitions with current read/unread status from localStorage
 */
function getHydratedNotices(): CampusNotice[] {
  const readIds = getStoredReadNoticeIds();

  return initialCampusNotices.map((notice) => ({
    ...notice,
    isRead: readIds.has(notice.id),
  }));
}

/**
 * Custom hook to manage Campus Notices, persistent read/unread status, and counts
 */
export function useCampusNotices() {
  const [notices, setNotices] = useState<CampusNotice[]>(getHydratedNotices);

  useEffect(() => {
    const handleNoticesUpdated = () => {
      setNotices(getHydratedNotices());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === NOTICES_READ_STORAGE_KEY) {
        setNotices(getHydratedNotices());
      }
    };

    window.addEventListener(NOTICES_UPDATED_EVENT, handleNoticesUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(NOTICES_UPDATED_EVENT, handleNoticesUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Save IDs set to localStorage and broadcast change
  const persistAndNotify = useCallback((readIds: Set<string>) => {
    try {
      localStorage.setItem(
        NOTICES_READ_STORAGE_KEY,
        JSON.stringify(Array.from(readIds))
      );
    } catch (error) {
      console.error('Failed to save read notices to localStorage:', error);
    }

    setNotices(getHydratedNotices());
    window.dispatchEvent(new CustomEvent(NOTICES_UPDATED_EVENT));
  }, []);

  // Toggle read status for a single notice
  const toggleReadStatus = useCallback(
    (noticeId: string): { isRead: boolean; noticeTitle: string } => {
      const readIds = getStoredReadNoticeIds();
      const isCurrentlyRead = readIds.has(noticeId);
      let nextIsRead = false;

      if (isCurrentlyRead) {
        readIds.delete(noticeId);
        nextIsRead = false;
      } else {
        readIds.add(noticeId);
        nextIsRead = true;
      }

      persistAndNotify(readIds);

      const target = initialCampusNotices.find((n) => n.id === noticeId);
      return {
        isRead: nextIsRead,
        noticeTitle: target?.title || 'Notice',
      };
    },
    [persistAndNotify]
  );

  // Mark a specific notice as read
  const markAsRead = useCallback(
    (noticeId: string) => {
      const readIds = getStoredReadNoticeIds();
      if (!readIds.has(noticeId)) {
        readIds.add(noticeId);
        persistAndNotify(readIds);
      }
    },
    [persistAndNotify]
  );

  // Mark a specific notice as unread
  const markAsUnread = useCallback(
    (noticeId: string) => {
      const readIds = getStoredReadNoticeIds();
      if (readIds.has(noticeId)) {
        readIds.delete(noticeId);
        persistAndNotify(readIds);
      }
    },
    [persistAndNotify]
  );

  // Mark all notices as read
  const markAllAsRead = useCallback(() => {
    const allIds = new Set(initialCampusNotices.map((n) => n.id));
    persistAndNotify(allIds);
  }, [persistAndNotify]);

  // Mark all notices as unread
  const markAllAsUnread = useCallback(() => {
    persistAndNotify(new Set<string>());
  }, [persistAndNotify]);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notices.filter((n) => !n.isRead).length;
  }, [notices]);

  return {
    notices,
    unreadCount,
    toggleReadStatus,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    markAllAsUnread,
  };
}
