// src/components/AuthWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // หน้าที่ไม่ต้องล็อกอิน
    const publicPaths = ['/', '/login'];
    const isPublicPath = publicPaths.includes(pathname);
    const hasUser = !!user;

    // Redirect logic - ใช้ immediate redirect แทน timeout
    if (!hasUser && !isPublicPath) {
      router.replace('/login');
    } else if (hasUser && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, pathname, router, isClient]);

  // รอให้ client-side rendering เสร็จก่อน
  if (!isClient) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // หากอยู่ในหน้าที่ต้องการ auth แต่ยังไม่ได้ login
  if (!user && !['/login', '/'].includes(pathname)) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
