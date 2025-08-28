// src/app/dashboard/consumables/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import ConsumableFormModal from './ConsumableFormModal';
import StockAdjustmentModal from './StockAdjustmentModal';

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

  const { user } = useAuthStore();
  const isStaff = user?.role === 'STAFF';

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
    if (current === 0) return { text: 'หมด', color: 'bg-red-100 text-red-800', icon: '🔴' };
    if (current <= min) return { text: 'ต่ำ', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
    return { text: 'ปกติ', color: 'bg-green-100 text-green-800', icon: '🟢' };
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
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📦 จัดการวัสดุสิ้นเปลือง</h1>
            <p className="text-orange-100">วัสดุที่ใช้แล้วหมดไป เช่น เครื่องเขียน กระดาษ</p>
          </div>
          
          {isStaff && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-orange-500 font-bold py-3 px-6 rounded-xl hover:bg-orange-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-xl">➕</span>
              เพิ่มวัสดุใหม่
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 ค้นหาวัสดุ..."
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
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-orange-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-700">⚠️ สต็อกต่ำ</span>
            </label>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">รายการทั้งหมด</p>
            <p className="text-2xl font-bold text-orange-600">{filteredConsumables.length}</p>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConsumables.map((consumable) => {
          const stockStatus = getStockStatus(consumable.currentStock, consumable.minStock);
          return (
            <div key={consumable.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-md transition-all duration-300 hover:transform hover:scale-105">
              {/* Material Image */}
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200">
                {consumable.imageUrl ? (
                  <Image
                    src={consumable.imageUrl}
                    alt={consumable.name}
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
                
                <div className={`${consumable.imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex items-center justify-center`}>
                  <div className="text-center text-orange-600">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <span className="text-3xl">📦</span>
                    </div>
                    <p className="text-sm font-medium">{consumable.category}</p>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-orange-700 text-xs rounded-full font-semibold shadow-sm">
                    📦 วัสดุสิ้นเปลือง
                  </span>
                </div>
                
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${stockStatus.color}`}>
                    {stockStatus.icon} {stockStatus.text}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{consumable.name}</h3>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    {consumable.category}
                  </span>
                  {consumable.location && (
                    <div className="mt-2 text-sm text-gray-500">
                      📍 {consumable.location}
                    </div>
                  )}
                </div>

                {/* Stock Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">สต็อกปัจจุบัน</span>
                    <span className="text-sm text-gray-600">ขั้นต่ำ: {consumable.minStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">{consumable.currentStock}</span>
                    <span className="text-sm text-gray-600">{consumable.unit}</span>
                  </div>
                </div>

                {/* Actions */}
                {isStaff ? (
                  <div className="space-y-2">
                    {/* ปุ่มปรับสต็อค */}
                    <button 
                      onClick={() => handleStockAdjust(consumable)}
                      className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      📦 ปรับสต็อค
                    </button>
                    
                    {/* ปุ่มแก้ไขและลบ */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(consumable)}
                        className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDelete(consumable.id)}
                        className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      📝 เบิกวัสดุ
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredConsumables.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-30">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบรายการวัสดุ</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory || showLowStock
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการวัสดุในระบบ'}
          </p>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && isStaff && (
        <ConsumableFormModal 
          onClose={handleModalClose}
          onSave={handleModalSave}
          editingConsumable={editingConsumable || undefined}
        />
      )}

      {isStockModalOpen && isStaff && adjustingConsumable && (
        <StockAdjustmentModal 
          onClose={handleStockModalClose}
          onSave={handleStockModalSave}
          consumable={adjustingConsumable}
        />
      )}
    </div>
  );
}
