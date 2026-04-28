// src/app/login/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  // ดึง redirect URL จาก query parameter
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        // ใช้ window.location.href เพื่อทำ full page reload
        // เพื่อให้ middleware ตรวจสอบ cookie ใหม่
        window.location.href = redirectUrl;
      } else {
        setError('Username หรือ Password ไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-white font-extrabold text-lg tracking-tight">IT</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              ระบบจัดการวัสดุและครุภัณฑ์
            </h1>
            <p className="text-sm text-slate-500 mt-1">ITPSRU Inventory System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อผู้ใช้ (Username)
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="กรอก username ของคุณ"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="กรอกรหัสผ่านของคุณ"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center py-3 px-4 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-500 text-sm mb-3">ยังไม่มีบัญชี?</p>
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              สมัครสมาชิก
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏศรีนครินทรวิโรฒ
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
