// src/app/dashboard/purchase-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface PurchaseItem {
  name: string;
  quantity: number;
  imageUrl?: string;
}

interface PurchaseRequest {
  id: string;
  requesterId: string;
  items: PurchaseItem[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    name: string;
  };
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    items: [{ name: '', quantity: 1, imageUrl: '' }],
    reason: '',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/purchase-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: user?.id,
          items: formData.items.filter(item => item.name.trim() !== ''),
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        setFormData({
          items: [{ name: '', quantity: 1, imageUrl: '' }],
          reason: '',
        });
        setShowForm(false);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, imageUrl: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'purchase-requests');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateItem(index, 'imageUrl', data.url);
      } else {
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รออนุมัติ';
      case 'APPROVED': return 'อนุมัติแล้ว';
      case 'REJECTED': return 'ปฏิเสธ';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🛒 คำขอจัดซื้อ</h1>
            <p className="text-blue-100">สร้างคำขอจัดซื้อวัสดุ อุปกรณ์ และครุภัณฑ์</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-500 font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            สร้างคำขอใหม่
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🛒 สร้างคำขอจัดซื้อใหม่</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  รายการที่ต้องการจัดซื้อ
                </label>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-2 mb-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="ชื่อสินค้า/วัสดุ"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                          required
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Image Upload Section */}
                      <div className="w-32">
                        {item.imageUrl ? (
                          <div className="relative">
                            <img
                              src={item.imageUrl}
                              alt="สินค้า"
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'imageUrl', '')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(index, file);
                              }}
                              className="hidden"
                              id={`image-${index}`}
                            />
                            <label
                              htmlFor={`image-${index}`}
                              className="cursor-pointer text-center p-1"
                            >
                              {uploadingImages[index] ? (
                                <div className="text-xs text-gray-500">
                                  <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                                  อัปโหลด...
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  <div className="text-lg mb-1">📷</div>
                                  เพิ่มรูป
                                </div>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="text-lg">➕</span>
                  เพิ่มรายการ
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  เหตุผลในการจัดซื้อ (ไม่บังคับ)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="เช่น สำหรับใช้ในการทำงาน, ทดแทนของเสีย"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-bold disabled:opacity-50 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      ส่งคำขอ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request List */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัสคำขอ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ขอ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รายการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{request.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requester?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {Array.isArray(request.items) && request.items.map((item: PurchaseItem, index: number) => (
                        <div key={index} className="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded-lg">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg border"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              จำนวน: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {request.reason || <span className="text-gray-400 italic">ไม่ได้ระบุ</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีคำขอจัดซื้อ</h3>
            <p className="text-gray-600">คลิกปุ่ม "สร้างคำขอใหม่" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}
