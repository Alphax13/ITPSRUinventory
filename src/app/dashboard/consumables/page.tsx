// src/app/dashboard/consumables/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import ConsumableFormModal from './ConsumableFormModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import WithdrawModal from './WithdrawModal';
import {
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

export interface ConsumableMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  location?: string;
  imageUrl?: string;
  description?: string;
}

export default function ConsumablesPage() {
  const [consumables, setConsumables] = useState<ConsumableMaterial[]>([]);
  const [filteredConsumables, setFilteredConsumables] = useState<ConsumableMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<ConsumableMaterial | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [adjustingConsumable, setAdjustingConsumable] = useState<ConsumableMaterial | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawingConsumable, setWithdrawingConsumable] = useState<ConsumableMaterial | null>(null);


  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const handleWithdraw = (consumable: ConsumableMaterial) => {
    setWithdrawingConsumable(consumable);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawModalClose = () => {
    setIsWithdrawModalOpen(false);
    setWithdrawingConsumable(null);
  };

  const handleWithdrawModalSave = () => {
    fetchConsumables();
    handleWithdrawModalClose();
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  useEffect(() => {
    let filtered = consumables;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (showLowStock) {
      filtered = filtered.filter(item => item.currentStock <= item.minStock);
    }

    setFilteredConsumables(filtered);
  }, [consumables, searchTerm, selectedCategory, showLowStock]);

  const fetchConsumables = async () => {
    try {
      const response = await fetch('/api/consumables');
      if (response.ok) {
        const data = await response.json();
        setConsumables(data);
      }
    } catch (error) {
      console.error('Error fetching consumables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;
    
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchConsumables();
      }
    } catch (error) {
      console.error('Error deleting consumable:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleEdit = (consumable: ConsumableMaterial) => {
    setEditingConsumable(consumable);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingConsumable(null);
  };

  const handleModalSave = () => {
    fetchConsumables();
    handleModalClose();
  };

  const handleStockAdjust = (consumable: ConsumableMaterial) => {
    setAdjustingConsumable(consumable);
    setIsStockModalOpen(true);
  };

  const handleStockModalClose = () => {
    setIsStockModalOpen(false);
    setAdjustingConsumable(null);
  };

  const handleStockModalSave = () => {
    fetchConsumables();
    handleStockModalClose();
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { text: 'หมด', color: 'bg-red-100 text-red-700' };
    if (current <= min) return { text: 'ต่ำ', color: 'bg-amber-100 text-amber-700' };
    return { text: 'ปกติ', color: 'bg-green-100 text-green-700' };
  };

  const categories = [...new Set(consumables.map(item => item.category))];

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
            <h1 className="text-xl font-bold text-slate-800">จัดการวัสดุสิ้นเปลือง</h1>
            <p className="text-sm text-slate-500 mt-0.5">วัสดุที่ใช้แล้วหมดไป เช่น เครื่องเขียน กระดาษ</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มวัสดุใหม่
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาวัสดุ..."
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

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                สต็อกต่ำ
              </span>
            </label>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">รายการทั้งหมด</p>
            <p className="text-2xl font-bold text-orange-600">{filteredConsumables.length}</p>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConsumables.map((consumable) => {
          const stockStatus = getStockStatus(consumable.currentStock, consumable.minStock);
          return (
            <div key={consumable.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
              {/* Material Image */}
              <div className="relative h-44 bg-slate-100">
                {consumable.imageUrl ? (
                  <Image
                    src={consumable.imageUrl}
                    alt={consumable.name}
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

                <div className={`${consumable.imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex items-center justify-center`}>
                  <div className="text-center text-slate-400">
                    <CubeIcon className="w-12 h-12 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-medium">{consumable.category}</p>
                  </div>
                </div>

                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-semibold text-base text-slate-800 mb-1">{consumable.name}</h3>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    {consumable.category}
                  </span>
                  {consumable.location && (
                    <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {consumable.location}
                    </div>
                  )}
                </div>

                {/* Stock Info */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">สต็อกปัจจุบัน</p>
                    <p className="text-xl font-bold text-slate-800">{consumable.currentStock} <span className="text-sm font-normal text-slate-500">{consumable.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">ขั้นต่ำ</p>
                    <p className="text-sm font-semibold text-slate-600">{consumable.minStock} {consumable.unit}</p>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStockAdjust(consumable)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      <AdjustmentsHorizontalIcon className="h-4 w-4" />
                      ปรับสต็อค
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(consumable)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(consumable.id)}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    onClick={() => handleWithdraw(consumable)}
                  >
                    เบิกวัสดุ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredConsumables.length === 0 && (
        <div className="text-center py-16">
          <CubeIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">ไม่พบรายการวัสดุ</h3>
          <p className="text-sm text-slate-500">
            {searchTerm || selectedCategory || showLowStock
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการวัสดุในระบบ'}
          </p>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && isAdmin && (
        <ConsumableFormModal 
          onClose={handleModalClose}
          onSave={handleModalSave}
          editingConsumable={editingConsumable || undefined}
        />
      )}

      {isStockModalOpen && isAdmin && adjustingConsumable && (
        <StockAdjustmentModal 
          onClose={handleStockModalClose}
          onSave={handleStockModalSave}
          consumable={adjustingConsumable}
        />
      )}

      {isWithdrawModalOpen && withdrawingConsumable && (
        <WithdrawModal
          consumable={withdrawingConsumable}
          onClose={handleWithdrawModalClose}
          onSave={handleWithdrawModalSave}
        />
      )}
    </div>
  );
}
