// src/app/dashboard/assets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import AssetFormModal from './AssetFormModal';

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
      case 'GOOD': return { text: 'ดี', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'DAMAGED': return { text: 'เสียหาย', color: 'bg-red-100 text-red-800', icon: '❌' };
      case 'NEEDS_REPAIR': return { text: 'ต้องซ่อม', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
      case 'DISPOSED': return { text: 'จำหน่าย', color: 'bg-gray-100 text-gray-800', icon: '🗑️' };
      default: return { text: condition, color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  const getBorrowStatus = (asset: FixedAsset) => {
    if (asset.borrowHistory && asset.borrowHistory.length > 0) {
      return { 
        text: 'กำลังยืม', 
        color: 'bg-blue-100 text-blue-800', 
        icon: '👤',
        borrower: asset.borrowHistory[0].user.name
      };
    }
    return { 
      text: 'ว่าง', 
      color: 'bg-green-100 text-green-800', 
      icon: '✅',
      borrower: null
    };
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏷️ จัดการครุภัณฑ์</h1>
            <p className="text-orange-100">อุปกรณ์ที่สามารถยืม-คืนได้ มีเลขกำกับ</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-orange-500 font-bold py-3 px-6 rounded-xl hover:bg-orange-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-xl">➕</span>
              เพิ่มครุภัณฑ์ใหม่
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 ค้นหาครุภัณฑ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
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
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                className="rounded border-orange-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-700">👤 กำลังถูกยืม</span>
            </label>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">ครุภัณฑ์ทั้งหมด</p>
            <p className="text-2xl font-bold text-orange-600">{filteredAssets.length}</p>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const conditionInfo = getConditionInfo(asset.condition);
          const borrowStatus = getBorrowStatus(asset);
          
          return (
            <div key={asset.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-md transition-all duration-300 hover:transform hover:scale-105">
              {/* Asset Image */}
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200">
                {asset.imageUrl ? (
                  <Image
                    src={asset.imageUrl}
                    alt={asset.name}
                    width={400}
                    height={192}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                <div className={`${asset.imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex items-center justify-center`}>
                  <div className="text-center text-orange-600">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <span className="text-3xl">🏷️</span>
                    </div>
                    <p className="text-sm font-medium">{asset.category}</p>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-orange-700 text-xs rounded-full font-semibold shadow-sm">
                    🏷️ ครุภัณฑ์
                  </span>
                </div>
                
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${conditionInfo.color}`}>
                    {conditionInfo.icon} {conditionInfo.text}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${borrowStatus.color}`}>
                    {borrowStatus.icon} {borrowStatus.text}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">เลขกำกับ: {asset.assetNumber}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                      {asset.category}
                    </span>
                    {asset.brand && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {asset.brand}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  {asset.model && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">รุ่น:</span>
                      <span className="text-sm font-medium">{asset.model}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ตำแหน่ง:</span>
                    <span className="text-sm font-medium">{asset.location}</span>
                  </div>
                  {borrowStatus.borrower && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ผู้ยืม:</span>
                      <span className="text-sm font-medium text-blue-600">{borrowStatus.borrower}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(asset)}
                      className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button 
                      onClick={() => handleDelete(asset.id)}
                      className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {!borrowStatus.borrower ? (
                      <button 
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                      >
                        📋 ยืมครุภัณฑ์
                      </button>
                    ) : (
                      <div className="flex-1 text-center text-sm text-gray-500 py-2">
                        🔒 ถูกยืมแล้ว
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-30">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบรายการครุภัณฑ์</h3>
          <p className="text-gray-600">
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
