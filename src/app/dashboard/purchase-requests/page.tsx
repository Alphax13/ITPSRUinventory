// src/app/dashboard/purchase-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import {
  ShoppingCartIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

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
  const [processingStatus, setProcessingStatus] = useState<{ [key: string]: boolean }>({});
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
      const response = await fetch('/api/purchase-requests', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else if (response.status === 401) {
        console.error('Unauthorized access to purchase requests');
        window.location.href = '/login';
        return;
      } else {
        console.error('Failed to fetch requests, status:', response.status);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }

    // Validate that there's at least one item with a name
    const validItems = formData.items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    
    setLoading(true);

    try {
      const requestBody = {
        requesterId: user.id,
        items: validItems,
        reason: formData.reason,
      };

      console.log('Sending purchase request:', requestBody);

      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Purchase request response:', response.status, responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Purchase request created successfully:', data);
          
          setFormData({
            items: [{ name: '', quantity: 1, imageUrl: '' }],
            reason: '',
          });
          setShowForm(false);
          fetchRequests();
          alert('ส่งคำขอจัดซื้อเรียบร้อยแล้ว');
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          alert('เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์');
        }
      } else {
        console.error('Request failed with status:', response.status);
        try {
          const errorData = JSON.parse(responseText);
          alert('เกิดข้อผิดพลาดในการส่งคำขอ: ' + (errorData.error || 'Unknown error'));
        } catch {
          alert('เกิดข้อผิดพลาดในการส่งคำขอ (HTTP ' + response.status + ')');
        }
      }
    } catch (error) {
      console.error('Error creating request:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + errorMessage);
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
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'purchase-requests');

      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const responseText = await response.text();
      console.log('Upload response:', response.status, responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Upload success:', data);
          updateItem(index, 'imageUrl', data.url);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          alert('เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์');
        }
      } else {
        console.error('Upload failed with status:', response.status);
        try {
          const errorData = JSON.parse(responseText);
          alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + (errorData.error || 'Unknown error'));
        } catch {
          alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ (HTTP ' + response.status + ')');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + errorMessage);
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

  const handleStatusUpdate = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!user?.id) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (user.role !== 'ADMIN') {
      alert('คุณไม่มีสิทธิ์ในการอนุมัติคำขอ');
      return;
    }

    const confirmMessage = status === 'APPROVED' 
      ? 'คุณต้องการอนุมัติคำขอนี้หรือไม่?' 
      : 'คุณต้องการปฏิเสธคำขอนี้หรือไม่?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessingStatus(prev => ({ ...prev, [requestId]: true }));

    try {
      const response = await fetch(`/api/purchase-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminId: user.id,
        }),
      });

      if (response.ok) {
        // อัปเดตสถานะในตาราง
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { ...request, status, updatedAt: new Date().toISOString() }
              : request
          )
        );
        
        alert(status === 'APPROVED' ? 'อนุมัติคำขอเรียบร้อยแล้ว' : 'ปฏิเสธคำขอเรียบร้อยแล้ว');
      } else {
        const error = await response.json();
        alert('เกิดข้อผิดพลาด: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setProcessingStatus(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!user?.id) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    console.log('User data:', user);
    console.log('User role:', user.role);

    if (user.role !== 'ADMIN') {
      alert('คุณไม่มีสิทธิ์ในการลบคำขอ');
      return;
    }

    if (!confirm('คุณต้องการลบคำขอนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setProcessingStatus(prev => ({ ...prev, [requestId]: true }));

    try {
      const requestBody = {
        adminId: user.id,
      };
      
      console.log('Sending delete request:', requestBody);

      const response = await fetch(`/api/purchase-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        // ลบรายการออกจากตาราง
        setRequests(prev => prev.filter(request => request.id !== requestId));
        alert('ลบคำขอเรียบร้อยแล้ว');
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        alert('เกิดข้อผิดพลาด: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('เกิดข้อผิดพลาดในการลบคำขอ');
    } finally {
      setProcessingStatus(prev => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-800">คำขอจัดซื้อ</h1>
              {user?.role === 'ADMIN' ? (
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">ดูได้ทั้งหมด</span>
              ) : (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">เฉพาะของฉัน</span>
              )}
            </div>
            <p className="text-sm text-slate-500">สร้างคำขอจัดซื้อวัสดุ อุปกรณ์ และครุภัณฑ์</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            สร้างคำขอใหม่
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full flex justify-center items-start pt-10 pb-10 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">สร้างคำขอจัดซื้อใหม่</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-slate-700 text-sm font-semibold mb-3">
                  รายการที่ต้องการจัดซื้อ
                </label>
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl p-4 mb-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="ชื่อสินค้า/วัสดุ"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
                          required
                        />
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-full sm:w-28">
                        {item.imageUrl ? (
                          <div className="relative">
                            <Image
                              src={item.imageUrl}
                              alt="สินค้า"
                              width={112}
                              height={84}
                              className="w-full h-20 object-cover rounded-xl border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'imageUrl', '')}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-20 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center">
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
                            <label htmlFor={`image-${index}`} className="cursor-pointer text-center p-1 flex flex-col items-center">
                              {uploadingImages[index] ? (
                                <div className="text-xs text-slate-500">
                                  <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                                  อัปโหลด...
                                </div>
                              ) : (
                                <>
                                  <PhotoIcon className="h-5 w-5 text-slate-400 mb-1" />
                                  <span className="text-xs text-slate-500">เพิ่มรูป</span>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-sm font-medium bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  เพิ่มรายการ
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-slate-700 text-sm font-semibold mb-2">
                  เหตุผลในการจัดซื้อ (ไม่บังคับ)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="เช่น สำหรับใช้ในการทำงาน, ทดแทนของเสีย"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
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
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-center py-16">
            <ShoppingCartIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">ยังไม่มีคำขอจัดซื้อ</h3>
            <p className="text-sm text-slate-500">คลิกปุ่ม &quot;สร้างคำขอใหม่&quot; เพื่อเริ่มต้น</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards — hidden on md+ */}
          <div className="md:hidden space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400">#{request.id.slice(-6)}</span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{request.requester?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(request.createdAt).toLocaleDateString('th-TH')}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 mb-3">
                  {Array.isArray(request.items) && request.items.map((item: PurchaseItem, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={36}
                          height={36}
                          className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">จำนวน: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reason */}
                {request.reason && (
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3 break-all">
                    {/^https?:\/\//i.test(request.reason) ? (
                      <a
                        href={request.reason}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {request.reason}
                      </a>
                    ) : (
                      request.reason
                    )}
                  </div>
                )}

                {/* Admin actions */}
                {user?.role === 'ADMIN' && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                    {request.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                          disabled={processingStatus[request.id]}
                          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {processingStatus[request.id] ? (
                            <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (<><CheckIcon className="h-3.5 w-3.5" />อนุมัติ</>)}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                          disabled={processingStatus[request.id]}
                          className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {processingStatus[request.id] ? (
                            <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (<><XMarkIcon className="h-3.5 w-3.5" />ปฏิเสธ</>)}
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {request.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      disabled={processingStatus[request.id]}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
                    >
                      {processingStatus[request.id] ? (
                        <div className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full" />
                      ) : (
                        <TrashIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รหัสคำขอ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ผู้ขอ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รายการ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">เหตุผล</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">วันที่สร้าง</th>
                    {user?.role === 'ADMIN' && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">การจัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-700">
                        #{request.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {request.requester?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 space-y-1.5">
                          {Array.isArray(request.items) && request.items.map((item: PurchaseItem, idx: number) => (
                            <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg">
                              {item.imageUrl && (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-slate-800">{item.name}</div>
                                <div className="text-xs text-slate-500">จำนวน: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 max-w-xs break-all">
                          {request.reason ? (
                            /^https?:\/\//i.test(request.reason) ? (
                              <a
                                href={request.reason}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-600 hover:text-orange-700 hover:underline"
                              >
                                {request.reason}
                              </a>
                            ) : (
                              request.reason
                            )
                          ) : (
                            <span className="text-slate-400 italic">ไม่ได้ระบุ</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2 items-center">
                            {request.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                                  disabled={processingStatus[request.id]}
                                  className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {processingStatus[request.id] ? (
                                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                                  ) : (
                                    <><CheckIcon className="h-3.5 w-3.5" />อนุมัติ</>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                                  disabled={processingStatus[request.id]}
                                  className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {processingStatus[request.id] ? (
                                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                                  ) : (
                                    <><XMarkIcon className="h-3.5 w-3.5" />ปฏิเสธ</>
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs">
                                {request.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                              </span>
                            )}
                            <button
                              onClick={() => handleDelete(request.id)}
                              disabled={processingStatus[request.id]}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              title="ลบคำขอ"
                            >
                              {processingStatus[request.id] ? (
                                <div className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                              ) : (
                                <TrashIcon className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
