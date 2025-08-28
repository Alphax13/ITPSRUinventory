// src/app/dashboard/consumables/StockAdjustmentModal.tsx
'use client';

import { useState } from 'react';

interface StockAdjustmentModalProps {
  onClose: () => void;
  onSave: () => void;
  consumable: {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
  };
}

export default function StockAdjustmentModal({ onClose, onSave, consumable }: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (quantity <= 0) {
        setError('จำนวนต้องมากกว่า 0');
        setLoading(false);
        return;
      }

      if (adjustmentType === 'subtract' && quantity > consumable.currentStock) {
        setError('จำนวนที่หักไม่สามารถเกินจำนวนในสต็อค');
        setLoading(false);
        return;
      }

      const adjustment = adjustmentType === 'add' ? quantity : -quantity;

      const response = await fetch(`/api/consumables/${consumable.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment,
          reason: reason || null,
        }),
      });

      if (response.ok) {
        onSave();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.error || 'เกิดข้อผิดพลาดในการปรับสต็อค');
        } else {
          setError('เกิดข้อผิดพลาดในการปรับสต็อค');
        }
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-orange-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📦 ปรับสต็อค
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h3 className="font-semibold text-gray-800">{consumable.name}</h3>
          <p className="text-sm text-gray-600">
            สต็อคปัจจุบัน: <span className="font-bold text-orange-600">{consumable.currentStock} {consumable.unit}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* ประเภทการปรับ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทการปรับสต็อค</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="add"
                  checked={adjustmentType === 'add'}
                  onChange={() => setAdjustmentType('add')}
                  className="mr-2"
                />
                <span className="text-green-600">➕ เพิ่มสต็อค</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="subtract"
                  checked={adjustmentType === 'subtract'}
                  onChange={() => setAdjustmentType('subtract')}
                  className="mr-2"
                />
                <span className="text-red-600">➖ หักสต็อค</span>
              </label>
            </div>
          </div>

          {/* จำนวน */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">จำนวน</label>
            <input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} 
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
              min="1"
              max={adjustmentType === 'subtract' ? consumable.currentStock : undefined}
              required 
            />
          </div>

          {/* เหตุผล */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">เหตุผล (ไม่บังคับ)</label>
            <input 
              type="text" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
              placeholder="เช่น รับของเข้า, เสียหาย, หมดอายุ"
            />
          </div>

          {/* ผลลัพธ์ */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              สต็อคหลังการปรับ: <span className="font-bold text-gray-800">
                {adjustmentType === 'add' 
                  ? consumable.currentStock + quantity 
                  : consumable.currentStock - quantity} {consumable.unit}
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                adjustmentType === 'add'
                  ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white'
                  : 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'กำลังบันทึก...' : adjustmentType === 'add' ? '➕ เพิ่มสต็อค' : '➖ หักสต็อค'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
