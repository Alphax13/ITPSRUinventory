// src/components/NotificationDropdown.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setError
  } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
      
      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications(user.id);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // เคลียร์ error ก่อนหน้านี้และเซ็ต loading state
    setError(null);
    setDeletingId(notificationId);
    
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      // Error จะถูก handle ใน store และแสดงใน UI แล้ว
      console.error('Failed to delete notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const className = "h-5 w-5";
    switch (type) {
      case 'SUCCESS':
        return <CheckCircleIcon className={`${className} text-green-500`} />;
      case 'WARNING':
      case 'LOW_STOCK':
      case 'OVERDUE':
        return <ExclamationTriangleIcon className={`${className} text-yellow-500`} />;
      case 'ERROR':
        return <XCircleIcon className={`${className} text-red-500`} />;
      case 'MAINTENANCE':
        return <ExclamationTriangleIcon className={`${className} text-blue-500`} />;
      case 'REQUEST':
        return <InformationCircleIcon className={`${className} text-purple-500`} />;
      case 'INFO':
        return <InformationCircleIcon className={`${className} text-blue-500`} />;
      default:
        return <InformationCircleIcon className={`${className} text-gray-500`} />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'SUCCESS': return 'border-l-green-400 bg-green-50';
      case 'WARNING':
      case 'LOW_STOCK':
      case 'OVERDUE': return 'border-l-yellow-400 bg-yellow-50';
      case 'ERROR': return 'border-l-red-400 bg-red-50';
      case 'MAINTENANCE': return 'border-l-blue-400 bg-blue-50';
      case 'REQUEST': return 'border-l-purple-400 bg-purple-50';
      case 'INFO': return 'border-l-blue-400 bg-blue-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors duration-200"
        aria-label="การแจ้งเตือน"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
            <span className="text-white text-[10px] font-medium min-w-[12px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-orange-200 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-orange-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 mb-2 mx-2 rounded">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        if (user?.id) fetchNotifications(user.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      ลองใหม่
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <XCircleIcon className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-sm text-red-600 mt-2">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                      getTypeColor(notification.type)
                    } ${!notification.isRead ? 'bg-opacity-100' : 'bg-opacity-30'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium text-gray-900 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                disabled={deletingId === notification.id}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title="ลบการแจ้งเตือน"
                              >
                                {deletingId === notification.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  <XMarkIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-orange-100">
              <button 
                onClick={() => {
                  window.location.href = '/dashboard/notifications';
                  setIsOpen(false);
                }}
                className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium text-center"
              >
                ดูการแจ้งเตือนทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
