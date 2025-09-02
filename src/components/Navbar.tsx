// src/components/Navbar.tsx
'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <nav className="bg-white border-b border-orange-200 shadow-sm lg:sticky lg:top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button - ปุ่มเมนูบนมือถือ */}
          <button
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200"
            aria-label="เปิดเมนู"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo and title for mobile */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📚</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">ITPSRU Inventory</h1>
          </div>

          {/* Desktop title and breadcrumb */}
          <div className="hidden lg:flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              ระบบจัดการวัสดุและครุภัณฑ์
            </h1>
          </div>

          {/* Right side - notifications and user menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 transition-colors duration-200">
                <UserCircleIcon className="h-8 w-8 text-orange-600" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'ผู้ใช้'}</p>
                  <p className="text-xs text-orange-600 capitalize">
                    {user?.role === 'ADMIN' ? 'เจ้าหน้าที่' : 'อาจารย์'}
                  </p>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-orange-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-orange-100">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-orange-600">
                      {user?.role === 'ADMIN' ? '🔧 เจ้าหน้าที่' : '👨‍🏫 อาจารย์'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '🔄 กำลังออกจากระบบ...' : '🚪 ออกจากระบบ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
