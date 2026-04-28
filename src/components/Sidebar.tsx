'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  HomeIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  TableCellsIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  BellIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  UsersIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: string[];
};

type NavCategory = {
  category: string;
  items: NavItem[];
};

const navigationCategories: NavCategory[] = [
  {
    category: 'หน้าหลัก',
    items: [
      { name: 'แดชบอร์ด', href: '/dashboard', icon: HomeIcon, roles: ['ADMIN', 'LECTURER'] },
    ],
  },
  {
    category: 'วัสดุสิ้นเปลือง',
    items: [
      { name: 'จัดการวัสดุ', href: '/dashboard/consumables', icon: CubeIcon, roles: ['ADMIN'] },
      { name: 'ดูวัสดุสิ้นเปลือง', href: '/dashboard/consumables', icon: EyeIcon, roles: ['LECTURER'] },
      { name: 'เบิก-จ่ายวัสดุ', href: '/dashboard/transactions', icon: ArrowsRightLeftIcon, roles: ['ADMIN', 'LECTURER'] },
      { name: 'ประวัติการเบิก', href: '/dashboard/transactions/history', icon: ClockIcon, roles: ['ADMIN', 'LECTURER'] },
      { name: 'จัดการประวัติ', href: '/dashboard/transactions/manage', icon: TableCellsIcon, roles: ['ADMIN'] },
    ],
  },
  {
    category: 'ครุภัณฑ์',
    items: [
      { name: 'จัดการครุภัณฑ์', href: '/dashboard/assets', icon: ComputerDesktopIcon, roles: ['ADMIN'] },
      { name: 'ดูครุภัณฑ์', href: '/dashboard/assets', icon: EyeIcon, roles: ['LECTURER'] },
      { name: 'ยืม-คืนครุภัณฑ์', href: '/dashboard/asset-borrows', icon: ArrowPathIcon, roles: ['ADMIN', 'LECTURER'] },
    ],
  },
  {
    category: 'คำขอและรายงาน',
    items: [
      { name: 'การแจ้งเตือน', href: '/dashboard/notifications', icon: BellIcon, roles: ['ADMIN', 'LECTURER'] },
      { name: 'คำขอซื้อ', href: '/dashboard/purchase-requests', icon: ShoppingCartIcon, roles: ['ADMIN', 'LECTURER'] },
      { name: 'รายงาน', href: '/dashboard/reports', icon: DocumentChartBarIcon, roles: ['ADMIN'] },
    ],
  },
  {
    category: 'จัดการระบบ',
    items: [
      { name: 'จัดการสมาชิก', href: '/dashboard/users', icon: UsersIcon, roles: ['ADMIN'] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const filteredNavigationCategories = navigationCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.roles.includes(user?.role || 'LECTURER')
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-xs tracking-tight">IT</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">ITPSRU Inventory</p>
            <p className="text-slate-400 text-xs leading-tight">ระบบจัดการวัสดุ</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800">
          <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</p>
            <p className="text-orange-400 text-xs leading-tight">
              {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'อาจารย์'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {filteredNavigationCategories.map((category) => (
          <div key={category.category} className="mb-5">
            <p className="px-3 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {category.category}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150
                      ${isActive
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 shrink-0">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span>{isLoading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
        </button>
      </div>
    </div>
  );
}
