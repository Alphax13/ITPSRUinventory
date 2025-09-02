// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const notificationStore = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      // Initial fetch
      notificationStore.fetchNotifications(user.id);
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        notificationStore.fetchNotifications(user.id);
      }, 30000);

      return () => clearInterval(interval);
    }
    // When user logs out, intervals will be cleared automatically by the cleanup function above
  }, [user?.id, notificationStore]);

  return notificationStore;
}

// Helper hook for unread count only (for navbar badge)
export function useUnreadNotificationCount() {
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      // Fetch only unread notifications for performance
      fetchNotifications(user.id, true);
      
      // Refresh unread count every minute
      const interval = setInterval(() => {
        fetchNotifications(user.id, true);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user?.id, fetchNotifications]);

  return unreadCount;
}
