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
    const cls = 'h-5 w-5';
    switch (type) {
      case 'SUCCESS':
        return <CheckCircleIcon className={`${cls} text-emerald-500`} />;
      case 'WARNING':
      case 'LOW_STOCK':
      case 'OVERDUE':
        return <ExclamationTriangleIcon className={`${cls} text-amber-500`} />;
      case 'ERROR':
        return <XCircleIcon className={`${cls} text-red-500`} />;
      case 'MAINTENANCE':
        return <ExclamationTriangleIcon className={`${cls} text-blue-500`} />;
      case 'REQUEST':
        return <InformationCircleIcon className={`${cls} text-violet-500`} />;
      default:
        return <InformationCircleIcon className={`${cls} text-slate-400`} />;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'SUCCESS': return 'border-l-emerald-400';
      case 'WARNING':
      case 'LOW_STOCK':
      case 'OVERDUE': return 'border-l-amber-400';
      case 'ERROR': return 'border-l-red-400';
      case 'MAINTENANCE': return 'border-l-blue-400';
      case 'REQUEST': return 'border-l-violet-400';
      default: return 'border-l-slate-300';
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                  {unreadCount} ยังไม่อ่าน
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">จัดการการแจ้งเตือนของคุณ</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => user?.id && markAllAsRead(user.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | 'UNREAD' | Notification['type'])}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                เลือก {selectedNotifications.length} รายการ
              </span>
              <button
                onClick={handleMarkSelectedAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                อ่านแล้ว
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                ลบ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircleIcon className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BellIcon className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {filter === 'ALL'
                ? 'ไม่มีการแจ้งเตือน'
                : `ไม่มีการแจ้งเตือน${NOTIFICATION_TYPES.find(t => t.value === filter)?.label || ''}`}
            </p>
          </div>
        ) : (
          <>
            {/* Select All row */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-600">เลือกทั้งหมด ({filteredNotifications.length} รายการ)</span>
              </label>
            </div>

            {/* Notification items */}
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 ${getBorderColor(notification.type)} ${
                    !notification.isRead ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 shrink-0"
                        />
                        <div className="mt-0.5 shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm text-slate-800 truncate ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="shrink-0 w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1.5 text-xs text-slate-400">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap"
                          >
                            ดูรายละเอียด
                          </button>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead([notification.id])}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 flex items-center justify-center transition-colors"
                            title="ทำเครื่องหมายว่าอ่านแล้ว"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors"
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