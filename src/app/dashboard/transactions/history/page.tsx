// src/app/dashboard/transactions/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';

interface Transaction {
  id: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'TRANSFER';
  reason: string | null;
  createdAt: string;
  user: {
    name: string;
    department: string | null;
  };
  material: {
    name: string;
    code: string;
    unit: string;
  };
  source?: 'consumable' | 'legacy';
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'material'>('date');
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transaction history...');
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        console.log('Transaction history received:', data);
        console.log('Number of transactions:', data.length);
        setTransactions(data);
      } else {
        console.error('Failed to fetch transaction history, status:', res.status);
        const errorData = await res.json();
        console.error('Error data:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions
    .filter(tx => filter === 'ALL' || tx.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'user':
          return a.user.name.localeCompare(b.user.name);
        case 'material':
          return a.material.name.localeCompare(b.material.name);
        default:
          return 0;
      }
    });

  const getTransactionStats = () => {
    const totalTransactions = transactions.length;
    const inTransactions = transactions.filter(tx => tx.type === 'IN').length;
    const outTransactions = transactions.filter(tx => tx.type === 'OUT').length;
    const consumableTransactions = transactions.filter(tx => tx.source === 'consumable').length;
    const legacyTransactions = transactions.filter(tx => tx.source === 'legacy').length;
    
    return { 
      totalTransactions, 
      inTransactions, 
      outTransactions,
      consumableTransactions,
      legacyTransactions 
    };
  };

  const stats = getTransactionStats();

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
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">📊 ประวัติการทำรายการ</h1>
          {isAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ผู้ดูแลระบบ - เห็นทั้งหมด
            </span>
          )}
        </div>
        <p className="text-gray-600">
          {isAdmin 
            ? 'ดูประวัติการเบิก-จ่ายวัสดุทั้งหมดในระบบ' 
            : 'ดูประวัติการเบิก-จ่ายวัสดุของคุณ'
          }
        </p>
        {transactions.length > 0 && (
          <p className="text-sm text-green-600 mt-1">
            ✅ โหลดประวัติรายการแล้ว {transactions.length} รายการ
            {!isAdmin && ' (เฉพาะรายการของคุณ)'}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
          <div className="text-gray-600">
            {isAdmin ? 'รายการทั้งหมด' : 'รายการของคุณ'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.inTransactions}</div>
          <div className="text-gray-600">📥 เพิ่มเข้า</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.outTransactions}</div>
          <div className="text-gray-600">📤 เบิกออก</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.consumableTransactions}</div>
          <div className="text-gray-600">🧴 วัสดุสิ้นเปลือง</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.legacyTransactions}</div>
          <div className="text-gray-600">📦 วัสดุทั่วไป</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">กรองตาม:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | 'IN' | 'OUT')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="IN">📥 เพิ่มเข้า</option>
              <option value="OUT">📤 เบิกออก</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'user' | 'material')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">วันที่ (ล่าสุดก่อน)</option>
              <option value="user">ผู้ใช้งาน</option>
              <option value="material">วัสดุ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
          <thead>
              <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
                <th className="p-4 border-b">วันที่/เวลา</th>
                <th className="p-4 border-b">ประเภท</th>
                <th className="p-4 border-b">วัสดุ</th>
                <th className="p-4 border-b">จำนวน</th>
                <th className="p-4 border-b">ผู้ใช้งาน</th>
                <th className="p-4 border-b">เหตุผล</th>
            </tr>
          </thead>
          <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-900">
                      <div>
                        {format(new Date(tx.createdAt), 'dd MMM yyyy', { locale: th })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(tx.createdAt), 'HH:mm น.')}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'OUT' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.type === 'OUT' ? '📤 เบิกออก' : '📥 เพิ่มเข้า'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-gray-900">{tx.material.name}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>{tx.material.code}</span>
                        {tx.source && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            tx.source === 'consumable' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tx.source === 'consumable' ? '🧴 วัสดุสิ้นเปลือง' : '📦 วัสดุทั่วไป'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-semibold text-gray-900">
                        {tx.quantity.toLocaleString()} {tx.material.unit}
                    </span>
                  </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-gray-900">{tx.user.name}</div>
                      {tx.user.department && (
                        <div className="text-xs text-gray-500">{tx.user.department}</div>
                      )}
                      {!isAdmin && tx.user.name === user?.name && (
                        <div className="text-xs text-blue-600 font-medium">คุณ</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {tx.reason || <span className="text-gray-400">-</span>}
                    </td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <div>
                      {isAdmin 
                        ? 'ไม่พบประวัติการทำรายการในระบบ' 
                        : 'คุณยังไม่มีประวัติการทำรายการ'
                      }
                    </div>
                    {filter !== 'ALL' && (
                      <div className="text-sm mt-1">ลองเปลี่ยนตัวกรองหรือล้างการค้นหา</div>
                    )}
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Results Summary */}
      {filteredTransactions.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          แสดง {filteredTransactions.length} จาก {transactions.length} รายการ
        </div>
      )}
    </div>
  );
}