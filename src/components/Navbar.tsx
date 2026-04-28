// src/components/Navbar.tsx
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Bars3Icon, ChevronDownIcon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'แดชบอร์ด',
  consumables: 'วัสดุสิ้นเปลือง',
  transactions: 'เบิก-จ่ายวัสดุ',
  history: 'ประวัติการเบิก',
  manage: 'จัดการประวัติ',
  assets: 'ครุภัณฑ์',
  'asset-borrows': 'ยืม-คืนครุภัณฑ์',
  'fixed-assets': 'ครุภัณฑ์',
  notifications: 'การแจ้งเตือน',
  'purchase-requests': 'คำขอซื้อ',
  reports: 'รายงาน',
  users: 'จัดการสมาชิก',
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const segments = pathname.split('/').filter(Boolean);
  const currentPage = PAGE_TITLES[segments[segments.length - 1]] ?? 'ระบบจัดการวัสดุและครุภัณฑ์';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors mr-3"
        aria-label="เปิดเมนู"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Mobile brand */}
      <div className="lg:hidden flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 bg-orange-600 rounded-md flex items-center justify-center">
          <span className="text-white font-extrabold text-xs">IT</span>
        </div>
        <span className="text-sm font-bold text-slate-800">ITPSRU</span>
      </div>

      {/* Desktop: page title */}
      <div className="hidden lg:flex items-center gap-3 mr-auto">
        <h1 className="text-base font-semibold text-slate-800">{currentPage}</h1>
        <span className="text-slate-300 text-sm">|</span>
        <span className="text-sm text-slate-400">ระบบจัดการวัสดุและครุภัณฑ์</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <NotificationDropdown />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 leading-tight">
                {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'อาจารย์'}
              </p>
            </div>
            <ChevronDownIcon className="hidden sm:block h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

