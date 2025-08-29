import { useState } from 'react';
import { ConsumableMaterial } from './page';
import { useAuthStore } from '@/stores/authStore';

interface WithdrawModalProps {
  consumable: ConsumableMaterial;
  onClose: () => void;
  onSave: () => void;
}

export default function WithdrawModal({ consumable, onClose, onSave }: WithdrawModalProps) {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const { user } = useAuthStore();

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');
    if (amount < 1) {
      setError('จำนวนต้องมากกว่า 0');
      setLoading(false);
      return;
    }
    if (amount > consumable.currentStock) {
      setError('จำนวนเบิกมากกว่าสต็อกที่มี');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/consumables/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: consumable.id,
          amount,
          userId: user?.id,
          note: note || `เบิกวัสดุ ${consumable.name}`,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'เบิกวัสดุไม่สำเร็จ');
      }
      
      // Show success message if available
      if (data.message) {
        alert(data.message);
      }
      
      onSave();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">📝 เบิกวัสดุ: {consumable.name}</h2>
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">สต็อกคงเหลือ: <span className="font-bold">{consumable.currentStock} {consumable.unit}</span></div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่ต้องการเบิก</label>
            <input
              type="number"
              min={1}
              max={consumable.currentStock}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="จำนวนที่ต้องการเบิก"
            />
            <div className="text-xs text-gray-400 mt-1">* จำนวนต้องไม่เกินสต็อก</div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ไม่บังคับ)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="เช่น สำหรับใช้ในห้องเรียน, งานโครงการ"
            />
          </div>
          
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleWithdraw}
            className="px-4 py-2 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600"
            disabled={loading}
          >
            {loading ? 'กำลังเบิก...' : 'ยืนยันเบิก'}
          </button>
        </div>
      </div>
    </div>
  );
}
