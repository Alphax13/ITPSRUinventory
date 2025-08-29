'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('LECTURER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { register } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !name) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const success = await register(username, password, name, role);
      if (success) {
        setSuccess('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-blue-200">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">📝</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            สมัครสมาชิก
          </h1>
          <p className="text-blue-600 font-medium">ITPSRU Inventory System</p>
          <p className="text-gray-500 text-sm mt-2">สร้างบัญชีใหม่เพื่อใช้งานระบบ</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              👤 Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
              placeholder="กรอก username ที่ต้องการ"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              📛 ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
              placeholder="กรอกชื่อ-นามสกุลของคุณ"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              👥 ตำแหน่ง
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
            >
              <option value="LECTURER">👨‍🏫 อาจารย์</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              🔒 รหัสผ่าน
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              🔒 ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-3 px-4 rounded-xl">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm text-center py-3 px-4 rounded-xl">
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-400 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังสมัครสมาชิก...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>📝</span>
                สมัครสมาชิก
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-4">มีบัญชีอยู่แล้ว?</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center gap-2">
              <span>🔐</span>
              เข้าสู่ระบบ
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-gray-700 font-medium mb-2">📋 หมายเหตุ</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
              <p>• Username จะถูกแปลงเป็นตัวพิมพ์เล็กอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
