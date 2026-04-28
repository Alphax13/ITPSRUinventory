'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  UsersIcon,
  PlusIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: 'ADMIN' | 'LECTURER';
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'LECTURER',
    email: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(`${editingUser ? 'อัพเดต' : 'สร้าง'}ผู้ใช้สำเร็จ!`);
        setShowModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      email: user.email || '',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่ต้องการลบผู้ใช้นี้?')) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('ลบผู้ใช้สำเร็จ!');
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'LECTURER',
      email: '',
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-16">
        <ShieldCheckIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <h2 className="text-base font-semibold text-slate-700 mb-1">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-slate-500">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">จัดการสมาชิก</h1>
            <p className="text-sm text-slate-500 mt-0.5">จัดการบัญชีผู้ใช้ในระบบ</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            เพิ่มผู้ใช้ใหม่
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-slate-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-800">{users.length}</div>
            <div className="text-xs text-slate-500">ผู้ใช้ทั้งหมด</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <ShieldCheckIcon className="h-8 w-8 text-orange-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-orange-600">{users.filter(u => u.role === 'ADMIN').length}</div>
            <div className="text-xs text-slate-500">Admin</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 text-blue-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'LECTURER').length}</div>
            <div className="text-xs text-slate-500">อาจารย์</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <CheckCircleIcon className="h-8 w-8 text-green-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
            <div className="text-xs text-slate-500">ใช้งานอยู่</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-5 py-3 border-b border-slate-200">ผู้ใช้</th>
                <th className="px-5 py-3 border-b border-slate-200">ตำแหน่ง</th>
                <th className="px-5 py-3 border-b border-slate-200">สาขา</th>
                <th className="px-5 py-3 border-b border-slate-200">สถานะ</th>
                <th className="px-5 py-3 border-b border-slate-200">วันที่สร้าง</th>
                <th className="px-5 py-3 border-b border-slate-200">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-500">@{u.username}</div>
                    {u.email && <div className="text-xs text-slate-400">{u.email}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'ADMIN'
                        ? <><ShieldCheckIcon className="h-3 w-3" />Admin</>
                        : <><AcademicCapIcon className="h-3 w-3" />อาจารย์</>
                      }
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{u.department}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.isActive ? <><CheckCircleIcon className="h-3 w-3" />ใช้งาน</> : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: th })}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                        disabled={u.role === 'ADMIN' && users.filter(x => x.role === 'ADMIN' && x.isActive).length <= 1}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-16">
            <UsersIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">ยังไม่มีผู้ใช้ในระบบ</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-800">
                {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required={!editingUser}
                  placeholder={editingUser ? 'เว้นไว้หากไม่ต้องการเปลี่ยน' : 'กรอก username'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ตำแหน่ง</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="LECTURER">อาจารย์</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (ไม่จำเป็น)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  รหัสผ่าน {editingUser && '(เว้นไว้หากไม่ต้องการเปลี่ยน)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required={!editingUser}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </div>

              {editingUser && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    เปิดใช้งานบัญชี
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? 'กำลังบันทึก...' : (editingUser ? 'อัพเดต' : 'สร้าง')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
