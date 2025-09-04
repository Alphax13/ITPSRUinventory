// src/stores/notificationStore.ts
import { create } from 'zustand';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'LOW_STOCK' | 'OVERDUE' | 'MAINTENANCE' | 'REQUEST';
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (userId: string, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'user'>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string, unreadOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        userId,
        ...(unreadOnly && { unreadOnly: 'true' }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      set({ 
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false 
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false 
      });
    }
  },

  markAsRead: async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // อัพเดต state ในหน่วยความจำ
      const currentNotifications = get().notifications;
      const updatedNotifications = currentNotifications.map(notification => 
        notificationIds.includes(notification.id) 
          ? { ...notification, isRead: true }
          : notification
      );

      const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;

      set({ 
        notifications: updatedNotifications,
        unreadCount: newUnreadCount 
      });

    } catch (error) {
      console.error('Error marking notifications as read:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark notifications as read' });
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // อัพเดต state ในหน่วยความจำ
      const currentNotifications = get().notifications;
      const updatedNotifications = currentNotifications.map(notification => 
        ({ ...notification, isRead: true })
      );

      set({ 
        notifications: updatedNotifications,
        unreadCount: 0 
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete notification');
      }

      // อัพเดต state ในหน่วยความจำ
      const currentNotifications = get().notifications;
      const deletedNotification = currentNotifications.find(n => n.id === notificationId);
      const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
      const newUnreadCount = deletedNotification && !deletedNotification.isRead 
        ? get().unreadCount - 1 
        : get().unreadCount;

      set({ 
        notifications: updatedNotifications,
        unreadCount: Math.max(0, newUnreadCount),
        error: null // เคลียร์ error เมื่อสำเร็จ
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      set({ error: errorMessage });
      throw error; // throw error เพื่อให้ component catch ได้
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'user'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const newNotification = await response.json();
      
      // อัพเดต state ในหน่วยความจำ
      const currentNotifications = get().notifications;
      set({ 
        notifications: [newNotification, ...currentNotifications],
        unreadCount: get().unreadCount + 1
      });

    } catch (error) {
      console.error('Error creating notification:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create notification' });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
