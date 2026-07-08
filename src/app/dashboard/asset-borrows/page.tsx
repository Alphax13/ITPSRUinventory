// src/app/dashboard/asset-borrows/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import SafeImage from '@/components/SafeImage';
import {
  ClipboardDocumentListIcon,
  EyeIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type BorrowerType = 'STUDENT' | 'LECTURER' | 'FACULTY' | 'STAFF';

const BORROWER_TYPE_LABELS: Record<BorrowerType, string> = {
  STUDENT: 'นักศึกษา',
  LECTURER: 'อาจารย์',
  FACULTY: 'คณะ',
  STAFF: 'เจ้าหน้าที่',
};

const BORROWER_TYPE_COLORS: Record<BorrowerType, string> = {
  STUDENT: 'bg-blue-100 text-blue-800',
  LECTURER: 'bg-purple-100 text-purple-800',
  FACULTY: 'bg-amber-100 text-amber-800',
  STAFF: 'bg-teal-100 text-teal-800',
};

interface BorrowRecord {
  id: string;
  borrowDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  purpose?: string;
  note?: string;
  studentName?: string;
  studentId?: string;
  borrowOnBehalfOf?: string;
  borrowerType: BorrowerType;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowerTypeFilter, setBorrowerTypeFilter] = useState('ALL');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadingBatch, setDownloadingBatch] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<BorrowRecord | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; department: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Multi-borrow modal state
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<{
    id: string; assetNumber: string; name: string; category: string;
    brand?: string; model?: string; location: string; condition: string;
  }[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [borrowCart, setBorrowCart] = useState<string[]>([]); // selected asset IDs
  const [borrowForm, setBorrowForm] = useState({
    userId: '',
    borrowerType: 'LECTURER' as BorrowerType,
    expectedReturnDate: '',
    purpose: '',
    note: '',
    studentName: '',
    studentId: '',
    borrowOnBehalfOf: '',
  });
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  const openBorrowModal = async () => {
    // โหลด available assets
    try {
      const [assetsRes, usersRes] = await Promise.all([
        fetch('/api/assets', { credentials: 'include' }),
        fetch('/api/users', { credentials: 'include' }),
      ]);
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        // กรองเฉพาะที่พร้อมให้ยืม (ไม่ได้ถูกยืมอยู่, สภาพดี)
        const available = data.filter((a: { condition: string; borrowHistory: { status: string }[] }) =>
          a.condition !== 'DISPOSED' &&
          a.condition !== 'DAMAGED' &&
          !a.borrowHistory?.some((b: { status: string }) => b.status === 'BORROWED')
        );
        setAvailableAssets(available);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data);
      }
    } catch {}
    setBorrowCart([]);
    setBorrowForm({ userId: user?.id || '', borrowerType: 'LECTURER', expectedReturnDate: '', purpose: '', note: '', studentName: '', studentId: '', borrowOnBehalfOf: '' });
    setAssetSearch('');
    setShowBorrowModal(true);
  };

  const toggleCartItem = (assetId: string) => {
    setBorrowCart(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSubmitBorrow = async () => {
    if (borrowCart.length === 0) {
      alert('กรุณาเลือกครุภัณฑ์อย่างน้อย 1 รายการ');
      return;
    }
    if (!borrowForm.userId) {
      alert('กรุณาเลือกผู้ยืม');
      return;
    }
    setSubmittingBorrow(true);
    try {
      const res = await fetch('/api/assets/borrow', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedAssetIds: borrowCart,
          userId: borrowForm.userId,
          borrowerType: borrowForm.borrowerType,
          expectedReturnDate: borrowForm.expectedReturnDate || null,
          purpose: borrowForm.purpose || null,
          note: borrowForm.note || null,
          studentName: borrowForm.borrowerType === 'STUDENT' ? (borrowForm.studentName || null) : null,
          studentId: borrowForm.borrowerType === 'STUDENT' ? (borrowForm.studentId || null) : null,
          borrowOnBehalfOf: borrowForm.borrowerType === 'FACULTY' ? (borrowForm.borrowOnBehalfOf || null) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (err.error || 'ไม่สามารถบันทึกการยืมได้'));
        return;
      }
      setShowBorrowModal(false);
      await fetchBorrows();
      alert(`บันทึกการยืมครุภัณฑ์ ${borrowCart.length} รายการเรียบร้อยแล้ว`);
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmittingBorrow(false);
    }
  };

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
    setSelectedUserId(borrow.user.id);
    setShowEditModal(true);
    // โหลดรายชื่อผู้ใช้ (ครั้งแรก)
    if (allUsers.length === 0) {
      fetch('/api/users', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => setAllUsers(data))
        .catch(() => {});
    }
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
          borrowerType: editingBorrow.borrowerType,
          studentName: editingBorrow.borrowerType === 'STUDENT' ? (editingBorrow.studentName || '') : '',
          studentId: editingBorrow.borrowerType === 'STUDENT' ? (editingBorrow.studentId || '') : '',
          borrowOnBehalfOf: editingBorrow.borrowerType === 'FACULTY' ? (editingBorrow.borrowOnBehalfOf || '') : '',
          userId: selectedUserId || editingBorrow.user.id,
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

  // Toggle เลือกทั้งหมด (เฉพาะรายการที่กรองแล้ว)
  const toggleSelectAll = () => {
    const filteredIds = filteredBorrows.map(b => b.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
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

  // ค้นหา + กรองฝั่ง client
  const filteredBorrows = borrows.filter(b => {
    if (borrowerTypeFilter !== 'ALL' && b.borrowerType !== borrowerTypeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.fixedAsset.assetNumber.toLowerCase().includes(q) ||
      b.fixedAsset.name.toLowerCase().includes(q) ||
      b.fixedAsset.category.toLowerCase().includes(q) ||
      (b.fixedAsset.brand || '').toLowerCase().includes(q) ||
      b.user.name.toLowerCase().includes(q) ||
      b.user.department.toLowerCase().includes(q) ||
      (b.studentName || '').toLowerCase().includes(q) ||
      (b.studentId || '').toLowerCase().includes(q) ||
      (b.borrowOnBehalfOf || '').toLowerCase().includes(q) ||
      (b.purpose || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-l-4 border-orange-600 px-6 py-5">
            <h1 className="text-xl font-bold text-slate-800">การยืมคืนครุภัณฑ์</h1>
            <p className="text-sm text-slate-500 mt-0.5">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-l-4 border-orange-600 px-6 py-5">
            <h1 className="text-xl font-bold text-slate-800">การยืมคืนครุภัณฑ์</h1>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto text-red-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            โหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5">
          {/* Row 1: title + action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">การยืมคืนครุภัณฑ์</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                ติดตามและจัดการการยืมคืนครุภัณฑ์
                {filteredBorrows.length !== borrows.length && (
                  <span className="ml-2 text-orange-600 font-medium">— พบ {filteredBorrows.length} จาก {borrows.length} รายการ</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={openBorrowModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                ยืมครุภัณฑ์
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDownloadPDF}
                  disabled={downloadingBatch}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {downloadingBatch ? (
                    <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>กำลังเปิด...</>
                  ) : (
                    <><PrinterIcon className="h-4 w-4" />พิมพ์รวม ({selectedIds.length})</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Row 2: search + filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search box */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อครุภัณฑ์ เลขครุภัณฑ์ ผู้ยืม นักศึกษา..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Borrower type filter */}
            <select
              value={borrowerTypeFilter}
              onChange={e => { setBorrowerTypeFilter(e.target.value); setSelectedIds([]); }}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">ทุกประเภทผู้ยืม</option>
              <option value="STUDENT">นักศึกษา</option>
              <option value="LECTURER">อาจารย์</option>
              <option value="FACULTY">คณะ</option>
              <option value="STAFF">เจ้าหน้าที่</option>
            </select>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds([]); }}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="BORROWED">กำลังยืม</option>
              <option value="RETURNED">คืนแล้ว</option>
              <option value="OVERDUE">เกินกำหนด</option>
              <option value="LOST">สูญหาย</option>
            </select>
            {/* Clear filters */}
            {(searchQuery || borrowerTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setBorrowerTypeFilter('ALL'); setStatusFilter('ALL'); setSelectedIds([]); }}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Borrows Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredBorrows.length && filteredBorrows.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">เลขครุภัณฑ์</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รายการ</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ผู้ยืม</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">วันที่ยืม</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">กำหนดคืน</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">สถานะ</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredBorrows.map((borrow) => (
              <tr key={borrow.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(borrow.id)}
                    onChange={() => toggleSelect(borrow.id)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-700">
                  {borrow.fixedAsset.assetNumber}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {borrow.fixedAsset.imageUrl && (
                      <SafeImage
                        src={borrow.fixedAsset.imageUrl}
                        alt={borrow.fixedAsset.name}
                        width={36}
                        height={36}
                        className="rounded-lg border border-slate-200 object-cover shrink-0"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-800">{borrow.fixedAsset.name}</div>
                      <div className="text-xs text-slate-500">{borrow.fixedAsset.category}{borrow.fixedAsset.brand && ` · ${borrow.fixedAsset.brand}`}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${BORROWER_TYPE_COLORS[borrow.borrowerType] || 'bg-slate-100 text-slate-700'}`}>
                      {BORROWER_TYPE_LABELS[borrow.borrowerType] || borrow.borrowerType}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">
                    {borrow.borrowerType === 'STUDENT' && borrow.studentName ? borrow.studentName : borrow.user.name}
                  </div>
                  {borrow.borrowerType === 'STUDENT' && borrow.studentName && (
                    <div className="text-xs text-slate-500">รับรองโดย: {borrow.user.name}</div>
                  )}
                  {borrow.borrowerType === 'FACULTY' && borrow.borrowOnBehalfOf && (
                    <div className="text-xs text-slate-500">นามของ: {borrow.borrowOnBehalfOf}</div>
                  )}
                  {borrow.borrowerType !== 'STUDENT' && (
                    <div className="text-xs text-slate-500">{borrow.user.department}</div>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(borrow.borrowDate).toLocaleDateString('th-TH')}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm">
                  {borrow.expectedReturnDate ? (
                    <span className={isOverdue(borrow) ? 'text-red-600 font-medium' : 'text-slate-600'}>
                      {new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH')}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>
                    {getStatusText(borrow.status)}
                  </span>
                  {isOverdue(borrow) && borrow.status === 'BORROWED' && (
                    <div className="text-xs text-red-600 mt-0.5 font-medium">เกินกำหนด!</div>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowDetails(showDetails === borrow.id ? null : borrow.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-500 transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/assets/borrow/${borrow.id}/form`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-500 transition-colors"
                      title="พิมพ์แบบฟอร์ม"
                    >
                      <PrinterIcon className="w-4 h-4" />
                    </a>
                    {isAdmin && borrow.status === 'BORROWED' && (
                      <button
                        onClick={() => handleReturn(borrow.id)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-500 transition-colors"
                        title="บันทึกการคืน"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && borrow.status === 'RETURNED' && (
                      <button
                        onClick={() => handleUndoReturn(borrow.id)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-500 transition-colors"
                        title="ยกเลิกการคืน"
                      >
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && borrow.status !== 'RETURNED' && (
                      <button
                        onClick={() => handleEdit(borrow)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-500 transition-colors"
                        title="แก้ไข"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && borrow.status !== 'RETURNED' && (
                      <button
                        onClick={() => handleDelete(borrow.id, borrow.fixedAsset.name)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 transition-colors"
                        title="ลบรายการ"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBorrows.length === 0 && (
          <div className="text-center py-16">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            {borrows.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มีรายการยืมครุภัณฑ์</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-600">ไม่พบรายการที่ตรงกับการค้นหา</p>
                <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                <button
                  onClick={() => { setSearchQuery(''); setBorrowerTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  className="mt-3 text-xs text-orange-600 hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {(() => {
              const borrow = borrows.find(b => b.id === showDetails);
              if (!borrow) return null;
              return (
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-bold text-slate-800">รายละเอียดการยืมครุภัณฑ์</h2>
                    <button onClick={() => setShowDetails(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {borrow.fixedAsset.imageUrl && (
                    <div className="mb-5 text-center">
                      <SafeImage
                        src={borrow.fixedAsset.imageUrl}
                        alt={borrow.fixedAsset.name}
                        width={200}
                        height={150}
                        className="rounded-xl border border-slate-200 object-cover mx-auto cursor-pointer hover:opacity-80"
                        onClick={() => setShowImageModal(borrow.fixedAsset.imageUrl!)}
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">เลขครุภัณฑ์</label>
                        <p className="text-sm text-slate-800">{borrow.fixedAsset.assetNumber}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">ชื่อครุภัณฑ์</label>
                        <p className="text-sm text-slate-800">{borrow.fixedAsset.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">หมวดหมู่</label>
                        <p className="text-sm text-slate-800">{borrow.fixedAsset.category}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">ตำแหน่ง</label>
                        <p className="text-sm text-slate-800">{borrow.fixedAsset.location}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">ประเภทผู้ยืม</label>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${BORROWER_TYPE_COLORS[borrow.borrowerType] || 'bg-slate-100 text-slate-700'}`}>
                          {BORROWER_TYPE_LABELS[borrow.borrowerType] || borrow.borrowerType}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">สถานะ</label>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>{getStatusText(borrow.status)}</span>
                      </div>
                    </div>

                    {/* ข้อมูลผู้ยืมตามประเภท */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      {borrow.borrowerType === 'STUDENT' ? (
                        <>
                          {borrow.studentName && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-0.5">ชื่อนักศึกษา</label>
                              <p className="text-sm text-slate-800 font-semibold">{borrow.studentName}</p>
                            </div>
                          )}
                          {borrow.studentId && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-0.5">รหัสนักศึกษา</label>
                              <p className="text-sm text-slate-800">{borrow.studentId}</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-0.5">อาจารย์/เจ้าหน้าที่ผู้รับรอง</label>
                            <p className="text-sm text-slate-800">{borrow.user.name}</p>
                          </div>
                        </>
                      ) : borrow.borrowerType === 'FACULTY' ? (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-0.5">ผู้รับผิดชอบ</label>
                            <p className="text-sm text-slate-800">{borrow.user.name}</p>
                          </div>
                          {borrow.borrowOnBehalfOf && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-0.5">ยืมในนามของ</label>
                              <p className="text-sm text-slate-800 font-semibold">{borrow.borrowOnBehalfOf}</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-0.5">หน่วยงาน</label>
                            <p className="text-sm text-slate-800">{borrow.user.department}</p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-0.5">
                            {borrow.borrowerType === 'LECTURER' ? 'อาจารย์ผู้ยืม' : 'เจ้าหน้าที่ผู้ยืม'}
                          </label>
                          <p className="text-sm text-slate-800">{borrow.user.name}</p>
                          {borrow.user.email && <p className="text-xs text-slate-500">{borrow.user.email}</p>}
                          <p className="text-xs text-slate-500">{borrow.user.department}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">วันที่ยืม</label>
                        <p className="text-sm text-slate-800">{new Date(borrow.borrowDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">กำหนดคืน</label>
                        <p className="text-sm text-slate-800">{borrow.expectedReturnDate ? new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                      </div>
                    </div>
                    {borrow.actualReturnDate && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">วันที่คืนจริง</label>
                        <p className="text-sm text-slate-800">{new Date(borrow.actualReturnDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}
                    {borrow.purpose && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">วัตถุประสงค์</label>
                        <p className="text-sm text-slate-800">{borrow.purpose}</p>
                      </div>
                    )}
                    {borrow.note && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-0.5">หมายเหตุ</label>
                        <p className="text-sm text-slate-800">{borrow.note}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={() => setShowDetails(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">ปิด</button>
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
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full w-9 h-9 flex items-center justify-center z-10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <SafeImage
              src={showImageModal}
              alt="Asset image"
              width={800}
              height={600}
              className="rounded-xl max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Multi-Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">ยืมครุภัณฑ์</h2>
                <p className="text-xs text-slate-500 mt-0.5">เลือกได้หลายรายการในครั้งเดียว</p>
              </div>
              <button
                onClick={() => setShowBorrowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Left: Asset selection */}
              <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200">
                <div className="px-5 pt-4 pb-3 shrink-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">เลือกครุภัณฑ์</p>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ / เลขครุภัณฑ์..."
                      value={assetSearch}
                      onChange={e => setAssetSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
                  {availableAssets
                    .filter(a =>
                      assetSearch === '' ||
                      a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
                      a.assetNumber.toLowerCase().includes(assetSearch.toLowerCase())
                    )
                    .map(asset => {
                      const inCart = borrowCart.includes(asset.id);
                      return (
                        <button
                          key={asset.id}
                          onClick={() => toggleCartItem(asset.id)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                            inCart
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            inCart ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                          }`}>
                            {inCart && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-800 truncate">{asset.name}</div>
                            <div className="text-xs text-slate-400">{asset.assetNumber} · {asset.category}</div>
                          </div>
                        </button>
                      );
                    })}
                  {availableAssets.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-8">ไม่มีครุภัณฑ์ที่พร้อมให้ยืม</p>
                  )}
                </div>
              </div>

              {/* Right: Form fields */}
              <div className="lg:w-1/2 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Selected summary */}
                  <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-xs text-slate-500">เลือกแล้ว:</span>
                    <span className="text-sm font-bold text-orange-600">{borrowCart.length} รายการ</span>
                    {borrowCart.length > 0 && (
                      <button onClick={() => setBorrowCart([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
                        ล้าง
                      </button>
                    )}
                  </div>

                  {/* ประเภทผู้ยืม */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">ประเภทผู้ยืม <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['STUDENT', 'LECTURER', 'FACULTY', 'STAFF'] as BorrowerType[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBorrowForm(p => ({ ...p, borrowerType: t, studentName: '', studentId: '', borrowOnBehalfOf: '' }))}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                            borrowForm.borrowerType === t
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {BORROWER_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* นักศึกษา: ชื่อ + รหัส + อาจารย์ผู้รับรอง */}
                  {borrowForm.borrowerType === 'STUDENT' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">ชื่อนักศึกษา <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={borrowForm.studentName}
                            onChange={e => setBorrowForm(p => ({ ...p, studentName: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="ชื่อ-นามสกุล"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">รหัสนักศึกษา <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={borrowForm.studentId}
                            onChange={e => setBorrowForm(p => ({ ...p, studentId: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="เช่น 65123456789"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">อาจารย์/เจ้าหน้าที่ผู้รับรอง <span className="text-red-500">*</span></label>
                        <select
                          value={borrowForm.userId}
                          onChange={e => setBorrowForm(p => ({ ...p, userId: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">— เลือกอาจารย์/เจ้าหน้าที่ผู้รับรอง —</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* อาจารย์: dropdown ผู้ยืม */}
                  {borrowForm.borrowerType === 'LECTURER' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">อาจารย์ผู้ยืม <span className="text-red-500">*</span></label>
                      <select
                        value={borrowForm.userId}
                        onChange={e => setBorrowForm(p => ({ ...p, userId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">— เลือกอาจารย์ผู้ยืม —</option>
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* คณะ: ผู้รับผิดชอบ + ยืมในนาม */}
                  {borrowForm.borrowerType === 'FACULTY' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">ผู้รับผิดชอบ <span className="text-red-500">*</span></label>
                        <select
                          value={borrowForm.userId}
                          onChange={e => setBorrowForm(p => ({ ...p, userId: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">— เลือกผู้รับผิดชอบ —</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">ยืมในนามของ <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={borrowForm.borrowOnBehalfOf}
                          onChange={e => setBorrowForm(p => ({ ...p, borrowOnBehalfOf: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="ระบุชื่อ/หน่วยงานที่ยืมในนาม"
                        />
                      </div>
                    </>
                  )}

                  {/* เจ้าหน้าที่: dropdown ผู้ยืม */}
                  {borrowForm.borrowerType === 'STAFF' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">เจ้าหน้าที่ผู้ยืม <span className="text-red-500">*</span></label>
                      <select
                        value={borrowForm.userId}
                        onChange={e => setBorrowForm(p => ({ ...p, userId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">— เลือกเจ้าหน้าที่ผู้ยืม —</option>
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">กำหนดวันคืน</label>
                    <input
                      type="date"
                      value={borrowForm.expectedReturnDate}
                      onChange={e => setBorrowForm(p => ({ ...p, expectedReturnDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">วัตถุประสงค์</label>
                    <textarea
                      value={borrowForm.purpose}
                      onChange={e => setBorrowForm(p => ({ ...p, purpose: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="ระบุวัตถุประสงค์..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">หมายเหตุ</label>
                    <textarea
                      value={borrowForm.note}
                      onChange={e => setBorrowForm(p => ({ ...p, note: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="หมายเหตุเพิ่มเติม..."
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowBorrowModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmitBorrow}
                    disabled={submittingBorrow || borrowCart.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {submittingBorrow ? (
                      <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>กำลังบันทึก...</>
                    ) : (
                      <><PlusIcon className="h-4 w-4" />บันทึกการยืม ({borrowCart.length})</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBorrow && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-800">แก้ไขรายการยืม</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingBorrow(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ข้อมูลครุภัณฑ์ (แสดงอย่างเดียว) */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">ข้อมูลครุภัณฑ์</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">เลขครุภัณฑ์:</span><span className="ml-2 font-semibold text-slate-800">{editingBorrow.fixedAsset.assetNumber}</span></div>
                  <div><span className="text-slate-500">ชื่อ:</span><span className="ml-2 font-semibold text-slate-800">{editingBorrow.fixedAsset.name}</span></div>
                  <div><span className="text-slate-500">วันที่ยืม:</span><span className="ml-2 font-semibold text-slate-800">{new Date(editingBorrow.borrowDate).toLocaleDateString('th-TH')}</span></div>
                </div>
              </div>

              {/* ประเภทผู้ยืม */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ประเภทผู้ยืม</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['STUDENT', 'LECTURER', 'FACULTY', 'STAFF'] as BorrowerType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditingBorrow({ ...editingBorrow, borrowerType: t, studentName: '', studentId: '', borrowOnBehalfOf: '' })}
                      className={`px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                        editingBorrow.borrowerType === t
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {BORROWER_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* นักศึกษา */}
              {editingBorrow.borrowerType === 'STUDENT' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อนักศึกษา</label>
                      <input
                        type="text"
                        value={editingBorrow.studentName || ''}
                        onChange={(e) => setEditingBorrow({ ...editingBorrow, studentName: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="ชื่อ-นามสกุล"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">รหัสนักศึกษา</label>
                      <input
                        type="text"
                        value={editingBorrow.studentId || ''}
                        onChange={(e) => setEditingBorrow({ ...editingBorrow, studentId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="เช่น 65123456789"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">อาจารย์/เจ้าหน้าที่ผู้รับรอง</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {allUsers.length === 0 && (
                        <option value={editingBorrow.user.id}>{editingBorrow.user.name} — {editingBorrow.user.department}</option>
                      )}
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* อาจารย์ / เจ้าหน้าที่ / คณะ: dropdown ผู้ยืม */}
              {editingBorrow.borrowerType !== 'STUDENT' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {editingBorrow.borrowerType === 'LECTURER' ? 'อาจารย์ผู้ยืม' :
                     editingBorrow.borrowerType === 'FACULTY' ? 'ผู้รับผิดชอบ (คณะ)' : 'เจ้าหน้าที่ผู้ยืม'}
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {allUsers.length === 0 && (
                      <option value={editingBorrow.user.id}>{editingBorrow.user.name} — {editingBorrow.user.department}</option>
                    )}
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* คณะ: ยืมในนาม */}
              {editingBorrow.borrowerType === 'FACULTY' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ยืมในนามของ</label>
                  <input
                    type="text"
                    value={editingBorrow.borrowOnBehalfOf || ''}
                    onChange={(e) => setEditingBorrow({ ...editingBorrow, borrowOnBehalfOf: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ระบุชื่อ/หน่วยงานที่ยืมในนาม"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">กำหนดวันคืน</label>
                <input
                  type="date"
                  value={editingBorrow.expectedReturnDate ? new Date(editingBorrow.expectedReturnDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingBorrow({ ...editingBorrow, expectedReturnDate: e.target.value ? e.target.value : undefined })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">วัตถุประสงค์</label>
                <textarea
                  value={editingBorrow.purpose || ''}
                  onChange={(e) => setEditingBorrow({ ...editingBorrow, purpose: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ระบุวัตถุประสงค์ในการยืม..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
                <textarea
                  value={editingBorrow.note || ''}
                  onChange={(e) => setEditingBorrow({ ...editingBorrow, note: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingBorrow(null); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
