// src/app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AuthWrapper from '@/components/AuthWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthWrapper>
      <div className="h-screen bg-orange-50 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/80 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="lg:pl-72 h-screen flex flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-8 bg-orange-50 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}