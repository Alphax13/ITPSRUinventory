'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

interface QuickStats {
  title: string;
  value: number;
  subtitle: string;
  color: string;
  link: string;
}

interface DashboardData {
  totalConsumables: number;
  lowStockConsumables: number;
  totalAssets: number;
  borrowedAssets: number;
  assetsNeedRepair: number;
  totalConsumableTransactions: number;
  pendingRequests: number;
  recentTransactions: Array<{
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    note?: string;
    createdAt: string;
    consumableMaterial: {
      name: string;
      category: string;
    };
    user: {
      name: string;
    };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const quickStats: QuickStats[] = [
    {
      title: 'วัสดุสิ้นเปลือง',
      value: data.totalConsumables,
      subtitle: 'รายการทั้งหมด',
      color: 'bg-gradient-to-r from-orange-400 to-orange-500',
      link: '/dashboard/consumables'
    },
    {
      title: 'สต็อกต่ำ',
      value: data.lowStockConsumables,
      subtitle: 'ต้องเติมสต็อก',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      link: '/dashboard/consumables'
    },
    {
      title: 'ครุภัณฑ์ทั้งหมด',
      value: data.totalAssets,
      subtitle: 'รายการทั้งหมด',
      color: 'bg-gradient-to-r from-blue-400 to-blue-500',
      link: '/dashboard/fixed-assets'
    },
    {
      title: 'ครุภัณฑ์ถูกยืม',
      value: data.borrowedAssets,
      subtitle: 'กำลังใช้งาน',
      color: 'bg-gradient-to-r from-green-400 to-green-500',
      link: '/dashboard/fixed-assets'
    },
    {
      title: 'ต้องซ่อม',
      value: data.assetsNeedRepair,
      subtitle: 'ครุภัณฑ์เสียหาย',
      color: 'bg-gradient-to-r from-red-400 to-red-500',
      link: '/dashboard/fixed-assets'
    },
    {
      title: 'คำขอรอพิจารณา',
      value: data.pendingRequests,
      subtitle: 'คำขอซื้อใหม่',
      color: 'bg-gradient-to-r from-purple-400 to-purple-500',
      link: '/dashboard/purchase-requests'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ยินดีต้อนรับ, {user?.name || 'ผู้ใช้'} 👋
            </h1>
            <p className="text-orange-100 text-lg">
              {user?.role === 'ADMIN' ? '👑 ผู้ดูแลระบบ' : '👨‍🏫 อาจารย์'} • {user?.department || 'ทั่วไป'}
            </p>
            <p className="text-orange-100 mt-2">
              {new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long' 
              })}
            </p>
          </div>
          <div className="hidden md:block text-6xl opacity-20">
            📚
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Link key={stat.title} href={stat.link}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                  {stat.value}
                </div>
                <div className="text-2xl opacity-30">
                  {index === 0 ? '📦' : index === 1 ? '⚠️' : index === 2 ? '🔄' : '🛒'}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{stat.title}</h3>
              <p className="text-gray-600 text-sm">{stat.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">⚡</span>
          การดำเนินการด่วน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/transactions" className="group">
            <div className="border-2 border-dashed border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</div>
              <h3 className="font-bold text-gray-900 mb-2">เบิกวัสดุ</h3>
              <p className="text-sm text-gray-600">เบิกวัสดุสิ้นเปลืองออกจากคลัง</p>
            </div>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/dashboard/consumables" className="group">
              <div className="border-2 border-dashed border-green-200 hover:border-green-400 hover:bg-green-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</div>
                <h3 className="font-bold text-gray-900 mb-2">จัดการวัสดุสิ้นเปลือง</h3>
                <p className="text-sm text-gray-600">เพิ่ม/แก้ไขวัสดุสิ้นเปลือง</p>
              </div>
            </Link>
          )}

          <Link href="/dashboard/fixed-assets" className="group">
            <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏷️</div>
              <h3 className="font-bold text-gray-900 mb-2">ดูครุภัณฑ์</h3>
              <p className="text-sm text-gray-600">ดู/ยืมครุภัณฑ์</p>
            </div>
          </Link>

          <Link href="/dashboard/purchase-requests" className="group">
            <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
              <h3 className="font-bold text-gray-900 mb-2">คำขอซื้อ</h3>
              <p className="text-sm text-gray-600">สร้างคำขอซื้อใหม่</p>
            </div>
          </Link>

          <Link href="/dashboard/transactions/history" className="group">
            <div className="border-2 border-dashed border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">ประวัติ</h3>
              <p className="text-sm text-gray-600">ดูประวัติการทำรายการ</p>
            </div>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/dashboard/reports" className="group">
              <div className="border-2 border-dashed border-red-200 hover:border-red-400 hover:bg-red-50 rounded-2xl p-6 text-center transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                <h3 className="font-bold text-gray-900 mb-2">รายงาน</h3>
                <p className="text-sm text-gray-600">สร้างรายงาน PDF</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100">
        <div className="px-8 py-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">📋</span>
            รายการล่าสุด
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentTransactions && data.recentTransactions.length > 0 ? (
            data.recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="px-8 py-6 hover:bg-orange-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-sm ${
                      transaction.type === 'OUT' 
                        ? 'bg-gradient-to-r from-red-400 to-red-500' 
                        : 'bg-gradient-to-r from-green-400 to-green-500'
                    }`}>
                      {transaction.type === 'OUT' ? '📤' : '📥'}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {transaction.consumableMaterial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        หมวด: {transaction.consumableMaterial.category}
                      </p>
                      <p className="text-sm font-medium text-orange-600">
                        {transaction.type === 'OUT' ? 'เบิกออก' : 'เพิ่มเข้า'} {transaction.quantity} หน่วย
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{transaction.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                {transaction.note && (
                  <div className="mt-3 ml-16">
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                      💭 {transaction.note}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-8 py-16 text-center text-gray-500">
              <div className="text-6xl mb-4 opacity-30">📋</div>
              <p className="text-lg">ยังไม่มีรายการทำรายการ</p>
              <p className="text-sm mt-2">เริ่มต้นโดยการเบิกวัสดุหรือเพิ่มวัสดุใหม่</p>
            </div>
          )}
        </div>
        {data.recentTransactions && data.recentTransactions.length > 5 && (
          <div className="px-8 py-4 bg-orange-50 border-t border-orange-100 text-center">
            <Link href="/dashboard/transactions/history" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold text-sm transition-colors">
              <span>ดูประวัติทั้งหมด</span>
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
