// src/app/dashboard/materials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MaterialFormModal from './MaterialFormModal';
import { useMaterialStore } from '@/stores/materialStore';
import { useAuthStore } from '@/stores/authStore';

export interface Material {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  isAsset: boolean;
  imageUrl?: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [materialUsage, setMaterialUsage] = useState<{ [key: string]: number }>({});

  const { user } = useAuthStore();
  const { isModalOpen, openModal, closeModal } = useMaterialStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchMaterials();
    if (isAdmin) {
      fetchMaterialUsage();
    }
  }, [isAdmin]);

  useEffect(() => {
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    if (showLowStock) {
      filtered = filtered.filter(material => material.currentStock <= material.minStock);
    }

    setFilteredMaterials(filtered);
  }, [materials, searchTerm, selectedCategory, showLowStock]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialUsage = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const transactions = await res.json();
        const usageCount: { [key: string]: number } = {};
        
        transactions.forEach((transaction: { materialId?: string }) => {
          if (transaction.materialId) {
            usageCount[transaction.materialId] = (usageCount[transaction.materialId] || 0) + 1;
          }
        });
        
        setMaterialUsage(usageCount);
      }
    } catch (error) {
      console.error('Failed to fetch material usage:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }

    const usageCount = materialUsage[id] || 0;
    const confirmMessage = usageCount > 0 
      ? `คุณแน่ใจหรือไม่ที่จะลบรายการนี้?\n\n📊 วัสดุนี้มีประวัติการใช้งาน ${usageCount} ครั้ง\n✅ ประวัติจะยังคงเก็บไว้ในระบบ\n❌ แต่จะไม่สามารถเพิ่มรายการใหม่ได้`
      : 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้?\n\n⚠️ วัสดุนี้ไม่มีประวัติการใช้งาน จะถูกลบอย่างถาวร';

    if (window.confirm(confirmMessage)) {
      try {
        const res = await fetch(`/api/materials/${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          const result = await res.json();
          fetchMaterials(); // Refresh the list
          alert(`✅ ${result.message}\n\n💡 ${result.details}`);
        } else {
          // แสดงข้อความข้อผิดพลาดจาก API
          const errorData = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาดในการลบ' }));
          alert('❌ ' + errorData.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { color: 'text-red-600 bg-red-50', text: 'หมด', icon: '❌' };
    if (current <= min) return { color: 'text-yellow-600 bg-yellow-50', text: 'ต่ำ', icon: '⚠️' };
    return { color: 'text-green-600 bg-green-50', text: 'ปกติ', icon: '✅' };
  };

  const categories = [...new Set(materials.map(m => m.category))];

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">📦</span>
            {isAdmin ? 'จัดการวัสดุ' : 'รายการวัสดุ'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin 
              ? 'เพิ่ม แก้ไข และจัดการรายการวัสดุทั้งหมด' 
              : 'ดูรายการวัสดุที่มีในระบบ'
            }
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => openModal()} 
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:transform hover:scale-105 flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            เพิ่มวัสดุใหม่
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อวัสดุหรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
          >
            <option value="">🏷️ หมวดหมู่ทั้งหมด</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Low Stock Filter */}
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              showLowStock
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-transparent'
            }`}
          >
            <span>⚠️</span>
            สต็อกต่ำ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-orange-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{materials.length}</p>
            <p className="text-sm text-gray-600">รายการทั้งหมด</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {materials.filter(m => m.currentStock <= m.minStock).length}
            </p>
            <p className="text-sm text-gray-600">สต็อกต่ำ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {materials.filter(m => m.currentStock === 0).length}
            </p>
            <p className="text-sm text-gray-600">หมดสต็อก</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{categories.length}</p>
            <p className="text-sm text-gray-600">หมวดหมู่</p>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => {
          const stockStatus = getStockStatus(material.currentStock, material.minStock);
          return (
            <div key={material.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-md transition-all duration-300 hover:transform hover:scale-105">
              {/* Material Image */}
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200">
                {material.imageUrl ? (
                  <Image
                    src={material.imageUrl}
                    alt={material.name}
                    width={400}
                    height={192}
                    priority
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // ถ้าโหลดรูปไม่ได้ จะแสดง placeholder
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {/* Placeholder when no image */}
                <div className={`${material.imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex items-center justify-center`}>
                  <div className="text-center text-orange-600">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <span className="text-2xl">
                        {material.isAsset ? '🏷️' : '📦'}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{material.category}</p>
                  </div>
                </div>
                {/* Category badge overlay */}
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-orange-700 text-xs rounded-full font-semibold shadow-sm">
                    {material.isAsset ? '🏷️ ครุภัณฑ์' : '📦 วัสดุ'}
                  </span>
                </div>
                {/* Stock status badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${stockStatus.color}`}>
                    {stockStatus.icon} {stockStatus.text}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{material.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">รหัส: {material.code}</p>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    {material.category}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">สต็อกปัจจุบัน</span>
                    <span className="text-sm text-gray-600">
                      ขั้นต่ำ: {material.minStock}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {material.currentStock}
                    </span>
                    <span className="text-sm text-gray-600">
                      {material.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin ? (
                  <div className="space-y-2">
                    {/* Usage info */}
                    {materialUsage[material.id] > 0 && (
                      <div className="text-xs text-center py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                        📊 มีประวัติการใช้งาน {materialUsage[material.id]} ครั้ง
                        <br />
                        <span className="text-xs text-gray-600">ประวัติจะถูกเก็บไว้หลังลบ</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(material)} 
                        className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDelete(material.id)} 
                        className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                        title={materialUsage[material.id] > 0 
                          ? `ลบรายการ (ประวัติ ${materialUsage[material.id]} รายการจะถูกเก็บไว้)` 
                          : 'ลบรายการ'
                        }
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500">
                      👁️ ดูข้อมูลเท่านั้น
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-30">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบรายการวัสดุ</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory || showLowStock
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการวัสดุในระบบ'
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && isAdmin && (
        <MaterialFormModal 
          onSave={() => {
            closeModal();
            fetchMaterials();
          }} 
        />
      )}
    </div>
  );
}