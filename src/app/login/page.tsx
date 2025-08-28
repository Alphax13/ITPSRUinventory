// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('กรุณากรอก email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-orange-200">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">📚</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ระบบจัดการวัสดุและครุภัณฑ์
          </h1>
          <p className="text-orange-600 font-medium">EduInventory System</p>
          <p className="text-gray-500 text-sm mt-2">เข้าสู่ระบบเพื่อจัดการวัสดุของคุณ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
              placeholder="กรอก email ของคุณ"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-3 px-4 rounded-xl">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-orange-300 disabled:to-orange-400 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังเข้าสู่ระบบ...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🔐</span>
                เข้าสู่ระบบ
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <p className="text-sm text-gray-700 font-medium mb-2">🔰 Demo Accounts</p>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-semibold text-orange-600">staff@school.edu</span>
                <span className="text-gray-500"> (เจ้าหน้าที่ - สิทธิ์เต็ม)</span>
              </p>
              <p>
                <span className="font-semibold text-blue-600">teacher@school.edu</span>
                <span className="text-gray-500"> (อาจารย์ - ดูและเบิกเท่านั้น)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
