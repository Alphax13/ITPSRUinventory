'use client';

import { useState, useEffect, useRef } from 'react';
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
  imageUrl?: string;
}

interface CartItem {
  id: string;
  material: Material;
  quantity: number;
  reason: string;
}

export default function TransactionPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('OUT');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Filter materials based on search term
    if (searchTerm) {
      console.log('Filtering materials with term:', searchTerm);
      console.log('Total materials to filter:', materials.length);
    }
    
    const filtered = materials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (searchTerm) {
      console.log('Filtered results:', filtered.length);
      console.log('First 3 filtered materials:', filtered.slice(0, 3));
    }
    
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMaterials = async () => {
    try {
      console.log('Fetching materials...');
      const res = await fetch('/api/materials');
      if (res.ok) {
        const data = await res.json();
        console.log('Materials data received:', data);
        console.log('Number of materials:', data.length);
        setMaterials(data);
      } else {
        console.error('Failed to fetch materials, status:', res.status);
        const errorData = await res.json();
        console.error('Error data:', errorData);
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
      setShowAddModal(true);
      setShowScanner(false);
    } else {
      alert(`ไม่พบวัสดุด้วยรหัส: ${materialCode}`);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    setSearchTerm(`${material.code} - ${material.name}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setShowAddModal(true);
  };

  const addToCart = () => {
    if (!selectedMaterial) return;

    const existingItemIndex = cart.findIndex(item => item.material.id === selectedMaterial.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      const existingReason = updatedCart[existingItemIndex].reason;
      const newReason = reason.trim() || `${transactionType === 'OUT' ? 'เบิกใช้งาน' : 'เพิ่มสต็อก'}ทั่วไป`;
      
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        reason: newReason !== `${transactionType === 'OUT' ? 'เบิกใช้งาน' : 'เพิ่มสต็อก'}ทั่วไป` ? newReason : existingReason
      };
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now().toString(),
        material: selectedMaterial,
        quantity,
        reason: reason.trim() || `${transactionType === 'OUT' ? 'เบิกใช้งาน' : 'เพิ่มสต็อก'}ทั่วไป`
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setSelectedMaterial(null);
    setQuantity(1);
    setReason('');
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    setShowAddModal(false);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId: string, field: 'quantity' | 'reason', value: number | string) => {
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleBatchSubmit = async () => {
    if (!user || cart.length === 0) {
      alert('กรุณาเพิ่มรายการวัสดุในตะกร้า');
      return;
    }

    // Validate stock for OUT transactions
    if (transactionType === 'OUT') {
      for (const item of cart) {
        if (item.quantity > item.material.currentStock) {
          alert(`วัสดุ "${item.material.name}" มีจำนวนในตะกร้ามากกว่าสต็อกที่มี`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      console.log('Submitting batch transaction with cart:', cart);
      console.log('Transaction type:', transactionType);
      console.log('User ID:', user.id);

      // Try alternative batch endpoint first
      const res = await fetch('/api/transactions/batch-alternative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          transactions: cart.map(item => ({
            materialId: item.material.id,
            quantity: item.quantity,
            reason: item.reason || `${transactionType === 'OUT' ? 'เบิกใช้งาน' : 'เพิ่มสต็อก'}ทั่วไป`,
            type: transactionType,
          })),
        }),
      });

      if (res.ok || res.status === 207) { // Success or Partial Success
        const data = await res.json();
        
        if (data.failed && data.failed > 0) {
          alert(`ดำเนินการเสร็จสิ้น: สำเร็จ ${data.successful}/${data.totalRequested} รายการ\n\nรายการที่ล้มเหลว:\n${data.errors.map((err: any) => `- ${err.error}`).join('\n')}`);
        } else {
          alert(`${transactionType === 'OUT' ? 'เบิกวัสดุ' : 'เพิ่มวัสดุ'}ทั้งหมด ${data.successful} รายการสำเร็จ!`);
        }
        
        setCart([]);
        fetchMaterials(); // Refresh material list
      } else {
        const errorData = await res.json();
        console.error('Batch transaction failed:', errorData);
        alert(`ดำเนินการไม่สำเร็จ: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting batch transaction:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">เบิก-จ่ายวัสดุ</h1>
        <p className="text-gray-600">เพิ่มวัสดุหลายรายการในตะกร้าแล้วทำรายการพร้อมกัน</p>
        {materials.length > 0 && (
          <p className="text-sm text-blue-600 mt-1">
            📦 โหลดข้อมูลวัสดุแล้ว {materials.length} รายการ
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Material Selection */}
        <div className="lg:col-span-2 space-y-4">
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
              {user?.role === 'ADMIN' && (
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
              <div className="flex-1 relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="ค้นหาด้วยรหัส หรือชื่อวัสดุ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    if (searchTerm) setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (!showDropdown || filteredMaterials.length === 0) return;
                    
                    switch (e.key) {
                      case 'ArrowDown':
                        e.preventDefault();
                        setSelectedIndex(prev => 
                          prev < Math.min(filteredMaterials.length - 1, 7) ? prev + 1 : prev
                        );
                        break;
                      case 'ArrowUp':
                        e.preventDefault();
                        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                        break;
                      case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0) {
                          handleMaterialSelect(filteredMaterials[selectedIndex]);
                        }
                        break;
                      case 'Escape':
                        setShowDropdown(false);
                        setSelectedIndex(-1);
                        break;
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Auto-complete Dropdown */}
                {showDropdown && searchTerm && filteredMaterials.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {filteredMaterials.slice(0, 8).map((material, index) => (
                      <div
                        key={material.id}
                        onClick={() => handleMaterialSelect(material)}
                        className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          index === selectedIndex 
                            ? 'bg-blue-100 border-blue-200' 
                            : 'hover:bg-blue-50'
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${index === Math.min(filteredMaterials.length - 1, 7) ? 'rounded-b-lg' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Material Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {material.imageUrl ? (
                              <img
                                src={material.imageUrl}
                                alt={material.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">📦</div>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
                                📦
                              </div>
                            )}
                          </div>
                          
                          {/* Material Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{material.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {material.code} • {material.category}
                            </p>
                          </div>
                          
                          {/* Stock Info */}
                          <div className="text-right flex-shrink-0">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              material.currentStock > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {material.currentStock > 0 ? '✅' : '❌'} {material.currentStock} {material.unit}
                            </div>
                            {material.currentStock > 0 && material.currentStock <= 10 && (
                              <p className="text-xs text-orange-500 mt-1">⚠️ สต็อกต่ำ</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show more indicator */}
                    {filteredMaterials.length > 8 && (
                      <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 rounded-b-lg border-t">
                        📋 แสดง 8 จาก {filteredMaterials.length} รายการ - พิมพ์เพิ่มเติมเพื่อกรอง
                      </div>
                    )}
                  </div>
                )}
                
                {/* No results message */}
                {showDropdown && searchTerm && filteredMaterials.length === 0 && materials.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-2">🔍</div>
                      <p>ไม่พบวัสดุที่ค้นหา</p>
                      <p className="text-sm">ลองใช้คำค้นหาอื่น</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2"
              >
                <span>📷</span>
                <span>สแกน QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🛒 ตะกร้าวัสดุ
              </h3>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {cart.length} รายการ ({getTotalItems()} ชิ้น)
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🛒</div>
                <p className="font-medium">ยังไม่มีรายการในตะกร้า</p>
                <div className="text-sm mt-2 space-y-1">
                  <p>💡 <strong>วิธีใช้:</strong></p>
                  <p>🔍 ค้นหาชื่อหรือรหัสวัสดุ</p>
                  <p>📱 สแกน QR Code</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{item.material.name}</p>
                        <p className="text-xs text-gray-500">{item.material.code}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ❌
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">จำนวน</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="1"
                          max={transactionType === 'OUT' ? item.material.currentStock : undefined}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          สต็อก: {item.material.currentStock} {item.material.unit}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">เหตุผล <span className="text-gray-400">(ไม่จำเป็น)</span></label>
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => updateCartItem(item.id, 'reason', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ระบุเหตุผล (ไม่จำเป็น)..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleBatchSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {submitting 
                    ? 'กำลังดำเนินการ...' 
                    : `${transactionType === 'OUT' ? '📤 เบิกวัสดุ' : '📥 เพิ่มวัสดุ'} (${cart.length} รายการ)`
                  }
                </button>
                
                <button
                  onClick={() => setCart([])}
                  disabled={submitting}
                  className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🗑️ ล้างตะกร้า
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showAddModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มลงตะกร้า</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900">{selectedMaterial.name}</h4>
              <p className="text-blue-700 text-sm">
                รหัส: {selectedMaterial.code} • หมวดหมู่: {selectedMaterial.category}
              </p>
              <p className="text-blue-700 text-sm">
                สต็อกคงเหลือ: <span className="font-medium">{selectedMaterial.currentStock} {selectedMaterial.unit}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  จำนวน ({selectedMaterial.unit})
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max={transactionType === 'OUT' ? selectedMaterial.currentStock : undefined}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  เหตุผล <span className="text-gray-500 text-sm font-normal">(ไม่จำเป็น)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="ระบุเหตุผล (ไม่จำเป็น)..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedMaterial(null);
                  setQuantity(1);
                  setReason('');
                  setSearchTerm('');
                  setShowDropdown(false);
                  setSelectedIndex(-1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={addToCart}
                disabled={!selectedMaterial}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

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