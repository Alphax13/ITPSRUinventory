// src/app/dashboard/assets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import AssetFormModal from './AssetFormModal';
import {
  ComputerDesktopIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface FixedAsset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  condition: string;
  imageUrl?: string;
  description?: string;
  borrowHistory?: Array<{
    user: { name: string; email: string };
    borrowDate: string;
    expectedReturnDate?: string;
  }>;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [showBorrowed, setShowBorrowed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedCondition) {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    if (showBorrowed) {
      filtered = filtered.filter(item => item.borrowHistory && item.borrowHistory.length > 0);
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, selectedCategory, selectedCondition, showBorrowed]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบครุภัณฑ์นี้?')) return;
    
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAssets();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleModalSave = () => {
    fetchAssets();
    handleModalClose();
  };

  const getConditionInfo = (condition: string) => {
    switch (condition) {
      case 'GOOD': return { text: 'ดี', color: 'bg-green-100 text-green-700' };
      case 'DAMAGED': return { text: 'เสียหาย', color: 'bg-red-100 text-red-700' };
      case 'NEEDS_REPAIR': return { text: 'ต้องซ่อม', color: 'bg-amber-100 text-amber-700' };
      case 'DISPOSED': return { text: 'จำหน่าย', color: 'bg-slate-100 text-slate-600' };
      default: return { text: condition, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const getBorrowStatus = (asset: FixedAsset) => {
    if (asset.borrowHistory && asset.borrowHistory.length > 0) {
      return { text: 'กำลังยืม', color: 'bg-blue-100 text-blue-700', borrower: asset.borrowHistory[0].user.name };
    }
    return { text: 'ว่าง', color: 'bg-green-100 text-green-700', borrower: null };
  };

  const categories = [...new Set(assets.map(item => item.category))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">จัดการครุภัณฑ์</h1>
            <p className="text-sm text-slate-500 mt-0.5">อุปกรณ์ที่สามารถยืม-คืนได้ มีเลขกำกับ</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มครุภัณฑ์ใหม่
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาครุภัณฑ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">ทุกสภาพ</option>
              <option value="GOOD">ดี</option>
              <option value="NEEDS_REPAIR">ต้องซ่อม</option>
              <option value="DAMAGED">เสียหาย</option>
              <option value="DISPOSED">จำหน่าย</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBorrowed}
                onChange={(e) => setShowBorrowed(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700 flex items-center gap-1">
                <UserIcon className="h-4 w-4 text-slate-400" />
                ถูกยืมอยู่
              </span>
            </label>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">ครุภัณฑ์ทั้งหมด</p>
            <p className="text-2xl font-bold text-orange-600">{filteredAssets.length}</p>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map((asset) => {
          const conditionInfo = getConditionInfo(asset.condition);
          const borrowStatus = getBorrowStatus(asset);
          return (
            <div key={asset.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
              <div className="relative h-44 bg-slate-100">
                {asset.imageUrl ? (
                  <Image
                    src={asset.imageUrl}
                    alt={asset.name}
                    width={400}
                    height={176}
                    priority
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${asset.imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex items-center justify-center`}>
                  <div className="text-center text-slate-400">
                    <ComputerDesktopIcon className="w-12 h-12 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-medium">{asset.category}</p>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${conditionInfo.color}`}>{conditionInfo.text}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${borrowStatus.color}`}>{borrowStatus.text}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-semibold text-base text-slate-800 mb-0.5">{asset.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">เลขกำกับ: {asset.assetNumber}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">{asset.category}</span>
                    {asset.brand && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">{asset.brand}</span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5">
                  {asset.model && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">รุ่น:</span>
                      <span className="font-medium text-slate-700">{asset.model}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />ตำแหน่ง:</span>
                    <span className="font-medium text-slate-700">{asset.location}</span>
                  </div>
                  {borrowStatus.borrower && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ผู้ยืม:</span>
                      <span className="font-medium text-blue-600">{borrowStatus.borrower}</span>
                    </div>
                  )}
                </div>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <PencilSquareIcon className="h-4 w-4" />แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <TrashIcon className="h-4 w-4" />ลบ
                    </button>
                  </div>
                ) : (
                  !borrowStatus.borrower ? (
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                      ยืมครุภัณฑ์
                    </button>
                  ) : (
                    <div className="text-center text-sm text-slate-500 py-2 bg-slate-50 rounded-lg">ถูกยืมแล้ว</div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="text-center py-16">
          <ComputerDesktopIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">ไม่พบรายการครุภัณฑ์</h3>
          <p className="text-sm text-slate-500">
            {searchTerm || selectedCategory || selectedCondition || showBorrowed
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการครุภัณฑ์ในระบบ'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && isAdmin && (
        <AssetFormModal 
          onClose={handleModalClose}
          onSave={handleModalSave}
          editingAsset={editingAsset ? {
            ...editingAsset,
            purchaseDate: '',
            purchasePrice: ''
          } : undefined}
        />
      )}
    </div>
  );
}
