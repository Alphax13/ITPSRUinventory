// src/app/dashboard/asset-borrows/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import SafeImage from '@/components/SafeImage';

interface BorrowRecord {
  id: string;
  borrowDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  purpose?: string;
  note?: string;
  studentName?: string;
  studentId?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fixedAsset: {
    id: string;
    assetNumber: string;
    name: string;
    category: string;
    brand?: string;
    model?: string;
    location: string;
    condition: string;
    imageUrl?: string;
  };
  user: {
    id: string;
    name: string;
    email?: string;
    department: string;
  };
}

export default function AssetBorrowsPage() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadingBatch, setDownloadingBatch] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<BorrowRecord | null>(null);
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const loadBorrows = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = statusFilter === 'ALL' 
          ? '/api/assets/borrow' 
          : `/api/assets/borrow?status=${statusFilter}`;
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          setError(`ไม่สามารถโหลดข้อมูลได้ (${response.status}): ${errorText}`);
          return;
        }
        
        const data = await response.json();
        setBorrows(data);
      } catch (error) {
        console.error('Error fetching borrows:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadBorrows();
  }, [statusFilter]);

  const fetchBorrows = async () => {
    try {
      const url = statusFilter === 'ALL' 
        ? '/api/assets/borrow' 
        : `/api/assets/borrow?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      }
    } catch (error) {
      console.error('Error fetching borrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowId: string) => {
    try {
      const response = await fetch('/api/assets/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          borrowId,
          condition: 'GOOD',
          note: 'คืนผ่านระบบ'
        }),
      });

      if (response.ok) {
        fetchBorrows();
        alert('บันทึกการคืนครุภัณฑ์เรียบร้อยแล้ว');
      } else {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + (errorData.error || 'ไม่สามารถบันทึกการคืนได้'));
      }
    } catch (error) {
      console.error('Error returning asset:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleUndoReturn = async (borrowId: string) => {
    if (!confirm('ต้องการยกเลิกการคืนและเปลี่ยนสถานะกลับเป็น "กำลังยืม" ใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/borrow/${borrowId}/undo-return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchBorrows();
        alert('ยกเลิกการคืนเรียบร้อยแล้ว สถานะเปลี่ยนเป็น "กำลังยืม"');
      } else {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + (errorData.error || 'ไม่สามารถยกเลิกได้'));
      }
    } catch (error) {
      console.error('Error undoing return:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDelete = async (borrowId: string, assetName: string) => {
    if (!confirm(`ต้องการลบรายการยืม "${assetName}" หรือไม่?\n\nการลบจะไม่สามารถกู้คืนได้`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/borrow/${borrowId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchBorrows();
        alert('ลบรายการยืมเรียบร้อยแล้ว');
      } else {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + (errorData.error || 'ไม่สามารถลบได้'));
      }
    } catch (error) {
      console.error('Error deleting borrow:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleEdit = (borrow: BorrowRecord) => {
    setEditingBorrow(borrow);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBorrow) return;

    console.log('[Frontend] Sending update for borrow:', editingBorrow.id);
    console.log('[Frontend] Update data:', {
      expectedReturnDate: editingBorrow.expectedReturnDate,
      purpose: editingBorrow.purpose,
      note: editingBorrow.note,
      studentName: editingBorrow.studentName,
      studentId: editingBorrow.studentId,
    });

    try {
      const response = await fetch(`/api/assets/borrow/${editingBorrow.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedReturnDate: editingBorrow.expectedReturnDate || null,
          purpose: editingBorrow.purpose || '',
          note: editingBorrow.note || '',
          studentName: editingBorrow.studentName || '',
          studentId: editingBorrow.studentId || '',
        }),
      });

      if (response.ok) {
        await fetchBorrows();
        setShowEditModal(false);
        setEditingBorrow(null);
        alert('แก้ไขรายการยืมเรียบร้อยแล้ว');
      } else {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + (errorData.error || 'ไม่สามารถแก้ไขได้'));
      }
    } catch (error) {
      console.error('Error updating borrow:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // แสดงแบบฟอร์ม PDF รวมหลายรายการ (batch)
  const handleBatchDownloadPDF = async () => {
    if (selectedIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการแสดงแบบฟอร์ม');
      return;
    }

    // ตรวจสอบว่าทุกรายการเป็นผู้ยืมคนเดียวกัน
    const selectedBorrows = borrows.filter(b => selectedIds.includes(b.id));
    const firstUserId = selectedBorrows[0]?.user.id;
    const hasDifferentUsers = selectedBorrows.some(b => b.user.id !== firstUserId);
    
    if (hasDifferentUsers) {
      alert('ไม่สามารถรวมแบบฟอร์มได้: กรุณาเลือกรายการที่มีผู้ยืมคนเดียวกัน');
      return;
    }

    try {
      setDownloadingBatch(true);
      
      // สร้าง form และส่งแบบ POST ไปหน้าต่างใหม่
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/assets/borrow/batch/form';
      form.target = '_blank';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'borrowIds';
      input.value = JSON.stringify(selectedIds);
      
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      // ล้างการเลือก
      setTimeout(() => setSelectedIds([]), 500);
    } catch (error) {
      console.error('Error opening batch form:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแสดงแบบฟอร์ม');
    } finally {
      setDownloadingBatch(false);
    }
  };

  // Toggle การเลือกรายการเดียว
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle เลือกทั้งหมด
  const toggleSelectAll = () => {
    if (selectedIds.length === borrows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(borrows.map(b => b.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BORROWED': return 'bg-blue-100 text-blue-800';
      case 'RETURNED': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'LOST': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'BORROWED': return 'กำลังยืม';
      case 'RETURNED': return 'คืนแล้ว';
      case 'OVERDUE': return 'เกินกำหนด';
      case 'LOST': return 'สูญหาย';
      default: return status;
    }
  };

  const isOverdue = (borrow: BorrowRecord) => {
    if (!borrow.expectedReturnDate || borrow.status === 'RETURNED') return false;
    return new Date(borrow.expectedReturnDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
            <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
            <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
          <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* ปุ่มดาวน์โหลด PDF รวม */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDownloadPDF}
              disabled={downloadingBatch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingBatch ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังเปิดแบบฟอร์ม...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>พิมพ์แบบฟอร์มรวม ({selectedIds.length})</span>
                </>
              )}
            </button>
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="BORROWED">กำลังยืม</option>
            <option value="RETURNED">คืนแล้ว</option>
            <option value="OVERDUE">เกินกำหนด</option>
            <option value="LOST">สูญหาย</option>
          </select>
        </div>
      </div>

      {/* Borrows Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === borrows.length && borrows.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เลขครุภัณฑ์
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายการ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้ยืม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่ยืม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                กำหนดคืน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {borrows.map((borrow) => (
              <tr key={borrow.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(borrow.id)}
                    onChange={() => toggleSelect(borrow.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {borrow.fixedAsset.assetNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {borrow.fixedAsset.imageUrl && (
                      <div className="flex-shrink-0">
                        <SafeImage
                          src={borrow.fixedAsset.imageUrl}
                          alt={borrow.fixedAsset.name}
                          width={40}
                          height={40}
                          className="rounded-lg border border-gray-200 object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {borrow.fixedAsset.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {borrow.fixedAsset.category}
                        {borrow.fixedAsset.brand && ` - ${borrow.fixedAsset.brand}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {borrow.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {borrow.user.department}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(borrow.borrowDate).toLocaleDateString('th-TH')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {borrow.expectedReturnDate ? (
                    <span className={isOverdue(borrow) ? 'text-red-600' : ''}>
                      {new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH')}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>
                    {getStatusText(borrow.status)}
                  </span>
                  {isOverdue(borrow) && borrow.status === 'BORROWED' && (
                    <div className="text-xs text-red-600 mt-1">เกินกำหนด!</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDetails(showDetails === borrow.id ? null : borrow.id)}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors"
                      title={showDetails === borrow.id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    <a
                      href={`/api/assets/borrow/${borrow.id}/form`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-colors"
                      title="พิมพ์แบบฟอร์มยืม-คืน (Print to PDF)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </a>
                    
                    {isAdmin && borrow.status === 'BORROWED' && (
                      <button
                        onClick={() => handleReturn(borrow.id)}
                        className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-colors"
                        title="บันทึกการคืนครุภัณฑ์"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    
                    {isAdmin && borrow.status === 'RETURNED' && (
                      <button
                        onClick={() => handleUndoReturn(borrow.id)}
                        className="inline-flex items-center justify-center w-8 h-8 text-orange-600 hover:text-white hover:bg-orange-600 rounded-full transition-colors"
                        title="ยกเลิกการคืน (กดผิด)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}

                    {isAdmin && borrow.status !== 'RETURNED' && (
                      <button
                        onClick={() => handleEdit(borrow)}
                        className="inline-flex items-center justify-center w-8 h-8 text-purple-600 hover:text-white hover:bg-purple-600 rounded-full transition-colors"
                        title="แก้ไขรายการยืม"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {isAdmin && borrow.status !== 'RETURNED' && (
                      <button
                        onClick={() => handleDelete(borrow.id, borrow.fixedAsset.name)}
                        className="inline-flex items-center justify-center w-8 h-8 text-red-700 hover:text-white hover:bg-red-700 rounded-full transition-colors"
                        title="ลบรายการยืม"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {borrows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {statusFilter === 'ALL' 
                ? 'ยังไม่มีรายการยืมครุภัณฑ์' 
                : `ไม่มีรายการที่มีสถานะ "${getStatusText(statusFilter)}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const borrow = borrows.find(b => b.id === showDetails);
              if (!borrow) return null;

              return (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">รายละเอียดการยืมครุภัณฑ์</h2>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Asset Image */}
                  {borrow.fixedAsset.imageUrl && (
                    <div className="mb-6 text-center">
                      <SafeImage
                        src={borrow.fixedAsset.imageUrl}
                        alt={borrow.fixedAsset.name}
                        width={200}
                        height={150}
                        className="rounded-lg border border-gray-200 object-cover mx-auto cursor-pointer hover:opacity-80"
                        onClick={() => setShowImageModal(borrow.fixedAsset.imageUrl!)}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">เลขครุภัณฑ์</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.assetNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อครุภัณฑ์</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ตำแหน่ง</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.location}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ผู้ยืม</label>
                        <p className="text-sm text-gray-900">{borrow.user.name}</p>
                        <p className="text-xs text-gray-500">{borrow.user.email}</p>
                        <p className="text-xs text-gray-500">{borrow.user.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>
                          {getStatusText(borrow.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่ยืม</label>
                        <p className="text-sm text-gray-900">
                          {new Date(borrow.borrowDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">กำหนดคืน</label>
                        <p className="text-sm text-gray-900">
                          {borrow.expectedReturnDate ? 
                            new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    {borrow.actualReturnDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่คืนจริง</label>
                        <p className="text-sm text-gray-900">
                          {new Date(borrow.actualReturnDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {(borrow.studentName || borrow.studentId) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                          {borrow.studentName && (
                            <div>
                              <label className="block text-sm font-medium text-blue-900">ชื่อนักศึกษา</label>
                              <p className="text-sm text-blue-700 font-semibold">{borrow.studentName}</p>
                            </div>
                          )}
                          {borrow.studentId && (
                            <div>
                              <label className="block text-sm font-medium text-blue-900">รหัสนักศึกษา</label>
                              <p className="text-sm text-blue-700 font-semibold">{borrow.studentId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {borrow.purpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วัตถุประสงค์</label>
                        <p className="text-sm text-gray-900">{borrow.purpose}</p>
                      </div>
                    )}

                    {borrow.note && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                        <p className="text-sm text-gray-900">{borrow.note}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowDetails(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowImageModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl z-10"
            >
              ×
            </button>
            <SafeImage
              src={showImageModal}
              alt="Asset image"
              width={800}
              height={600}
              className="rounded-lg max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBorrow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">แก้ไขรายการยืม</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBorrow(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* ข้อมูลครุภัณฑ์ (แสดงอย่างเดียว) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลครุภัณฑ์</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">เลขครุภัณฑ์:</span>
                    <span className="ml-2 font-semibold">{editingBorrow.fixedAsset.assetNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ชื่อ:</span>
                    <span className="ml-2 font-semibold">{editingBorrow.fixedAsset.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ผู้ยืม:</span>
                    <span className="ml-2 font-semibold">{editingBorrow.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">วันที่ยืม:</span>
                    <span className="ml-2 font-semibold">{new Date(editingBorrow.borrowDate).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>

              {/* ฟอร์มแก้ไข */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  กำหนดวันคืน
                </label>
                <input
                  type="date"
                  value={editingBorrow.expectedReturnDate ? new Date(editingBorrow.expectedReturnDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingBorrow({
                    ...editingBorrow,
                    expectedReturnDate: e.target.value ? e.target.value : undefined
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วัตถุประสงค์
                </label>
                <textarea
                  value={editingBorrow.purpose || ''}
                  onChange={(e) => setEditingBorrow({
                    ...editingBorrow,
                    purpose: e.target.value
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ระบุวัตถุประสงค์ในการยืม..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={editingBorrow.note || ''}
                  onChange={(e) => setEditingBorrow({
                    ...editingBorrow,
                    note: e.target.value
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อนักศึกษา (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={editingBorrow.studentName || ''}
                    onChange={(e) => setEditingBorrow({
                      ...editingBorrow,
                      studentName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสนักศึกษา
                  </label>
                  <input
                    type="text"
                    value={editingBorrow.studentId || ''}
                    onChange={(e) => setEditingBorrow({
                      ...editingBorrow,
                      studentId: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="เช่น 65123456789"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBorrow(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
