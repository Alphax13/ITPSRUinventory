// src/app/dashboard/assets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import SafeImage from '@/components/SafeImage';
import AssetFormModal from './AssetFormModal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ComputerDesktopIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';

export interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  location: string;
  condition: 'GOOD' | 'DAMAGED' | 'NEEDS_REPAIR' | 'DISPOSED';
  imageUrl?: string;
  description?: string;
  createdAt: string;
  borrowHistory?: BorrowRecord[];
}

export interface BorrowRecord {
  id: string;
  borrowDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  purpose?: string;
  note?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  user: {
    name: string;
    email?: string;
  };
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('assetNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedAssets, setPaginatedAssets] = useState<Asset[]>([]);

  type BorrowerType = 'STUDENT' | 'LECTURER' | 'FACULTY' | 'STAFF';
  const BORROWER_TYPE_LABELS: Record<BorrowerType, string> = {
    STUDENT: 'นักศึกษา',
    LECTURER: 'อาจารย์',
    FACULTY: 'คณะ',
    STAFF: 'เจ้าหน้าที่',
  };

  const [borrowFormData, setBorrowFormData] = useState({
    userId: '',
    borrowerType: 'LECTURER' as BorrowerType,
    expectedReturnDate: '',
    purpose: '',
    note: '',
    studentName: '',
    studentId: '',
    borrowOnBehalfOf: '',
  });
  const [returnFormData, setReturnFormData] = useState({
    borrowId: '',
    condition: 'GOOD' as Asset['condition'],
    note: '',
  });
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchAssets();
    fetchUsers();
    fetchBorrows();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = [...assets];

    // Search by multiple fields
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(lowercaseSearch) ||
        asset.assetNumber.toLowerCase().includes(lowercaseSearch) ||
        asset.category.toLowerCase().includes(lowercaseSearch) ||
        asset.brand?.toLowerCase().includes(lowercaseSearch) ||
        asset.model?.toLowerCase().includes(lowercaseSearch) ||
        asset.serialNumber?.toLowerCase().includes(lowercaseSearch) ||
        asset.location.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(asset => asset.category === filterCategory);
    }

    // Filter by condition
    if (filterCondition) {
      filtered = filtered.filter(asset => asset.condition === filterCondition);
    }

    // Filter by status (borrowed/available)
    if (filterStatus) {
      filtered = filtered.filter(asset => {
        const currentBorrow = asset.borrowHistory?.find(b => b.status === 'BORROWED');
        if (filterStatus === 'BORROWED') {
          return !!currentBorrow;
        } else if (filterStatus === 'AVAILABLE') {
          return !currentBorrow;
        }
        return true;
      });
    }

