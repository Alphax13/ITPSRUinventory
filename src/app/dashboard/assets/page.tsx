// src/app/dashboard/assets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import SafeImage from '@/components/SafeImage';
import AssetFormModal from './AssetFormModal';

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

  const [borrowFormData, setBorrowFormData] = useState({
    userId: '',
    expectedReturnDate: '',
    purpose: '',
    note: '',
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
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
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
          expectedReturnDate: '',
          purpose: '',
          note: '',
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
      case 'GOOD': return 'bg-green-100 text-green-800';
      case 'DAMAGED': return 'bg-yellow-100 text-yellow-800';
      case 'NEEDS_REPAIR': return 'bg-red-100 text-red-800';
      case 'DISPOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการครุภัณฑ์</h1>
          <p className="text-gray-600 mt-1">ติดตามและจัดการครุภัณฑ์ทั้งหมด</p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มครุภัณฑ์</span>
            </button>
            <button
              onClick={() => setShowReturnForm(true)}
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
              <span>คืนครุภัณฑ์</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหาครุภัณฑ์
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ค้นหาด้วย ชื่อ, เลขครุภัณฑ์, หมวดหมู่, ยี่ห้อ, รุ่น, เลขซีเรียล หรือสถานที่..."
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สภาพ
            </label>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="GOOD">ดี</option>
              <option value="DAMAGED">เสียหาย</option>
              <option value="NEEDS_REPAIR">ต้องซ่อม</option>
              <option value="DISPOSED">จำหน่ายแล้ว</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะการใช้งาน
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="AVAILABLE">ว่าง</option>
              <option value="BORROWED">ถูกยืม</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="lg:w-auto flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              title="ล้างตัวกรอง"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>ล้าง</span>
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              แสดง {filteredAssets.length} จาก {assets.length} รายการ
              {(searchTerm || filterCategory || filterCondition || filterStatus) && (
                <span className="ml-2 text-blue-600">
                  (กำลังกรองข้อมูล)
                </span>
              )}
            </span>
            
            {/* Sort Info */}
            <span className="text-gray-400">
              เรียงตาม: {
                sortBy === 'assetNumber' ? 'เลขครุภัณฑ์' :
                sortBy === 'name' ? 'ชื่อ' :
                sortBy === 'category' ? 'หมวดหมู่' :
                sortBy === 'location' ? 'สถานที่' :
                sortBy === 'condition' ? 'สภาพ' : sortBy
              } ({sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'})
            </span>
          </div>
          
          {/* Active Filters */}
          {(searchTerm || filterCategory || filterCondition || filterStatus) && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ค้นหา: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterCategory && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  หมวดหมู่: {filterCategory}
                  <button
                    onClick={() => setFilterCategory('')}
                    className="ml-1 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterCondition && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  สภาพ: {getConditionText(filterCondition)}
                  <button
                    onClick={() => setFilterCondition('')}
                    className="ml-1 hover:text-yellow-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  สถานะ: {filterStatus === 'AVAILABLE' ? 'ว่าง' : 'ถูกยืม'}
                  <button
                    onClick={() => setFilterStatus('')}
                    className="ml-1 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              ยืมครุภัณฑ์: {selectedAsset.assetNumber}
            </h2>
            <form onSubmit={handleBorrowSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้ยืม *
                </label>
                <select
                  value={borrowFormData.userId}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">เลือกผู้ยืม</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่คาดว่าจะคืน
                </label>
                <input
                  type="date"
                  value={borrowFormData.expectedReturnDate}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, expectedReturnDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วัตถุประสงค์การยืม
                </label>
                <input
                  type="text"
                  value={borrowFormData.purpose}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="เช่น สำหรับการสอน, งานวิจัย"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={borrowFormData.note}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="หมายเหตุเพิ่มเติม"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBorrowForm(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>ยืม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Form Modal */}
      {showReturnForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">คืนครุภัณฑ์</h2>
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกรายการยืม *
                </label>
                <select
                  value={returnFormData.borrowId}
                  onChange={(e) => setReturnFormData({ ...returnFormData, borrowId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สภาพครุภัณฑ์เมื่อคืน
                </label>
                <select
                  value={returnFormData.condition}
                  onChange={(e) => setReturnFormData({ ...returnFormData, condition: e.target.value as Asset['condition'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="GOOD">ดี</option>
                  <option value="DAMAGED">เสียหาย</option>
                  <option value="NEEDS_REPAIR">ต้องซ่อม</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุการคืน
                </label>
                <textarea
                  value={returnFormData.note}
                  onChange={(e) => setReturnFormData({ ...returnFormData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="สภาพการคืน, ปัญหาที่พบ"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  <span>คืน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow">
        {/* Table Info and Controls */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-700">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">แสดงต่อหน้า:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('assetNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>เลขครุภัณฑ์</span>
                    {getSortIcon('assetNumber')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>รายการ</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>หมวดหมู่</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center space-x-1">
                    <span>สถานที่</span>
                    {getSortIcon('location')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('condition')}
                >
                  <div className="flex items-center space-x-1">
                    <span>สภาพ</span>
                    {getSortIcon('condition')}
                  </div>
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
              {paginatedAssets.map((asset) => {
              const currentBorrow = asset.borrowHistory?.find(b => b.status === 'BORROWED');
              return (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.assetNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {asset.imageUrl && (
                        <div className="flex-shrink-0">
                          <SafeImage
                            src={asset.imageUrl}
                            alt={asset.name}
                            width={48}
                            height={48}
                            className="rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80"
                            onClick={() => setShowImageModal(asset.imageUrl || null)}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {asset.name}
                        </div>
                        {asset.brand && (
                          <div className="text-sm text-gray-500">
                            {asset.brand} {asset.model && `- ${asset.model}`}
                          </div>
                        )}
                         <div className="text-xs text-red-700">
                          {asset.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(asset.condition)}`}>
                      {getConditionText(asset.condition)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentBorrow ? (
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          ถูกยืม
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          โดย: {currentBorrow.user.name}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ว่าง
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {!currentBorrow && asset.condition !== 'DISPOSED' && asset.condition !== 'DAMAGED' && (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowBorrowForm(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors"
                          title="ยืมครุภัณฑ์"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setShowForm(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-colors"
                            title="แก้ไขครุภัณฑ์"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="ลบครุภัณฑ์"
                            disabled={!!currentBorrow}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
        <div className="lg:hidden">
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
              <div key={asset.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {asset.imageUrl && (
                    <div className="flex-shrink-0">
                      <SafeImage
                        src={asset.imageUrl}
                        alt={asset.name}
                        width={64}
                        height={64}
                        className="rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80"
                        onClick={() => setShowImageModal(asset.imageUrl || null)}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-gray-600">#{asset.assetNumber}</p>
                        {asset.brand && (
                          <p className="text-xs text-gray-500">
                            {asset.brand} {asset.model && `- ${asset.model}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {!currentBorrow && asset.condition !== 'DISPOSED' && asset.condition !== 'DAMAGED' && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowBorrowForm(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors"
                            title="ยืมครุภัณฑ์"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setShowForm(true);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-colors"
                              title="แก้ไขครุภัณฑ์"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="ลบครุภัณฑ์"
                              disabled={!!currentBorrow}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">หมวดหมู่:</span>
                        <span className="ml-1 text-gray-900">{asset.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">สถานที่:</span>
                        <span className="ml-1 text-gray-900">{asset.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">สภาพ:</span>
                        <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getConditionColor(asset.condition)}`}>
                          {getConditionText(asset.condition)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">สถานะ:</span>
                        {currentBorrow ? (
                          <div className="ml-1">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              ถูกยืม
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              โดย: {currentBorrow.user.name}
                            </div>
                          </div>
                        ) : (
                          <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ว่าง
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {asset.description && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">รายละเอียด:</span>
                        <p className="text-xs text-gray-700 mt-1">{asset.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                หน้า {currentPage} จาก {totalPages}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                
                {/* Page Numbers */}
                <div className="hidden sm:flex space-x-1">
                  {getPaginationRange().map((page, index) => (
                    <div key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page as number)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Mobile Page Info */}
                <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                  {currentPage} / {totalPages}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {paginatedAssets.length === 0 && !loading && (
          <div className="text-center py-12">
            {assets.length === 0 ? (
              <p className="text-gray-500">ยังไม่มีครุภัณฑ์ในระบบ</p>
            ) : (
              <div>
                <p className="text-gray-500">ไม่พบครุภัณฑ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
