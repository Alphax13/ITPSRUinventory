'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { 
  generateStockReport, 
  generateTransactionReport, 
  generatePurchaseRequestReport
} from '@/utils/pdfGenerator';
import { 
  generateSimpleStockPDF,
  generateSimpleTransactionPDF,
  generateSimplePurchaseRequestPDF,
  downloadPDF
} from '@/utils/simplePdfGenerator';
import { 
  generateStockExcel, 
  generateTransactionExcel, 
  generatePurchaseRequestExcel,
  type MaterialReportData,
  type TransactionReportData,
  type PurchaseRequestReportData
} from '@/utils/excelGenerator';
import ReportPreviewModal from '@/components/ReportPreviewModal';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: 'stock' | 'transactions' | 'purchase-requests';
    data: any[];
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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
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
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-gray-600">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงส่วนรายงานได้</p>
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

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();

      if (preview) {
        // Show preview modal
        setPreviewModal({
          isOpen: true,
          type,
          data,
          dateRange: type === 'transactions' ? dateRange : undefined
        });
        return;
      }

      if (format === 'pdf') {
        let pdf;
        switch (type) {
          case 'stock':
            const materials = data.map((item: MaterialReportData) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              category: item.category,
              currentStock: item.currentStock,
              unit: item.unit,
              minStock: item.minStock,
              location: item.location || '-',
              status: item.currentStock <= item.minStock ? 'Low Stock' : 'Normal'
            }));
            pdf = await generateSimpleStockPDF(materials);
            break;
          case 'transactions':
            const transactions = data.map((item: TransactionReportData) => ({
              id: item.id,
              type: item.type,
              quantity: item.quantity,
              date: item.date,
              materialCode: item.materialCode,
              materialName: item.materialName,
              unit: item.unit,
              userName: item.userName,
              department: item.department
            }));
            pdf = await generateSimpleTransactionPDF(transactions, dateRange.startDate, dateRange.endDate);
            break;
          case 'purchase-requests':
            pdf = await generateSimplePurchaseRequestPDF(data);
            break;
        }
        downloadPDF(pdf!, `${filename}.pdf`);
      } else {
        switch (type) {
          case 'stock':
            generateStockExcel(data, `${filename}.xlsx`);
            break;
          case 'transactions':
            generateTransactionExcel(data, `${filename}.xlsx`, { 
              start: dateRange.startDate, 
              end: dateRange.endDate 
            });
            break;
          case 'purchase-requests':
            generatePurchaseRequestExcel(data, `${filename}.xlsx`);
            break;
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewExport = async (format: 'pdf' | 'excel') => {
    if (!previewModal.isOpen || !previewModal.data || previewModal.data.length === 0) return;
    
    setLoading(true);
    console.log(`Starting ${format} export for ${previewModal.type}...`); // Debug log
    
    try {
      const { type, data } = previewModal;
      const now = new Date();
      const timestamp = now.toLocaleDateString('th-TH').replace(/\//g, '-');
      const filename = `${type === 'stock' ? 'รายงานสต็อก' : 
                          type === 'transactions' ? 'รายงานเบิกจ่าย' : 
                          'รายงานคำขอซื้อ'}_${timestamp}`;

      if (format === 'pdf') {
        console.log('Generating Thai PDF...'); // Debug log
        let pdf;
        switch (type) {
          case 'stock':
            const materials = data.map((item: MaterialReportData) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              category: item.category,
              currentStock: item.currentStock,
              unit: item.unit,
              minStock: item.minStock,
              location: item.location || '-',
              status: item.currentStock <= item.minStock ? 'Low Stock' : 'Normal'
            }));
            console.log('Materials prepared:', materials.length); // Debug log
            pdf = await generateSimpleStockPDF(materials);
            break;
          case 'transactions':
            const transactions = data.map((item: TransactionReportData) => ({
              id: item.id,
              type: item.type,
              quantity: item.quantity,
              date: item.date,
              materialCode: item.materialCode,
              materialName: item.materialName,
              unit: item.unit,
              userName: item.userName,
              department: item.department
            }));
            const modalDateRange = previewModal.dateRange || dateRange;
            console.log('Transactions prepared:', transactions.length); // Debug log
            pdf = await generateSimpleTransactionPDF(transactions, modalDateRange.startDate, modalDateRange.endDate);
            break;
          case 'purchase-requests':
            console.log('Purchase requests prepared:', data.length); // Debug log
            pdf = await generateSimplePurchaseRequestPDF(data);
            break;
        }
        
        if (pdf) {
          console.log('Thai PDF generated successfully, downloading...'); // Debug log
          downloadPDF(pdf, `${filename}.pdf`);
        } else {
          throw new Error('PDF generation failed');
        }
      } else {
        switch (type) {
          case 'stock':
            generateStockExcel(data, `${filename}.xlsx`);
            break;
          case 'transactions':
            const modalDateRange = previewModal.dateRange || dateRange;
            generateTransactionExcel(data, `${filename}.xlsx`, { 
              start: modalDateRange.startDate, 
              end: modalDateRange.endDate 
            });
            break;
          case 'purchase-requests':
            generatePurchaseRequestExcel(data, `${filename}.xlsx`);
            break;
        }
      }
      
      // Close modal after successful export
      setPreviewModal(prev => ({ ...prev, isOpen: false }));
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
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
      description: 'รายงานประวัติการเบิก-จ่ายวัสดุตามช่วงวันที่',
      icon: '📋',
      type: 'transactions' as const,
      color: 'bg-green-500',
    },
    {
      title: 'รายงานคำขอซื้อ',
      description: 'รายงานคำขอซื้อและสถานะการอนุมัติ',
      icon: '🛒',
      type: 'purchase-requests' as const,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <p className="text-gray-600 mt-1">สร้างและดาวน์โหลดรายงาน PDF และ Excel</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm text-gray-600">วัสดุทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-sm text-gray-600">สต็อกต่ำ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockMaterials}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📋</div>
            <div>
              <p className="text-sm text-gray-600">รายการเบิก-จ่าย</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🛒</div>
            <div>
              <p className="text-sm text-gray-600">คำขอรออนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <div className="space-y-2">
              <button
                onClick={() => generateReport(report.type, 'pdf', true)}
                disabled={loading}
                className={`w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <span className="text-lg">👁️</span>
                {loading ? 'กำลังโหลด...' : 'พรีวิวรายงาน'}
              </button>
              
              <button
                onClick={() => generateReport(report.type, 'pdf')}
                disabled={loading}
                className={`w-full ${report.color} hover:opacity-90 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <span className="text-lg">📄</span>
                {loading ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}
              </button>
              
              <button
                onClick={() => generateReport(report.type, 'excel')}
                disabled={loading}
                className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <span className="text-lg">📊</span>
                {loading ? 'กำลังสร้าง...' : 'ดาวน์โหลด Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        reportType={previewModal.type}
        data={previewModal.data}
        onExport={handlePreviewExport}
        loading={loading}
        dateRange={previewModal.dateRange}
      />
    </div>
  );
}
