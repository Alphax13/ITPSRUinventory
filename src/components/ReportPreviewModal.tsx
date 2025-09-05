'use client';

import { useState, useEffect } from 'react';
import { MaterialReportData, TransactionReportData, PurchaseRequestReportData } from '@/utils/excelGenerator';

// ฟังก์ชั่นแปลง JSON items เป็นชื่อสินค้า
const parseItemsToNames = (itemsJson: string): string[] => {
  try {
    const items = JSON.parse(itemsJson);
    if (Array.isArray(items)) {
      return items.map(item => item.name || '').filter(name => name);
    }
    return [];
  } catch (error) {
    return [];
  }
};

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'stock' | 'transactions' | 'purchase-requests';
  data: any[];
  onExport: (format: 'pdf' | 'excel') => void;
  loading?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  reportType,
  data,
  onExport,
  loading = false,
  dateRange
}: ReportPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const renderStockReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">รหัสวัสดุ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">ชื่อวัสดุ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">หมวดหมู่</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">จำนวนคงเหลือ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">หน่วย</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item: MaterialReportData, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border text-gray-800">{item.code || '-'}</td>
              <td className="px-4 py-2 border text-gray-800">{item.name}</td>
              <td className="px-4 py-2 border text-gray-800">{item.category}</td>
              <td className="px-4 py-2 border text-gray-800">{item.currentStock.toLocaleString()}</td>
              <td className="px-4 py-2 border text-gray-800">{item.unit}</td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.currentStock <= item.minStock 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.currentStock <= item.minStock ? 'ต่ำกว่าขั้นต่ำ' : 'ปกติ'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTransactionReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">วันที่</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">รหัสวัสดุ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">ชื่อวัสดุ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">ประเภท</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">จำนวน</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">ผู้ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item: TransactionReportData, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border text-gray-800">
                {new Date(item.date).toLocaleDateString('th-TH')}
              </td>
              <td className="px-4 py-2 border text-gray-800">{item.materialCode}</td>
              <td className="px-4 py-2 border text-gray-800">{item.materialName}</td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.type === 'WITHDRAW' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.type === 'WITHDRAW' ? 'เบิกจ่าย' : 'เพิ่มสต็อก'}
                </span>
              </td>
              <td className="px-4 py-2 border text-gray-800">{item.quantity.toLocaleString()}</td>
              <td className="px-4 py-2 border text-gray-800">{item.userName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPurchaseRequestReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">วันที่ขอซื้อ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">ผู้ขอซื้อ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">สาขา</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">รายการ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">สถานะ</th>
            <th className="px-4 py-2 border text-left font-semibold text-gray-700">เหตุผล</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item: PurchaseRequestReportData, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border text-gray-800">
                {new Date(item.requestDate).toLocaleDateString('th-TH')}
              </td>
              <td className="px-4 py-2 border text-gray-800">{item.requesterName}</td>
              <td className="px-4 py-2 border text-gray-800">{item.department}</td>
              <td className="px-4 py-2 border text-gray-800">
                <div className="max-w-xs">
                  {(() => {
                    try {
                      const parsedItems = JSON.parse(item.items);
                      if (Array.isArray(parsedItems)) {
                        return (
                          <ul className="list-disc list-inside text-sm">
                            {parsedItems.slice(0, 3).map((reqItem: any, idx: number) => (
                              <li key={idx}>
                                {reqItem.name} ({reqItem.quantity} {reqItem.unit})
                              </li>
                            ))}
                            {parsedItems.length > 3 && (
                              <li className="text-gray-500">และอีก {parsedItems.length - 3} รายการ</li>
                            )}
                          </ul>
                        );
                      }
                    } catch (error) {
                      // Fall through to simple text display
                    }
                    
                    // Fallback to simple text display
                    const itemNames = parseItemsToNames(item.items);
                    return itemNames.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {itemNames.slice(0, 3).map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))}
                        {itemNames.length > 3 && (
                          <li className="text-gray-500">และอีก {itemNames.length - 3} รายการ</li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-gray-500">-</span>
                    );
                  })()}
                </div>
              </td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  item.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status === 'APPROVED' ? 'อนุมัติ' :
                   item.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอดำเนินการ'}
                </span>
              </td>
              <td className="px-4 py-2 border text-gray-800 text-sm">
                <div className="max-w-xs truncate" title={item.reason}>
                  {item.reason || '-'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getReportTitle = () => {
    switch (reportType) {
      case 'stock':
        return 'รายงานสต็อกวัสดุ';
      case 'transactions':
        return 'รายงานการเบิกจ่าย';
      case 'purchase-requests':
        return 'รายงานคำขอซื้อ';
      default:
        return 'รายงาน';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{getReportTitle()}</h2>
            {dateRange && (
              <p className="text-sm text-gray-600 mt-1">
                ช่วงวันที่: {new Date(dateRange.startDate).toLocaleDateString('th-TH')} - {new Date(dateRange.endDate).toLocaleDateString('th-TH')}
              </p>
            )}
            <p className="text-sm text-gray-600">
              ทั้งหมด {data.length.toLocaleString()} รายการ
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border rounded-lg p-4">
            {reportType === 'stock' && renderStockReport()}
            {reportType === 'transactions' && renderTransactionReport()}
            {reportType === 'purchase-requests' && renderPurchaseRequestReport()}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ก่อนหน้า
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                หน้า {currentPage} จาก {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ปิด
          </button>
          <button
            onClick={() => onExport('excel')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{loading ? 'กำลังสร้าง...' : 'ดาวน์โหลด Excel'}</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{loading ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
