// src/app/dashboard/purchase-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface PurchaseItem {
  name: string;
  quantity: number;
  estimatedPrice: number;
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

  const [formData, setFormData] = useState({
    items: [{ name: '', quantity: 1, estimatedPrice: 0 }],
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
    setLoading(true);

    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: formData.items.filter(item => item.name.trim() !== ''),
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        setFormData({
          items: [{ name: '', quantity: 1, estimatedPrice: 0 }],
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
      items: [...prev.items, { name: '', quantity: 1, estimatedPrice: 0 }]
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คำขอจัดซื้อ</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + สร้างคำขอใหม่
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">สร้างคำขอจัดซื้อใหม่</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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
                  <div key={index} className="flex gap-2 mb-3 items-center">
                    <input
                      type="text"
                      placeholder="ชื่อสินค้า/วัสดุ"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="ราคาประมาณ"
                      value={item.estimatedPrice}
                      onChange={(e) => updateItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + เพิ่มรายการ
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  เหตุผลในการจัดซื้อ
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="เช่น สำหรับใช้ในการทำงาน, ทดแทนของเสีย"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        <div key={index} className="mb-1">
                          {item.name} (จำนวน: {item.quantity})
                          {item.estimatedPrice > 0 && (
                            <span className="text-gray-500 ml-2">
                              ~{item.estimatedPrice.toLocaleString()} บาท
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {request.reason}
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
          <div className="text-center py-12">
            <p className="text-gray-500">ยังไม่มีคำขอจัดซื้อ</p>
          </div>
        )}
      </div>
    </div>
  );
}
