// src/app/dashboard/materials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MaterialFormModal from './MaterialFormModal';
import { useMaterialStore } from '@/stores/materialStore';
import { useAuthStore } from '@/stores/authStore';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
    if (current === 0) return { color: 'bg-red-50 text-red-700 border border-red-200', text: 'หมด' };
    if (current <= min) return { color: 'bg-amber-50 text-amber-700 border border-amber-200', text: 'ต่ำ' };
    return { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', text: 'ปกติ' };
  };

  const categories = [...new Set(materials.map(m => m.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isAdmin ? 'จัดการวัสดุ' : 'รายการวัสดุ'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin ? 'เพิ่ม แก้ไข และจัดการรายการวัสดุทั้งหมด' : 'ดูรายการวัสดุที่มีในระบบ'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              เพิ่มวัสดุใหม่
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">รายการทั้งหมด</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{materials.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">สต็อกต่ำ</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{materials.filter(m => m.currentStock <= m.minStock && m.currentStock > 0).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">หมดสต็อก</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{materials.filter(m => m.currentStock === 0).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">หมวดหมู่</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{categories.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัสดุหรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="lg:w-44 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              showLowStock
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            สต็อกต่ำ
          </button>
          {(searchTerm || selectedCategory || showLowStock) && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory(''); setShowLowStock(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((material) => {
          const stockStatus = getStockStatus(material.currentStock, material.minStock);
          return (
            <div key={material.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Material Image */}
              <div className="relative h-44 bg-slate-100">
                {material.imageUrl ? (
                  <Image
                    src={material.imageUrl}
                    alt={material.name}
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
                <div className={`${material.imageUrl ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}>
                  <ArchiveBoxIcon className="w-12 h-12 text-slate-300" />
                </div>
                {/* Badges */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 bg-white/90 text-slate-600 text-xs rounded-full font-medium shadow-sm border border-slate-200">
                    {material.isAsset ? 'ครุภัณฑ์' : 'วัสดุ'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-800 leading-snug">{material.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">รหัส: {material.code}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{material.category}</span>
                </div>

                {/* Stock Info */}
                <div className="bg-slate-50 rounded-xl p-3.5 mb-4">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>สต็อกปัจจุบัน</span>
                    <span>ขั้นต่ำ: {material.minStock} {material.unit}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-slate-800">{material.currentStock}</span>
                    <span className="text-sm text-slate-500">{material.unit}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        material.currentStock === 0 ? 'bg-red-500' :
                        material.currentStock <= material.minStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, material.minStock > 0 ? (material.currentStock / (material.minStock * 2)) * 100 : 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                {isAdmin ? (
                  <div className="space-y-2">
                    {materialUsage[material.id] > 0 && (
                      <p className="text-xs text-center text-slate-500 bg-slate-50 rounded-lg py-1.5 border border-slate-200">
                        ประวัติการใช้งาน {materialUsage[material.id]} ครั้ง
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(material)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-medium py-2 px-3 rounded-xl text-sm transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-medium py-2 px-3 rounded-xl text-sm transition-colors"
                        title={materialUsage[material.id] > 0 ? `ลบ (ประวัติ ${materialUsage[material.id]} รายการถูกเก็บไว้)` : 'ลบรายการ'}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-1">ดูข้อมูลเท่านั้น</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-16">
          <ArchiveBoxIcon className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-medium text-slate-800">ไม่พบรายการวัสดุ</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || selectedCategory || showLowStock
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการวัสดุในระบบ'}
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