    // Sort the filtered results
    const sorted = filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortBy as keyof Asset] as string | number | Date;
      let bValue: string | number | Date = b[sortBy as keyof Asset] as string | number | Date;

      // Handle special cases
      if (sortBy === 'purchasePrice') {
        aValue = a.purchasePrice || 0;
        bValue = b.purchasePrice || 0;
      } else if (sortBy === 'purchaseDate') {
        aValue = new Date(a.purchaseDate || '1970-01-01');
        bValue = new Date(b.purchaseDate || '1970-01-01');
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAssets(sorted);
  }, [assets, searchTerm, filterCategory, filterCondition, filterStatus, sortBy, sortOrder]);

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedAssets(filteredAssets.slice(startIndex, endIndex));
  }, [filteredAssets, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterCondition, filterStatus]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBorrows = async () => {
    try {
      const response = await fetch('/api/assets/borrow');
      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      }
    } catch (error) {
      console.error('Error fetching borrows:', error);
    }
  };

  // Get unique categories for filter dropdown
  const getUniqueCategories = () => {
    const categories = assets.map(asset => asset.category);
    return [...new Set(categories)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterCondition('');
    setFilterStatus('');
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-400" />;
    if (sortOrder === 'asc') return <ChevronUpIcon className="w-3.5 h-3.5 text-orange-500" />;
    return <ChevronDownIcon className="w-3.5 h-3.5 text-orange-500" />;
  };

  // Pagination functions
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const totalItems = filteredAssets.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const getPaginationRange = () => {
    const range = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          range.push(i);
        }
        range.push('...');
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1);
        range.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          range.push(i);
        }
      } else {
        range.push(1);
        range.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          range.push(i);
        }
        range.push('...');
        range.push(totalPages);
      }
    }
    
    return range;
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const response = await fetch('/api/assets/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fixedAssetId: selectedAsset.id,
          ...borrowFormData,
        }),
      });

      if (response.ok) {
        fetchAssets();
        fetchBorrows();
        setBorrowFormData({
          userId: '',
          borrowerType: 'LECTURER',
          expectedReturnDate: '',
          purpose: '',
          note: '',
          studentName: '',
          studentId: '',
          borrowOnBehalfOf: '',
        });
        setShowBorrowForm(false);
        setSelectedAsset(null);
      }
    } catch (error) {
      console.error('Error borrowing asset:', error);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/assets/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnFormData),
      });

      if (response.ok) {
        fetchAssets();
        fetchBorrows();
        setReturnFormData({
          borrowId: '',
          condition: 'GOOD',
          note: '',
        });
        setShowReturnForm(false);
      }
    } catch (error) {
      console.error('Error returning asset:', error);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`คุณต้องการลบครุภัณฑ์ "${asset.name}" หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        fetchAssets();
        alert('ลบครุภัณฑ์สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('เกิดข้อผิดพลาดในการลบครุภัณฑ์');
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'GOOD': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'DAMAGED': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'NEEDS_REPAIR': return 'bg-red-50 text-red-700 border border-red-200';
      case 'DISPOSED': return 'bg-slate-100 text-slate-500 border border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'GOOD': return 'ดี';
      case 'DAMAGED': return 'เสียหาย';
      case 'NEEDS_REPAIR': return 'ต้องซ่อม';
      case 'DISPOSED': return 'จำหน่ายแล้ว';
      default: return condition;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const allAvailable = assets.filter(a => !a.borrowHistory?.find(b => b.status === 'BORROWED')).length;
  const allBorrowed = assets.filter(a => !!a.borrowHistory?.find(b => b.status === 'BORROWED')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">จัดการครุภัณฑ์</h1>
            <p className="text-sm text-slate-500 mt-0.5">ติดตามและจัดการครุภัณฑ์ทั้งหมด</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                เพิ่มครุภัณฑ์
              </button>
              <button
                onClick={() => setShowReturnForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                คืนครุภัณฑ์
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">ครุภัณฑ์ทั้งหมด</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{assets.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">ว่าง</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{allAvailable}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">ถูกยืม</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{allBorrowed}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">จำหน่ายแล้ว</p>
          <p className="text-3xl font-bold text-slate-400 mt-2">{assets.filter(a => a.condition === 'DISPOSED').length}</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="ค้นหา ชื่อ, เลขครุภัณฑ์, หมวดหมู่, ยี่ห้อ, รุ่น..."
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="lg:w-44 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">ทุกหมวดหมู่</option>
            {getUniqueCategories().map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="lg:w-36 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">ทุกสภาพ</option>
            <option value="GOOD">ดี</option>
            <option value="DAMAGED">เสียหาย</option>
            <option value="NEEDS_REPAIR">ต้องซ่อม</option>
            <option value="DISPOSED">จำหน่ายแล้ว</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="lg:w-36 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">ทุกสถานะ</option>
            <option value="AVAILABLE">ว่าง</option>
            <option value="BORROWED">ถูกยืม</option>
          </select>

          {/* Clear Filters Button */}
          {(searchTerm || filterCategory || filterCondition || filterStatus) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              ล้าง
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            แสดง {filteredAssets.length} จาก {assets.length} รายการ
            {(searchTerm || filterCategory || filterCondition || filterStatus) && (
              <span className="ml-2 text-orange-600 font-medium">(กำลังกรอง)</span>
            )}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                ค้นหา: {searchTerm}
                <button onClick={() => setSearchTerm('')}><XMarkIcon className="w-3 h-3" /></button>
              </span>
            )}
            {filterCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {filterCategory}
                <button onClick={() => setFilterCategory('')}><XMarkIcon className="w-3 h-3" /></button>
              </span>
            )}
            {filterCondition && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {getConditionText(filterCondition)}
                <button onClick={() => setFilterCondition('')}><XMarkIcon className="w-3 h-3" /></button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                {filterStatus === 'AVAILABLE' ? 'ว่าง' : 'ถูกยืม'}
                <button onClick={() => setFilterStatus('')}><XMarkIcon className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Asset Form Modal */}
      {showForm && (
        <AssetFormModal
          onClose={() => {
            setShowForm(false);
            setEditingAsset(null);
          }}
          onSave={() => {
            fetchAssets();
            setShowForm(false);
            setEditingAsset(null);
          }}
          editingAsset={editingAsset || undefined}
        />
      )}

      {/* Borrow Asset Form Modal */}
      {showBorrowForm && selectedAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-800">ยืมครุภัณฑ์: {selectedAsset.assetNumber}</h2>
              <button
                onClick={() => { setShowBorrowForm(false); setSelectedAsset(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBorrowSubmit} className="space-y-4">
              {/* ประเภทผู้ยืม */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ประเภทผู้ยืม *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['STUDENT', 'LECTURER', 'FACULTY', 'STAFF'] as BorrowerType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBorrowFormData(p => ({ ...p, borrowerType: t, studentName: '', studentId: '', borrowOnBehalfOf: '' }))}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                        borrowFormData.borrowerType === t
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
              {borrowFormData.borrowerType === 'STUDENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อนักศึกษา *</label>
                    <input
                      type="text"
                      value={borrowFormData.studentName}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, studentName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ชื่อ-นามสกุลนักศึกษา"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">รหัสนักศึกษา *</label>
                    <input
                      type="text"
                      value={borrowFormData.studentId}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, studentId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="เช่น 661xxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">อาจารย์/เจ้าหน้าที่ผู้รับรอง *</label>
                    <select
                      value={borrowFormData.userId}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, userId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">เลือกอาจารย์/เจ้าหน้าที่ผู้รับรอง</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* อาจารย์ */}
              {borrowFormData.borrowerType === 'LECTURER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">อาจารย์ผู้ยืม *</label>
                  <select
                    value={borrowFormData.userId}
                    onChange={(e) => setBorrowFormData({ ...borrowFormData, userId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกอาจารย์ผู้ยืม</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* คณะ */}
              {borrowFormData.borrowerType === 'FACULTY' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ผู้รับผิดชอบ *</label>
                    <select
                      value={borrowFormData.userId}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, userId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">เลือกผู้รับผิดชอบ</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ยืมในนามของ *</label>
                    <input
                      type="text"
                      value={borrowFormData.borrowOnBehalfOf}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, borrowOnBehalfOf: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ระบุชื่อ/หน่วยงานที่ยืมในนาม"
                      required
                    />
                  </div>
                </>
              )}

              {/* เจ้าหน้าที่ */}
              {borrowFormData.borrowerType === 'STAFF' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">เจ้าหน้าที่ผู้ยืม *</label>
                  <select
                    value={borrowFormData.userId}
                    onChange={(e) => setBorrowFormData({ ...borrowFormData, userId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกเจ้าหน้าที่ผู้ยืม</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">วันที่คาดว่าจะคืน</label>
                <input
                  type="date"
                  value={borrowFormData.expectedReturnDate}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, expectedReturnDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">วัตถุประสงค์การยืม</label>
                <input
                  type="text"
                  value={borrowFormData.purpose}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, purpose: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="เช่น สำหรับการสอน, งานวิจัย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
                <textarea
                  value={borrowFormData.note}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, note: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="หมายเหตุเพิ่มเติม"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBorrowForm(false); setSelectedAsset(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  ยืม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Form Modal */}
      {showReturnForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-800">คืนครุภัณฑ์</h2>
              <button
                onClick={() => setShowReturnForm(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">เลือกรายการยืม *</label>
                <select
                  value={returnFormData.borrowId}
                  onChange={(e) => setReturnFormData({ ...returnFormData, borrowId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกรายการยืม</option>
                  {borrows
                    .filter(borrow => borrow.status === 'BORROWED' || borrow.status === 'OVERDUE')
                    .map((borrow) => (
                      <option key={borrow.id} value={borrow.id}>
                        {/* @ts-expect-error - API response includes fixedAsset */}
                        {borrow.fixedAsset?.assetNumber} - {borrow.user.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">สภาพครุภัณฑ์เมื่อคืน</label>
                <select
                  value={returnFormData.condition}
                  onChange={(e) => setReturnFormData({ ...returnFormData, condition: e.target.value as Asset['condition'] })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="GOOD">ดี</option>
                  <option value="DAMAGED">เสียหาย</option>
                  <option value="NEEDS_REPAIR">ต้องซ่อม</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุการคืน</label>
                <textarea
                  value={returnFormData.note}
                  onChange={(e) => setReturnFormData({ ...returnFormData, note: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="สภาพการคืน, ปัญหาที่พบ"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  คืน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Info and Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-600">
            แสดง {paginatedAssets.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}–{Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">แสดงต่อหน้า:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('assetNumber')}>
                  <div className="flex items-center gap-1">เลขครุภัณฑ์ {getSortIcon('assetNumber')}</div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">รายการ {getSortIcon('name')}</div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">หมวดหมู่ {getSortIcon('category')}</div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">สถานที่ {getSortIcon('location')}</div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('condition')}>
                  <div className="flex items-center gap-1">สภาพ {getSortIcon('condition')}</div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAssets.map((asset) => {
                const currentBorrow = asset.borrowHistory?.find(b => b.status === 'BORROWED');
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {asset.assetNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {asset.imageUrl ? (
                          <SafeImage
                            src={asset.imageUrl}
                            alt={asset.name}
                            width={44}
                            height={44}
                            className="rounded-xl border border-slate-200 object-cover cursor-pointer hover:opacity-80 flex-shrink-0"
                            onClick={() => setShowImageModal(asset.imageUrl || null)}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <ComputerDesktopIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{asset.name}</p>
                          {asset.brand && (
                            <p className="text-xs text-slate-500">{asset.brand}{asset.model ? ` — ${asset.model}` : ''}</p>
                          )}
                          {asset.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{asset.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{asset.category}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{asset.location}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getConditionColor(asset.condition)}`}>
                        {getConditionText(asset.condition)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {currentBorrow ? (
                        <div>
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">ถูกยืม</span>
                          <p className="text-xs text-slate-500 mt-0.5">โดย: {currentBorrow.user.name}</p>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ว่าง</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {!currentBorrow && asset.condition !== 'DISPOSED' && asset.condition !== 'DAMAGED' && (
                          <button
                            onClick={() => { setSelectedAsset(asset); setShowBorrowForm(true); }}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors"
                            title="ยืมครุภัณฑ์"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditingAsset(asset); setShowForm(true); }}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-500 transition-colors"
                              title="แก้ไขครุภัณฑ์"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="ลบครุภัณฑ์"
                              disabled={!!currentBorrow}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-100">
          {paginatedAssets.map((asset) => {
            const currentBorrow = borrows.find(
              borrow => borrow.id &&
              typeof borrow === 'object' &&
              'fixedAsset' in borrow &&
              borrow.fixedAsset &&
              typeof borrow.fixedAsset === 'object' &&
              'id' in borrow.fixedAsset &&
              borrow.fixedAsset.id === asset.id &&
              (borrow.status === 'BORROWED' || borrow.status === 'OVERDUE')
            );
            return (
              <div key={asset.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  {asset.imageUrl ? (
                    <SafeImage
                      src={asset.imageUrl}
                      alt={asset.name}
                      width={56}
                      height={56}
                      className="rounded-xl border border-slate-200 object-cover cursor-pointer hover:opacity-80 flex-shrink-0"
                      onClick={() => setShowImageModal(asset.imageUrl || null)}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <ComputerDesktopIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                        <p className="text-xs text-slate-500">#{asset.assetNumber}</p>
                        {asset.brand && (
                          <p className="text-xs text-slate-400">{asset.brand}{asset.model ? ` — ${asset.model}` : ''}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!currentBorrow && asset.condition !== 'DISPOSED' && asset.condition !== 'DAMAGED' && (
                          <button
                            onClick={() => { setSelectedAsset(asset); setShowBorrowForm(true); }}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors"
                            title="ยืมครุภัณฑ์"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditingAsset(asset); setShowForm(true); }}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-500 transition-colors"
                              title="แก้ไขครุภัณฑ์"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="ลบครุภัณฑ์"
                              disabled={!!currentBorrow}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <span className="text-slate-500">{asset.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{asset.location}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${getConditionColor(asset.condition)}`}>
                        {getConditionText(asset.condition)}
                      </span>
                      {currentBorrow ? (
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-700 border border-orange-200">ถูกยืม</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">ว่าง</span>
                      )}
                    </div>
                    {currentBorrow && (
                      <p className="text-xs text-slate-400 mt-1">ยืมโดย: {currentBorrow.user.name}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Data */}
        {paginatedAssets.length === 0 && !loading && (
          <div className="text-center py-16">
            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-slate-300" />
            {assets.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">ยังไม่มีครุภัณฑ์ในระบบ</p>
            ) : (
              <div>
                <p className="mt-3 text-sm text-slate-500">ไม่พบครุภัณฑ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                <button onClick={clearFilters} className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-500">หน้า {currentPage} จาก {totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ก่อนหน้า
                </button>
                <div className="hidden sm:flex gap-1">
                  {getPaginationRange().map((page, index) => (
                    <div key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-1.5 text-sm text-slate-400">…</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page as number)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="sm:hidden px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
