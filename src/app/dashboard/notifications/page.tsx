// src/app/dashboard/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  BellIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const NOTIFICATION_TYPES = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'INFO', label: 'ข้อมูลทั่วไป' },
  { value: 'SUCCESS', label: 'สำเร็จ' },
  { value: 'WARNING', label: 'คำเตือน' },
  { value: 'ERROR', label: 'ข้อผิดพลาด' },
  { value: 'LOW_STOCK', label: 'สต็อกต่ำ' },
  { value: 'OVERDUE', label: 'เกินกำหนด' },
  { value: 'MAINTENANCE', label: 'บำรุงรักษา' },
  { value: 'REQUEST', label: 'คำขอ' },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | Notification['type']>('ALL');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id, fetchNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !notification.isRead;
    return notification.type === filter;
  });

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length > 0) {
      await markAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length > 0 && confirm('คุณต้องการลบการแจ้งเตือนที่เลือกหรือไม่?')) {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications([]);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const className = "h-6 w-6";
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
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="mt-1 text-sm text-gray-600">
            จัดการการแจ้งเตือนของคุณ {unreadCount > 0 && `(${unreadCount} ยังไม่อ่าน)`}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={() => user?.id && markAllAsRead(user.id)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow border border-orange-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filter */}
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">ทั้งหมด ({notifications.length})</option>
              <option value="UNREAD">ยังไม่อ่าน ({unreadCount})</option>
              {NOTIFICATION_TYPES.slice(1).map(type => {
                const count = notifications.filter(n => n.type === type.value).length;
                return (
                  <option key={type.value} value={type.value}>
                    {type.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                เลือก {selectedNotifications.length} รายการ
              </span>
              <button
                onClick={handleMarkSelectedAsRead}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                อ่านแล้ว
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                ลบ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow border border-orange-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-red-600 mt-2">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">
              {filter === 'ALL' ? 'ไม่มีการแจ้งเตือน' : `ไม่มีการแจ้งเตือน${NOTIFICATION_TYPES.find(t => t.value === filter)?.label || ''}`}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-6 py-3 border-b border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">เลือกทั้งหมด</span>
              </label>
            </div>

            {/* Notifications */}
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 ${getTypeColor(notification.type)} ${
                    !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-30'
                  }`}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className={`text-sm font-medium text-gray-900 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="ml-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                          >
                            ดูรายละเอียด
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="ลบการแจ้งเตือน"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
