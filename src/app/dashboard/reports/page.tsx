'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import ReportPreviewModal from '@/components/ReportPreviewModal';
import type {
  MaterialReportData,
  TransactionReportData,
  PurchaseRequestReportData
} from '@/utils/excelGenerator';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: 'stock' | 'transactions' | 'purchase-requests';
    data: MaterialReportData[] | TransactionReportData[] | PurchaseRequestReportData[];
    dateRange?: { startDate: string; endDate: string };
  }>({
    isOpen: false,
    type: 'stock',
    data: [],
    dateRange: undefined
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [stats, setStats] = useState({
    totalMaterials: 0,
    lowStockMaterials: 0,
    totalTransactions: 0,
    pendingRequests: 0
  });

  const { user } = useAuthStore();

  const loadStats = useCallback(async () => {
    try {
      const [stockRes, transactionRes, purchaseRes] = await Promise.all([
        fetch('/api/reports/stock'),
        fetch(`/api/reports/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch('/api/reports/purchase-requests')
      ]);

      if (stockRes.ok) {
        const stockData: MaterialReportData[] = await stockRes.json();
        setStats(prev => ({
          ...prev,
          totalMaterials: stockData.length,
          lowStockMaterials: stockData.filter(item => item.currentStock <= item.minStock).length
        }));
      }

      if (transactionRes.ok) {
        const transactionData: TransactionReportData[] = await transactionRes.json();
        setStats(prev => ({
          ...prev,
          totalTransactions: transactionData.length
        }));
      }

      if (purchaseRes.ok) {
        const purchaseData: PurchaseRequestReportData[] = await purchaseRes.json();
        setStats(prev => ({
          ...prev,
          pendingRequests: purchaseData.filter(req => req.status === 'PENDING').length
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldCheckIcon className="h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-800">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-slate-500">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงส่วนรายงานได้</p>
      </div>
    );
  }

  const generateReport = async (type: 'stock' | 'transactions' | 'purchase-requests', format: 'pdf' | 'excel', preview: boolean = false) => {
    setLoading(true);
    
    try {
      let apiUrl = '';
      let filename = '';
      
      switch (type) {
        case 'stock':
          apiUrl = '/api/reports/stock';
          filename = `stock-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'transactions':
          apiUrl = `/api/reports/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          filename = `transaction-report-${dateRange.startDate}-${dateRange.endDate}`;
          break;
        case 'purchase-requests':
          apiUrl = '/api/reports/purchase-requests';
          filename = `purchase-request-report-${new Date().toISOString().split('T')[0]}`;
          break;
      }

      if (preview) {
        // Fetch data for preview
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error('Failed to fetch data for preview');
        }
        const data = await response.json();
        
        setPreviewModal({
          isOpen: true,
          type,
          data,
          dateRange: type === 'transactions' ? dateRange : undefined
        });
        return;
      }

      // ใช้ HTMLDocs API สำหรับการสร้างรายงาน
      const downloadUrl = format === 'pdf' 
        ? `${apiUrl}/${format}${type === 'transactions' ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : ''}`
        : `${apiUrl}/${format}${type === 'transactions' ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : ''}`;
        
      console.log('Downloading from:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างรายงาน';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // ดาวน์โหลดไฟล์
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างรายงาน';
      alert(`${errorMessage}\n\nกรุณาตรวจสอบ:\n- HTMLDocs API key ใน .env\n- การเชื่อมต่ออินเทอร์เน็ต\n- Credits ใน HTMLDocs account`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewExport = async (format: 'pdf' | 'excel') => {
    if (!previewModal.isOpen || !previewModal.data || previewModal.data.length === 0) return;
    
    setLoading(true);
    
    try {
      const { type } = previewModal;
      const timestamp = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
      const filename = `${type === 'stock' ? 'รายงานสต็อก' : 
                          type === 'transactions' ? 'รายงานเบิกจ่าย' : 
                          'รายงานคำขอซื้อ'}_${timestamp}`;

      // สร้าง API URL
      let apiUrl = '';
      switch (type) {
        case 'stock':
          apiUrl = `/api/reports/stock/${format}`;
          break;
        case 'transactions':
          const modalDateRange = previewModal.dateRange || dateRange;
          apiUrl = `/api/reports/transactions/${format}?startDate=${modalDateRange.startDate}&endDate=${modalDateRange.endDate}`;
          break;
        case 'purchase-requests':
          apiUrl = `/api/reports/purchase-requests/${format}`;
          break;
      }
      
      console.log('Fetching report from:', apiUrl);
      
      // ดาวน์โหลดไฟล์จาก HTMLDocs API
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างรายงาน';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Close modal after successful export
      setPreviewModal(prev => ({ ...prev, isOpen: false }));
      
    } catch (error) {
      console.error('Error exporting report:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกรายงาน';
      alert(`${errorMessage}\n\nกรุณาตรวจสอบ:\n- HTMLDocs API key ใน .env\n- การเชื่อมต่ออินเทอร์เน็ต\n- Credits ใน HTMLDocs account`);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: 'รายงานสต็อกวัสดุ',
      description: 'รายงานสต็อกวัสดุคงเหลือทั้งหมด',
      icon: ChartBarIcon,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      type: 'stock' as const,
    },
    {
      title: 'รายงานการเบิก-จ่าย',
      description: 'รายงานประวัติการเบิก-จ่ายวัสดุตามช่วงวันที่',
      icon: ClipboardDocumentListIcon,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      type: 'transactions' as const,
    },
    {
      title: 'รายงานคำขอซื้อ',
      description: 'รายงานคำขอซื้อและสถานะการอนุมัติ',
      icon: ShoppingCartIcon,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      type: 'purchase-requests' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5">
          <h1 className="text-xl font-bold text-slate-800">รายงาน</h1>
          <p className="text-sm text-slate-500 mt-0.5">สร้างและดาวน์โหลดรายงาน PDF และ Excel</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalMaterials}</p>
          <p className="text-xs text-slate-500 mt-0.5">วัสดุทั้งหมด</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.lowStockMaterials}</p>
          <p className="text-xs text-slate-500 mt-0.5">สต็อกต่ำ</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalTransactions}</p>
          <p className="text-xs text-slate-500 mt-0.5">รายการเบิก-จ่าย</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
            <ShoppingCartIcon className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.pendingRequests}</p>
          <p className="text-xs text-slate-500 mt-0.5">คำขอรออนุมัติ</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isTransactions = report.type === 'transactions';
          return (
            <div key={report.type} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              {/* Card header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-10 h-10 rounded-xl ${report.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${report.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{report.description}</p>
                  </div>
                </div>
              </div>

              {/* Date range — transactions only */}
              {isTransactions && (
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-xs font-medium text-slate-500 mb-2.5">ช่วงวันที่</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">เริ่มต้น</label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">สิ้นสุด</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-5 mt-auto space-y-2">
                {/* Preview */}
                <button
                  onClick={() => generateReport(report.type, 'pdf', true)}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  พรีวิวรายงาน
                </button>
                {/* Download row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => generateReport(report.type, 'pdf')}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 shrink-0" />
                    PDF
                  </button>
                  <button
                    onClick={() => generateReport(report.type, 'excel')}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <TableCellsIcon className="h-4 w-4 shrink-0" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-4 shadow-2xl">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-600"></div>
            <p className="text-sm font-medium text-slate-700">กำลังสร้างรายงาน...</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <ReportPreviewModal
          isOpen={previewModal.isOpen}
          reportType={previewModal.type}
          data={previewModal.data}
          dateRange={previewModal.dateRange}
          onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
          onExport={handlePreviewExport}
        />
      )}
    </div>
  );
}