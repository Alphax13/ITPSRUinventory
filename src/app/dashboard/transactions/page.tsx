'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import QRScanner from '@/components/QRScanner';

interface Material {
  id: string;
  name: string;
  code: string;
  currentStock: number;
  unit: string;
  isAsset: boolean;
  category: string;
}

export default function TransactionPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('OUT');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Filter materials based on search term
    const filtered = materials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);

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

  const handleScan = (result: string) => {
    if (!result) {
      setShowScanner(false);
      return;
    }

    // Parse QR code result
    let materialCode = result;
    if (result.startsWith('MATERIAL:')) {
      materialCode = result.replace('MATERIAL:', '');
    } else if (result.startsWith('ASSET:')) {
      materialCode = result.replace('ASSET:', '');
    }

    // Find material by code
    const material = materials.find(m => 
      m.code.toLowerCase() === materialCode.toLowerCase()
    );

    if (material) {
      setSelectedMaterial(material);
      setSearchTerm(material.code);
      setShowScanner(false);
    } else {
      alert(`ไม่พบวัสดุด้วยรหัส: ${materialCode}`);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    setSearchTerm(`${material.code} - ${material.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !user) {
      alert('กรุณาเลือกวัสดุ');
      return;
    }

    if (transactionType === 'OUT' && quantity > selectedMaterial.currentStock) {
      alert('จำนวนที่เบิกมากกว่าสต็อกที่มี');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          materialId: selectedMaterial.id,
          quantity,
          reason,
          type: transactionType,
        }),
      });

      if (res.ok) {
        alert(`${transactionType === 'OUT' ? 'เบิกวัสดุ' : 'เพิ่มวัสดุ'}สำเร็จ!`);
        // Reset form
        setSelectedMaterial(null);
        setQuantity(1);
        setReason('');
        setSearchTerm('');
        // Refresh material list
        fetchMaterials();
      } else {
        const errorData = await res.json();
        alert(`ดำเนินการไม่สำเร็จ: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">เบิก-จ่ายวัสดุ</h1>
        <p className="text-gray-600">สแกน QR Code หรือค้นหาวัสดุที่ต้องการ</p>
      </div>

      {/* Transaction Type Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setTransactionType('OUT')}
            className={`px-4 py-2 rounded-lg font-medium ${
              transactionType === 'OUT'
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            📤 เบิกออก
          </button>
          {user?.role === 'STAFF' && (
            <button
              onClick={() => setTransactionType('IN')}
              className={`px-4 py-2 rounded-lg font-medium ${
                transactionType === 'IN'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              📥 เพิ่มเข้า
            </button>
          )}
        </div>

        {/* Search and Scan */}
        <div className="flex space-x-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัส หรือชื่อวัสดุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            📷 สแกน QR
          </button>
        </div>

        {/* Search Results */}
        {searchTerm && filteredMaterials.length > 0 && !selectedMaterial && (
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mb-4">
            {filteredMaterials.slice(0, 5).map((material) => (
              <div
                key={material.id}
                onClick={() => handleMaterialSelect(material)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-500">
                      {material.code} • {material.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      material.currentStock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {material.currentStock} {material.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Material Info */}
        {selectedMaterial && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900">{selectedMaterial.name}</h3>
            <p className="text-blue-700 text-sm">
              รหัส: {selectedMaterial.code} • หมวดหมู่: {selectedMaterial.category}
            </p>
            <p className="text-blue-700 text-sm">
              สต็อกคงเหลือ: <span className="font-medium">{selectedMaterial.currentStock} {selectedMaterial.unit}</span>
            </p>
          </div>
        )}

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              จำนวน ({selectedMaterial?.unit || 'หน่วย'})
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max={transactionType === 'OUT' ? selectedMaterial?.currentStock : undefined}
              required
              disabled={!selectedMaterial}
            />
            {transactionType === 'OUT' && selectedMaterial && (
              <p className="text-sm text-gray-500 mt-1">
                สต็อกคงเหลือ: {selectedMaterial.currentStock} {selectedMaterial.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              เหตุผล {transactionType === 'OUT' ? 'การเบิก' : 'การเพิ่ม'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={`ระบุเหตุผล${transactionType === 'OUT' ? 'การเบิก' : 'การเพิ่ม'}วัสดุ...`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!selectedMaterial || submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {submitting 
              ? 'กำลังดำเนินการ...' 
              : `${transactionType === 'OUT' ? '📤 เบิกวัสดุ' : '📥 เพิ่มวัสดุ'}`
            }
          </button>
        </form>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isActive={showScanner}
        onScan={handleScan}
        onError={(error) => {
          alert(error);
          setShowScanner(false);
        }}
      />
    </div>
  );
}