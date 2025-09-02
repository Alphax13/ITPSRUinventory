// src/app/dashboard/asset-borrows/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import SafeImage from '@/components/SafeImage';

interface BorrowRecord {
  id: string;
  borrowDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  purpose?: string;
  note?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fixedAsset: {
    id: string;
    assetNumber: string;
    name: string;
    category: string;
    brand?: string;
    model?: string;
    location: string;
    condition: string;
    imageUrl?: string;
  };
  user: {
    id: string;
    name: string;
    email?: string;
    department: string;
  };
}

export default function AssetBorrowsPage() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const loadBorrows = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = statusFilter === 'ALL' 
          ? '/api/assets/borrow' 
          : `/api/assets/borrow?status=${statusFilter}`;
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          setError(`ไม่สามารถโหลดข้อมูลได้ (${response.status}): ${errorText}`);
          return;
        }
        
        const data = await response.json();
        setBorrows(data);
      } catch (error) {
        console.error('Error fetching borrows:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadBorrows();
  }, [statusFilter]);

  const fetchBorrows = async () => {
    try {
      const url = statusFilter === 'ALL' 
        ? '/api/assets/borrow' 
        : `/api/assets/borrow?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      }
    } catch (error) {
      console.error('Error fetching borrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowId: string) => {
    try {
      const response = await fetch('/api/assets/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          borrowId,
          condition: 'GOOD',
          note: 'คืนผ่านระบบ'
        }),
      });

      if (response.ok) {
        fetchBorrows();
      }
    } catch (error) {
      console.error('Error returning asset:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BORROWED': return 'bg-blue-100 text-blue-800';
      case 'RETURNED': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'LOST': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'BORROWED': return 'กำลังยืม';
      case 'RETURNED': return 'คืนแล้ว';
      case 'OVERDUE': return 'เกินกำหนด';
      case 'LOST': return 'สูญหาย';
      default: return status;
    }
  };

  const isOverdue = (borrow: BorrowRecord) => {
    if (!borrow.expectedReturnDate || borrow.status === 'RETURNED') return false;
    return new Date(borrow.expectedReturnDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
            <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
            <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การยืมคืนครุภัณฑ์</h1>
          <p className="text-gray-600 mt-1">ติดตามและจัดการการยืมคืนครุภัณฑ์</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="BORROWED">กำลังยืม</option>
            <option value="RETURNED">คืนแล้ว</option>
            <option value="OVERDUE">เกินกำหนด</option>
            <option value="LOST">สูญหาย</option>
          </select>
        </div>
      </div>

      {/* Borrows Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เลขครุภัณฑ์
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายการ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้ยืม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่ยืม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                กำหนดคืน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {borrows.map((borrow) => (
              <tr key={borrow.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {borrow.fixedAsset.assetNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {borrow.fixedAsset.imageUrl && (
                      <div className="flex-shrink-0">
                        <SafeImage
                          src={borrow.fixedAsset.imageUrl}
                          alt={borrow.fixedAsset.name}
                          width={40}
                          height={40}
                          className="rounded-lg border border-gray-200 object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {borrow.fixedAsset.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {borrow.fixedAsset.category}
                        {borrow.fixedAsset.brand && ` - ${borrow.fixedAsset.brand}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {borrow.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {borrow.user.department}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(borrow.borrowDate).toLocaleDateString('th-TH')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {borrow.expectedReturnDate ? (
                    <span className={isOverdue(borrow) ? 'text-red-600' : ''}>
                      {new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH')}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>
                    {getStatusText(borrow.status)}
                  </span>
                  {isOverdue(borrow) && borrow.status === 'BORROWED' && (
                    <div className="text-xs text-red-600 mt-1">เกินกำหนด!</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDetails(showDetails === borrow.id ? null : borrow.id)}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors"
                      title={showDetails === borrow.id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {isAdmin && borrow.status === 'BORROWED' && (
                      <button
                        onClick={() => handleReturn(borrow.id)}
                        className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-colors"
                        title="คืนครุภัณฑ์"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {borrows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {statusFilter === 'ALL' 
                ? 'ยังไม่มีรายการยืมครุภัณฑ์' 
                : `ไม่มีรายการที่มีสถานะ "${getStatusText(statusFilter)}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const borrow = borrows.find(b => b.id === showDetails);
              if (!borrow) return null;

              return (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">รายละเอียดการยืมครุภัณฑ์</h2>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Asset Image */}
                  {borrow.fixedAsset.imageUrl && (
                    <div className="mb-6 text-center">
                      <SafeImage
                        src={borrow.fixedAsset.imageUrl}
                        alt={borrow.fixedAsset.name}
                        width={200}
                        height={150}
                        className="rounded-lg border border-gray-200 object-cover mx-auto cursor-pointer hover:opacity-80"
                        onClick={() => setShowImageModal(borrow.fixedAsset.imageUrl!)}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">เลขครุภัณฑ์</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.assetNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อครุภัณฑ์</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ตำแหน่ง</label>
                        <p className="text-sm text-gray-900">{borrow.fixedAsset.location}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ผู้ยืม</label>
                        <p className="text-sm text-gray-900">{borrow.user.name}</p>
                        <p className="text-xs text-gray-500">{borrow.user.email}</p>
                        <p className="text-xs text-gray-500">{borrow.user.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(borrow.status)}`}>
                          {getStatusText(borrow.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่ยืม</label>
                        <p className="text-sm text-gray-900">
                          {new Date(borrow.borrowDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">กำหนดคืน</label>
                        <p className="text-sm text-gray-900">
                          {borrow.expectedReturnDate ? 
                            new Date(borrow.expectedReturnDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    {borrow.actualReturnDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่คืนจริง</label>
                        <p className="text-sm text-gray-900">
                          {new Date(borrow.actualReturnDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {borrow.purpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วัตถุประสงค์</label>
                        <p className="text-sm text-gray-900">{borrow.purpose}</p>
                      </div>
                    )}

                    {borrow.note && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                        <p className="text-sm text-gray-900">{borrow.note}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowDetails(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowImageModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl z-10"
            >
              ×
            </button>
            <SafeImage
              src={showImageModal}
              alt="Asset image"
              width={800}
              height={600}
              className="rounded-lg max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
