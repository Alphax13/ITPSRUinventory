// src/app/dashboard/transactions/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import ApiClient from '@/utils/apiClient';
import SafeImage from '@/components/SafeImage';
import {
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArchiveBoxIcon,
  CubeIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
  
  // Multi-select states
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  
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

  // Helper functions for multi-select
  const toggleTransactionSelection = (txId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(txId)) {
      newSelection.delete(txId);
    } else {
      newSelection.add(txId);
    }
    setSelectedTransactions(newSelection);
  };

  const toggleSelectAll = () => {
    const outTransactions = currentTransactions.filter(tx => tx.type === 'OUT');
    if (selectedTransactions.size === outTransactions.length && outTransactions.length > 0) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(outTransactions.map(tx => tx.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBatchDownload = async () => {
    if (selectedTransactions.size === 0) {
      alert('กรุณาเลือกรายการที่ต้องการดาวน์โหลด');
      return;
    }

    setIsDownloadingBatch(true);
    try {
      const response = await fetch('/api/consumables/withdraw/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactions),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'เกิดข้อผิดพลาด');
      }

      // ดาวน์โหลดไฟล์ PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `withdraw-batch-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clear selection
      clearSelection();
      alert('ดาวน์โหลดใบเบิกสำเร็จ!');
    } catch (error) {
      console.error('Error downloading batch:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดาวน์โหลด');
    } finally {
      setIsDownloadingBatch(false);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">ประวัติการเบิก-จ่าย</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin ? 'ดูประวัติการเบิก-จ่ายวัสดุทั้งหมดในระบบ' : 'ดูประวัติการเบิก-จ่ายวัสดุของคุณ'}
            </p>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
              ผู้ดูแลระบบ
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <ClipboardDocumentListIcon className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">{isAdmin ? 'รายการทั้งหมด' : 'รายการของคุณ'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <ArrowDownTrayIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.inTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่มเข้า</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <ArrowUpTrayIcon className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.outTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">เบิกออก</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <ArchiveBoxIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.consumableTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">วัสดุสิ้นเปลือง</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <CubeIcon className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.legacyTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">วัสดุทั่วไป</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | 'IN' | 'OUT')}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="IN">เพิ่มเข้า</option>
              <option value="OUT">เบิกออก</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'user' | 'material')}
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="date">วันที่ (ล่าสุดก่อน)</option>
            <option value="user">ผู้ใช้งาน</option>
            <option value="material">วัสดุ</option>
          </select>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {!isMultiSelectMode ? (
              <button
                onClick={() => setIsMultiSelectMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                เลือกหลายรายการ
              </button>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-sm font-medium transition-colors"
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-sm text-slate-500">
                  เลือกแล้ว: <strong className="text-slate-700">{selectedTransactions.size}</strong>
                </span>
                <button
                  onClick={handleBatchDownload}
                  disabled={selectedTransactions.size === 0 || isDownloadingBatch}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {isDownloadingBatch ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}
                </button>
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  ยกเลิก
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {isMultiSelectMode && <th className="px-4 py-3 w-10"></th>}
                <th className="px-4 py-3 text-left">วันที่/เวลา</th>
                <th className="px-4 py-3 text-left">ประเภท</th>
                <th className="px-4 py-3 text-left">วัสดุ</th>
                <th className="px-4 py-3 text-left">จำนวน</th>
                <th className="px-4 py-3 text-left">ผู้ใช้งาน</th>
                <th className="px-4 py-3 text-left">เหตุผล</th>
                {!isMultiSelectMode && <th className="px-4 py-3 text-left">ดาวน์โหลด</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTransactions.length > 0 ? (
                currentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    {isMultiSelectMode && (
                      <td className="px-4 py-3">
                        {tx.type === 'OUT' ? (
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(tx.id)}
                            onChange={() => toggleTransactionSelection(tx.id)}
                            className="w-4 h-4 accent-orange-600"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-medium">{format(new Date(tx.createdAt), 'dd MMM yyyy', { locale: th })}</div>
                      <div className="text-xs text-slate-400">{format(new Date(tx.createdAt), 'HH:mm น.')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        tx.type === 'OUT'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {tx.type === 'OUT' ? 'เบิกออก' : 'เพิ่มเข้า'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={tx.material.imageUrl || '/placeholder-material.svg'}
                          alt={tx.material.name}
                          width={36}
                          height={36}
                          className="rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <div className="font-medium text-slate-800">{tx.material.name}</div>
                          <div className="text-xs text-slate-400">{tx.material.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      {tx.quantity.toLocaleString()} {tx.material.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-slate-800">{tx.user.name}</div>
                      {tx.user.department && (
                        <div className="text-xs text-slate-400">{tx.user.department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px]">
                      {tx.reason ? (
                        tx.reason.startsWith('http://') || tx.reason.startsWith('https://') ? (
                          <a href={tx.reason} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline break-all">{tx.reason}</a>
                        ) : (
                          <span className="break-words">{tx.reason}</span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {!isMultiSelectMode && (
                      <td className="px-4 py-3">
                        {tx.type === 'OUT' ? (
                          <a
                            href={`/api/consumables/withdraw/${tx.id}/form`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMultiSelectMode ? 7 : 8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    {isAdmin ? 'ไม่พบประวัติการทำรายการในระบบ' : 'คุณยังไม่มีประวัติการทำรายการ'}
                    {filter !== 'ALL' && <div className="mt-1">ลองเปลี่ยนตัวกรอง</div>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden divide-y divide-slate-100">
          {currentTransactions.length > 0 ? (
            currentTransactions.map((tx) => (
              <div key={tx.id} className="p-4">
                {isMultiSelectMode && tx.type === 'OUT' && (
                  <label className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.has(tx.id)}
                      onChange={() => toggleTransactionSelection(tx.id)}
                      className="w-4 h-4 accent-orange-600"
                    />
                    <span className="text-sm text-slate-600">เลือกรายการนี้</span>
                  </label>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{format(new Date(tx.createdAt), 'dd MMM yyyy', { locale: th })}</div>
                    <div className="text-xs text-slate-400">{format(new Date(tx.createdAt), 'HH:mm น.')}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    tx.type === 'OUT'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {tx.type === 'OUT' ? 'เบิกออก' : 'เพิ่มเข้า'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <SafeImage
                    src={tx.material.imageUrl || '/placeholder-material.svg'}
                    alt={tx.material.name}
                    width={44}
                    height={44}
                    className="rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <div className="font-medium text-slate-800">{tx.material.name}</div>
                    <div className="text-xs text-slate-400">{tx.material.code}</div>
                    <div className="text-sm font-semibold text-orange-600 mt-0.5">
                      {tx.quantity.toLocaleString()} {tx.material.unit}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="text-slate-400">ผู้ใช้: </span>{tx.user.name}
                  {tx.user.department && <span className="text-slate-400 ml-1">• {tx.user.department}</span>}
                </div>
                {tx.reason && (
                  <div className="mt-1 text-sm text-slate-600">
                    <span className="text-slate-400">เหตุผล: </span>
                    {tx.reason.startsWith('http://') || tx.reason.startsWith('https://') ? (
                      <a href={tx.reason} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline break-all">{tx.reason}</a>
                    ) : tx.reason}
                  </div>
                )}
                {tx.type === 'OUT' && !isMultiSelectMode && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <a
                      href={`/api/consumables/withdraw/${tx.id}/form`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      ดาวน์โหลดใบเบิก PDF
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              {isAdmin ? 'ไม่พบประวัติการทำรายการ' : 'คุณยังไม่มีประวัติการทำรายการ'}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            แสดง {startIndex + 1}–{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>
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
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-orange-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}