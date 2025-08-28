'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { generateStockReport, generateTransactionReport, downloadPDF } from '@/utils/pdfGenerator';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const { user } = useAuthStore();

  // Only staff can access reports
  if (user?.role !== 'STAFF') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-gray-600">เฉพาะเจ้าหน้าที่เท่านั้นที่สามารถเข้าถึงส่วนรายงานได้</p>
      </div>
    );
  }

  const generateReport = async (type: 'stock' | 'transactions') => {
    setLoading(true);
    
    try {
      if (type === 'stock') {
        // Fetch materials
        const response = await fetch('/api/materials');
        if (response.ok) {
          const materials = await response.json();
          const pdf = await generateStockReport(materials);
          downloadPDF(pdf, `stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
        }
      } else if (type === 'transactions') {
        // Fetch transactions in date range
        const response = await fetch(`/api/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        if (response.ok) {
          const transactions = await response.json();
          const pdf = await generateTransactionReport(
            transactions, 
            dateRange.startDate, 
            dateRange.endDate
          );
          downloadPDF(pdf, `transaction-report-${dateRange.startDate}-${dateRange.endDate}.pdf`);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: 'รายงานสต็อกวัสดุ',
      description: 'รายงานสต็อกวัสดุคงเหลือทั้งหมด',
      icon: '📊',
      type: 'stock' as const,
      color: 'bg-blue-500',
    },
    {
      title: 'รายงานการเบิก-จ่าย',
      description: 'รายงานประวัติการเบิก-จ่ายวัสดุ',
      icon: '📋',
      type: 'transactions' as const,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <p className="text-gray-600 mt-1">สร้างและดาวน์โหลดรายงาน PDF</p>
      </div>

      {/* Date Range for Transaction Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ช่วงวันที่สำหรับรายงานการเบิก-จ่าย</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div key={report.type} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                {report.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                <p className="text-gray-600 text-sm">{report.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => generateReport(report.type)}
              disabled={loading}
              className={`w-full ${report.color} hover:opacity-90 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors`}
            >
              {loading ? 'กำลังสร้างรายงาน...' : '📄 สร้างรายงาน PDF'}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปข้อมูลด่วน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">📊</div>
            <div className="text-sm text-gray-600 mt-2">รายงานสต็อก</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">📋</div>
            <div className="text-sm text-gray-600 mt-2">รายงานเบิก-จ่าย</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">⚠️</div>
            <div className="text-sm text-gray-600 mt-2">สต็อกต่ำ</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">🛒</div>
            <div className="text-sm text-gray-600 mt-2">คำขอซื้อ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
