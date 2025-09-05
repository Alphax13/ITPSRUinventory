// src/app/dashboard/transactions/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import ApiClient from '@/utils/apiClient';
import SafeImage from '@/components/SafeImage';

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
    imageUrl?: string;
  };
  source?: 'consumable' | 'legacy';
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'material'>('date');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transaction history...');
      setLoading(true);
      
      const response = await ApiClient.get('/api/transactions');
      const data = await response.json();
      
      console.log('Transaction history received:', data);
      console.log('Number of transactions:', data.length);
      
      // Debug: ตรวจสอบข้อมูล imageUrl
      if (data.length > 0) {
        console.log('Sample transaction material data:', data[0].material);
        data.forEach((tx: Transaction, index: number) => {
          if (tx.material.imageUrl) {
            console.log(`Transaction ${index}: ${tx.material.name} has imageUrl:`, tx.material.imageUrl);
          } else {
            console.log(`Transaction ${index}: ${tx.material.name} has no imageUrl`);
          }
        });
      }
      
      setTransactions(data);
      
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      
      // แสดง error message ที่เหมาะสม
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          // ApiClient จะ redirect ไปหน้า login อัตโนมัติ
          return;
        } else {
          alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
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

  // Pagination calculations
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortBy]);

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

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
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
              {currentTransactions.length > 0 ? (
                currentTransactions.map((tx) => (
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
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <SafeImage
                            src={tx.material.imageUrl || '/placeholder-material.svg'}
                            alt={tx.material.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{tx.material.name}</div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            <span>{tx.material.code}</span>
                          </div>
                        </div>
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

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {currentTransactions.length > 0 ? (
            <div className="space-y-4 p-4">
              {currentTransactions.map((tx) => (
                <div key={tx.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Header with date and type */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">
                        {format(new Date(tx.createdAt), 'dd MMM yyyy', { locale: th })}
                      </div>
                      <div className="text-xs">
                        {format(new Date(tx.createdAt), 'HH:mm น.')}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'OUT' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {tx.type === 'OUT' ? '📤 เบิกออก' : '📥 เพิ่มเข้า'}
                    </span>
                  </div>

                  {/* Material Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0">
                      <SafeImage
                        src={tx.material.imageUrl || '/placeholder-material.svg'}
                        alt={tx.material.name}
                        width={50}
                        height={50}
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-base">{tx.material.name}</div>
                      <div className="text-sm text-gray-500">{tx.material.code}</div>
                      <div className="text-sm font-semibold text-blue-600">
                        {tx.quantity.toLocaleString()} {tx.material.unit}
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mb-2">
                    <div className="text-sm">
                      <span className="text-gray-600">ผู้ใช้งาน: </span>
                      <span className="font-medium text-gray-900">{tx.user.name}</span>
                      {!isAdmin && tx.user.name === user?.name && (
                        <span className="text-blue-600 font-medium"> (คุณ)</span>
                      )}
                    </div>
                    {tx.user.department && (
                      <div className="text-xs text-gray-500">{tx.user.department}</div>
                    )}
                  </div>

                  {/* Reason */}
                  {tx.reason && (
                    <div className="text-sm">
                      <span className="text-gray-600">เหตุผล: </span>
                      <span className="text-gray-900">{tx.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
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
            </div>
          )}
        </div>
      </div>

      {/* Pagination and Results Summary */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Results Summary */}
            <div className="text-sm text-gray-600">
              แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ← ก่อนหน้า
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, currentPage + 2);
                      return page >= start && page <= end;
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </div>

          {/* Mobile Pagination (Simplified) */}
          {totalPages > 1 && (
            <div className="flex md:hidden justify-center items-center gap-2 mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                ←
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {totalItems === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
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
        </div>
      )}
    </div>
  );
}