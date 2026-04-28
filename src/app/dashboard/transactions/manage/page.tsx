// src/app/dashboard/transactions/manage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'TRANSFER';
  reason: string | null;
  createdAt: string;
  user: {
    name: string;
    department: string;
  };
  material: {
    name: string;
    code?: string;
    unit: string;
  } | null;
  source: 'legacy' | 'consumable';
}

export default function TransactionManagePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchTransactions();
    }
  }, [isAdmin]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบประวัติรายการนี้?\n\n⚠️ การลบจะส่งผลต่อสต็อกปัจจุบัน')) {
      return;
    }

    setProcessingId(transactionId);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user?.id })
      });

      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        alert('✅ ลบประวัติรายการสำเร็จ');
      } else {
        const error = await response.json();
        alert('❌ ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบ');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    if (transaction.source !== 'legacy') {
      alert('⚠️ สามารถแก้ไขได้เฉพาะประวัติรายการแบบเก่าเท่านั้น');
      return;
    }
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedData: { quantity: number; type: string; reason: string }) => {
    if (!editingTransaction) return;

    setProcessingId(editingTransaction.id);
    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          adminId: user?.id
        })
      });

      if (response.ok) {
        const updatedTransaction = await response.json();
        setTransactions(prev => 
          prev.map(t => t.id === editingTransaction.id 
            ? { ...updatedTransaction, source: 'legacy' as const }
            : t
          )
        );
        setShowEditModal(false);
        setEditingTransaction(null);
        alert('✅ อัปเดตประวัติรายการสำเร็จ');
      } else {
        const error = await response.json();
        alert('❌ ' + error.error);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OUT': return 'bg-red-50 text-red-700 border-red-200';
      case 'TRANSFER': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'IN': return 'เข้า';
      case 'OUT': return 'ออก';
      case 'TRANSFER': return 'โอน';
      default: return type;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || transaction.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <LockClosedIcon className="h-7 w-7 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-sm text-slate-500">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5">
          <h1 className="text-xl font-bold text-slate-800">จัดการประวัติรายการ</h1>
          <p className="text-sm text-slate-500 mt-0.5">แก้ไขและลบประวัติการเบิก-จ่ายวัสดุ (Admin เท่านั้น)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้, วัสดุ, หรือหมายเหตุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">ประเภททั้งหมด</option>
            <option value="IN">เข้า</option>
            <option value="OUT">ออก</option>
            <option value="TRANSFER">โอน</option>
          </select>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>แสดง {filteredTransactions.length} / {transactions.length} รายการ</span>
          <div className="flex gap-3">
            <span className="text-emerald-600">เข้า: {transactions.filter(t => t.type === 'IN').length}</span>
            <span className="text-red-500">ออก: {transactions.filter(t => t.type === 'OUT').length}</span>
            <span className="text-blue-600">โอน: {transactions.filter(t => t.type === 'TRANSFER').length}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">วันที่</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้ใช้</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">วัสดุ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ประเภท</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">จำนวน</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">หมายเหตุ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                    {new Date(transaction.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{transaction.user.name}</div>
                    <div className="text-xs text-slate-400">{transaction.user.department}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {transaction.material ? (
                      <div>
                        <div className="text-sm font-medium text-slate-800">{transaction.material.name}</div>
                        <div className="text-xs text-slate-400">{transaction.material.code} · {transaction.material.unit}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">วัสดุถูกลบแล้ว</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getTypeColor(transaction.type)}`}>
                      {getTypeText(transaction.type)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-700 whitespace-nowrap">
                    {transaction.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">
                    {transaction.reason || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(transaction)}
                        disabled={processingId === transaction.id || transaction.source !== 'legacy'}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                          transaction.source !== 'legacy'
                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-500'
                        }`}
                        title={transaction.source !== 'legacy' ? 'แก้ไขได้เฉพาะประวัติแบบเก่า' : 'แก้ไข'}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={processingId === transaction.id}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors disabled:opacity-40"
                        title="ลบ"
                      >
                        {processingId === transaction.id
                          ? <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full" />
                          : <TrashIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3">
            <ClipboardDocumentListIcon className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">
              {searchTerm || selectedType ? 'ลองเปลี่ยนเงื่อนไขการค้นหา' : 'ยังไม่มีประวัติรายการในระบบ'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}

// Edit Modal Component
function EditTransactionModal({ 
  transaction, 
  onSave, 
  onClose 
}: { 
  transaction: Transaction; 
  onSave: (data: { quantity: number; type: string; reason: string }) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    quantity: transaction.quantity,
    type: transaction.type,
    reason: transaction.reason || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">แก้ไขประวัติรายการ</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">จำนวน</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ประเภท</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'IN' | 'OUT' | 'TRANSFER' }))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="IN">เข้า</option>
              <option value="OUT">ออก</option>
              <option value="TRANSFER">โอน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

