'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const navigation = [
  { 
    name: 'แดชบอร์ด', 
    href: '/dashboard', 
    icon: '🏠', 
    roles: ['ADMIN', 'LECTURER'] 
  },
  { 
    name: 'จัดการวัสดุสิ้นเปลือง', 
    href: '/dashboard/consumables', 
    icon: '📦', 
    roles: ['ADMIN'] 
  },
  { 
    name: 'ดูวัสดุสิ้นเปลือง', 
    href: '/dashboard/consumables', 
    icon: '👁️', 
    roles: ['LECTURER'] 
  },
  { 
    name: 'จัดการครุภัณฑ์', 
    href: '/dashboard/fixed-assets', 
    icon: '🏷️', 
    roles: ['ADMIN'] 
  },
  { 
    name: 'ดูครุภัณฑ์', 
    href: '/dashboard/fixed-assets', 
    icon: '👀', 
    roles: ['LECTURER'] 
  },
  { 
    name: 'เบิก-จ่ายวัสดุ', 
    href: '/dashboard/transactions', 
    icon: '📋', 
    roles: ['ADMIN', 'LECTURER'] 
  },
  { 
    name: 'ประวัติการเบิก', 
    href: '/dashboard/transactions/history', 
    icon: '📊', 
    roles: ['ADMIN', 'LECTURER'] 
  },
  { 
    name: 'จัดการประวัติ', 
    href: '/dashboard/transactions/manage', 
    icon: '🗂️', 
    roles: ['ADMIN'] 
  },
  { 
    name: 'คำขอซื้อ', 
    href: '/dashboard/purchase-requests', 
    icon: '🛒', 
    roles: ['ADMIN', 'LECTURER'] 
  },
  { 
    name: 'รายงาน', 
    href: '/dashboard/reports', 
    icon: '📄', 
    roles: ['ADMIN'] 
  },
  { 
    name: 'จัดการสมาชิก', 
    href: '/dashboard/users', 
    icon: '👥', 
    roles: ['ADMIN'] 
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'LECTURER')
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 h-screen bg-gradient-to-b from-orange-50 to-white border-r border-orange-200">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="flex h-20 items-center justify-center border-b border-orange-200 bg-gradient-to-r from-orange-100 to-orange-200">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">ITPSRU Inventory</h1>
              <p className="text-sm text-orange-600 font-medium">ระบบจัดการวัสดุ</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 bg-white border-b border-orange-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate text-lg">{user?.name}</p>
              <p className="text-sm font-semibold text-orange-600">
                {user?.role === 'ADMIN' ? '👑 ผู้ดูแลระบบ' : '👨‍🏫 อาจารย์'}
              </p>
              <p className="text-xs text-gray-500">@{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-4 rounded-xl font-semibold transition-all duration-300 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-white hover:text-orange-600 hover:shadow-md hover:transform hover:scale-102'
                  }
                `}
              >
                <span className={`text-xl ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                  {item.icon}
                </span>
                <span className="text-base">{item.name}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-orange-600 rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:transform hover:scale-105"
          >
            <span className="text-lg">🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
