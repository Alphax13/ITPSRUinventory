'use client';

import { useState, useEffect } from 'react';
import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface QuickStats {
  title: string;
  value: number;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
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
      subtitle: 'รายการในคลัง',
      icon: CubeIcon,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/dashboard/consumables',
    },
    {
      title: 'สต็อกต่ำ',
      value: data.lowStockConsumables,
      subtitle: 'ต้องเติมสต็อก',
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      link: '/dashboard/consumables',
    },
    {
      title: 'ครุภัณฑ์ทั้งหมด',
      value: data.totalAssets,
      subtitle: 'รายการทั้งหมด',
      icon: ComputerDesktopIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/dashboard/fixed-assets',
    },
    {
      title: 'ครุภัณฑ์ถูกยืม',
      value: data.borrowedAssets,
      subtitle: 'กำลังใช้งาน',
      icon: ArrowPathIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/dashboard/fixed-assets',
    },
    {
      title: 'ต้องซ่อม',
      value: data.assetsNeedRepair,
      subtitle: 'ครุภัณฑ์เสียหาย',
      icon: WrenchScrewdriverIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      link: '/dashboard/fixed-assets',
    },
    {
      title: 'คำขอรออนุมัติ',
      value: data.pendingRequests,
      subtitle: 'คำขอซื้อ',
      icon: ShoppingCartIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      link: '/dashboard/purchase-requests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5">
          <h1 className="text-xl font-bold text-slate-800">
            ยินดีต้อนรับ, {user?.name || 'ผู้ใช้'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'อาจารย์'}
            {user?.department ? ` · ${user.department}` : ''}
            {' · '}
            {new Date().toLocaleDateString('th-TH', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.link}>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{stat.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">การดำเนินการด่วน</h2>
          <div className="space-y-1">
            <Link href="/dashboard/transactions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-700 transition-colors group">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                <ArrowsRightLeftIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">เบิกวัสดุ</p>
                <p className="text-xs text-slate-400">เบิกวัสดุสิ้นเปลืองออกจากคลัง</p>
              </div>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/consumables" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 text-slate-600 transition-colors group">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                  <CubeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">จัดการวัสดุ</p>
                  <p className="text-xs text-slate-400">เพิ่ม/แก้ไขวัสดุสิ้นเปลือง</p>
                </div>
              </Link>
            )}

            <Link href="/dashboard/fixed-assets" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-slate-600 transition-colors group">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">ดูครุภัณฑ์</p>
                <p className="text-xs text-slate-400">ดู/ยืมครุภัณฑ์</p>
              </div>
            </Link>

            <Link href="/dashboard/purchase-requests" className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 text-slate-600 transition-colors group">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                <ShoppingCartIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">คำขอซื้อ</p>
                <p className="text-xs text-slate-400">สร้างคำขอซื้อใหม่</p>
              </div>
            </Link>

            <Link href="/dashboard/transactions/history" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors group">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                <ClockIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium">ประวัติ</p>
                <p className="text-xs text-slate-400">ดูประวัติการทำรายการ</p>
              </div>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/reports" className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-slate-600 transition-colors group">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                  <DocumentChartBarIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">รายงาน</p>
                  <p className="text-xs text-slate-400">สร้างรายงาน PDF/Excel</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">รายการล่าสุด</h2>
            <Link href="/dashboard/transactions/history" className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors">
              ดูทั้งหมด →
            </Link>
          </div>

          {data.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    transaction.type === 'OUT' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {transaction.type === 'OUT'
                      ? <ArrowUpTrayIcon className="h-5 w-5 text-red-600" />
                      : <ArrowDownTrayIcon className="h-5 w-5 text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {transaction.consumableMaterial.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {transaction.consumableMaterial.category} · {transaction.user.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      transaction.type === 'OUT' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {transaction.type === 'OUT' ? '−' : '+'}{transaction.quantity}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClockIcon className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">ยังไม่มีรายการทำรายการ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
