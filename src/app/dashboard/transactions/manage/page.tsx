// src/app/dashboard/transactions/manage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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
      case 'IN': return 'bg-green-100 text-green-800';
      case 'OUT': return 'bg-red-100 text-red-800';
      case 'TRANSFER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'IN': return '📥 เข้า';
      case 'OUT': return '📤 ออก';
      case 'TRANSFER': return '🔄 โอน';
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
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-30">🔒</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-gray-600">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
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
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🗂️ จัดการประวัติรายการ</h1>
            <p className="text-orange-100">แก้ไขและลบประวัติการเบิก-จ่ายวัสดุ (Admin เท่านั้น)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อผู้ใช้, วัสดุ, หรือหมายเหตุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
          >
            <option value="">🏷️ ประเภททั้งหมด</option>
            <option value="IN">📥 เข้า</option>
            <option value="OUT">📤 ออก</option>
            <option value="TRANSFER">🔄 โอน</option>
          </select>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-orange-100">
          <p className="text-sm text-gray-600">
            แสดงผล {filteredTransactions.length} รายการจากทั้งหมด {transactions.length} รายการ
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">📥 เข้า: {transactions.filter(t => t.type === 'IN').length}</span>
            <span className="text-red-600">📤 ออก: {transactions.filter(t => t.type === 'OUT').length}</span>
            <span className="text-blue-600">🔄 โอน: {transactions.filter(t => t.type === 'TRANSFER').length}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วัสดุ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมายเหตุ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.user.name}</div>
                    <div className="text-sm text-gray-500">{transaction.user.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.material ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.material.name}</div>
                        <div className="text-sm text-gray-500">
                          {transaction.material.code} • {transaction.material.unit}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">วัสดุถูกลบแล้ว</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                      {getTypeText(transaction.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                    {transaction.reason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        disabled={processingId === transaction.id || transaction.source !== 'legacy'}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          transaction.source !== 'legacy'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title={transaction.source !== 'legacy' ? 'แก้ไขได้เฉพาะประวัติแบบเก่า' : 'แก้ไข'}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={processingId === transaction.id}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {processingId === transaction.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบประวัติรายการ</h3>
            <p className="text-gray-600">
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
    <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">✏️ แก้ไขประวัติรายการ</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'IN' | 'OUT' | 'TRANSFER' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="IN">📥 เข้า</option>
                <option value="OUT">📤 ออก</option>
                <option value="TRANSFER">🔄 โอน</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

