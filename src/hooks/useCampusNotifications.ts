import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CampusNotification, NotificationTimeframe } from '@/types';
import { initialCampusNotifications } from '@/data/mockData';

export const NOTIFICATIONS_READ_STORAGE_KEY = 'campus_connect_notifications_read';
const NOTIFICATIONS_UPDATED_EVENT = 'campus_connect_notifications_updated';

/**
 * Reads stored read notification IDs from localStorage
 */
function getStoredReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set(initialCampusNotifications.filter((n) => n.isRead).map((n) => n.id));
  }

  try {
    const raw = localStorage.getItem(NOTIFICATIONS_READ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (error) {
    console.error('Failed to parse read notifications from localStorage:', error);
  }

  // Default initial read items from mock data (notif_4, notif_6, notif_7, notif_8)
  return new Set(initialCampusNotifications.filter((n) => n.isRead).map((n) => n.id));
}

/**
 * Merges mock notification definitions with current read/unread status from localStorage
 */
function getHydratedNotifications(): CampusNotification[] {
  const readIds = getStoredReadNotificationIds();

  return initialCampusNotifications.map((notif) => ({
    ...notif,
    isRead: readIds.has(notif.id),
  }));
}

/**
 * Custom hook to manage Campus Notifications, read/unread states, and counts
 */
export function useCampusNotifications() {
  const [notifications, setNotifications] = useState<CampusNotification[]>(getHydratedNotifications);

  // Sync state with storage and window updates
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      setNotifications(getHydratedNotifications());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === NOTIFICATIONS_READ_STORAGE_KEY) {
        setNotifications(getHydratedNotifications());
      }
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  /**
   * Mark a specific notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    try {
      const readIds = getStoredReadNotificationIds();
      if (!readIds.has(notificationId)) {
        readIds.add(notificationId);
        localStorage.setItem(NOTIFICATIONS_READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
        setNotifications(getHydratedNotifications());
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /**
   * Toggle between read and unread status for a notification
   */
  const toggleReadStatus = useCallback((notificationId: string) => {
    try {
      const readIds = getStoredReadNotificationIds();
      if (readIds.has(notificationId)) {
        readIds.delete(notificationId);
      } else {
        readIds.add(notificationId);
      }
      localStorage.setItem(NOTIFICATIONS_READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
      setNotifications(getHydratedNotifications());
    } catch (error) {
      console.error('Failed to toggle notification read status:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    try {
      const allIds = initialCampusNotifications.map((n) => n.id);
      localStorage.setItem(NOTIFICATIONS_READ_STORAGE_KEY, JSON.stringify(allIds));
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
      setNotifications(getHydratedNotifications());
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  /**
   * Reset all notifications back to initial default read/unread state
   */
  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(NOTIFICATIONS_READ_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
      setNotifications(getHydratedNotifications());
    } catch (error) {
      console.error('Failed to reset notifications:', error);
    }
  }, []);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Derived unread notifications
  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.isRead);
  }, [notifications]);

  // Group notifications by timeframe
  const groupedNotifications = useMemo(() => {
    const groups: Record<NotificationTimeframe, CampusNotification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifications.forEach((item) => {
      if (groups[item.timeframe]) {
        groups[item.timeframe].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return groups;
  }, [notifications]);

  return {
    notifications,
    unreadNotifications,
    groupedNotifications,
    unreadCount,
    markAsRead,
    toggleReadStatus,
    markAllAsRead,
    resetToDefault,
  };
}
