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
  WrenchScrewdriverIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

type ReportType = 'stock' | 'transactions' | 'purchase-requests' | 'fixed-assets' | 'borrows';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: ReportType;
    data: MaterialReportData[] | TransactionReportData[] | PurchaseRequestReportData[] | any[];
    dateRange?: { startDate: string; endDate: string };
  }>({
    isOpen: false,
    type: 'stock',
    data: [],
    dateRange: undefined
  });

  // ช่วงวันที่สำหรับรายงานเบิก-จ่าย
  const [txDateRange, setTxDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // ตัวกรองสำหรับรายงานการยืม
  const [borrowFilters, setBorrowFilters] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'ALL',
    borrowerType: 'ALL',
  });

  // ตัวกรองสำหรับครุภัณฑ์
  const [assetConditionFilter, setAssetConditionFilter] = useState('ALL');

  const [stats, setStats] = useState({
    totalMaterials: 0,
    lowStockMaterials: 0,
    totalTransactions: 0,
    pendingRequests: 0,
    totalAssets: 0,
    borrowedAssets: 0,
    overdueAssets: 0,
    totalBorrows: 0,
  });

  const { user } = useAuthStore();

  const loadStats = useCallback(async () => {
    try {
      const [stockRes, transactionRes, purchaseRes, assetRes, borrowRes] = await Promise.all([
        fetch('/api/reports/stock'),
        fetch(`/api/reports/transactions?startDate=${txDateRange.startDate}&endDate=${txDateRange.endDate}`),
        fetch('/api/reports/purchase-requests'),
        fetch('/api/reports/fixed-assets'),
        fetch('/api/reports/borrows'),
      ]);

      if (stockRes.ok) {
        const d: MaterialReportData[] = await stockRes.json();
        setStats(prev => ({ ...prev, totalMaterials: d.length, lowStockMaterials: d.filter(i => i.currentStock <= i.minStock).length }));
      }
      if (transactionRes.ok) {
        const d: TransactionReportData[] = await transactionRes.json();
        setStats(prev => ({ ...prev, totalTransactions: d.length }));
      }
      if (purchaseRes.ok) {
        const d: PurchaseRequestReportData[] = await purchaseRes.json();
        setStats(prev => ({ ...prev, pendingRequests: d.filter(r => r.status === 'PENDING').length }));
      }
      if (assetRes.ok) {
        const d: any[] = await assetRes.json();
        setStats(prev => ({
          ...prev,
          totalAssets: d.length,
          borrowedAssets: d.filter(a => a.borrowStatus === 'กำลังถูกยืม').length,
        }));
      }
      if (borrowRes.ok) {
        const d: any[] = await borrowRes.json();
        const now = new Date();
        setStats(prev => ({
          ...prev,
          totalBorrows: d.length,
          overdueAssets: d.filter(b =>
            b.status === 'BORROWED' && b.expectedReturnDate && new Date(b.expectedReturnDate) < now
          ).length,
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [txDateRange.startDate, txDateRange.endDate]);

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

  const buildUrl = (type: ReportType, suffix: string) => {
    switch (type) {
      case 'stock':
        return `/api/reports/stock${suffix}`;
      case 'transactions':
        return `/api/reports/transactions${suffix}?startDate=${txDateRange.startDate}&endDate=${txDateRange.endDate}`;
      case 'purchase-requests':
        return `/api/reports/purchase-requests${suffix}`;
      case 'fixed-assets': {
        const params = assetConditionFilter !== 'ALL' ? `?condition=${assetConditionFilter}` : '';
        return `/api/reports/fixed-assets${suffix}${params}`;
      }
      case 'borrows': {
        const p = new URLSearchParams();
        if (borrowFilters.startDate) p.set('startDate', borrowFilters.startDate);
        if (borrowFilters.endDate) p.set('endDate', borrowFilters.endDate);
        if (borrowFilters.status !== 'ALL') p.set('status', borrowFilters.status);
        if (borrowFilters.borrowerType !== 'ALL') p.set('borrowerType', borrowFilters.borrowerType);
        const qs = p.toString();
        return `/api/reports/borrows${suffix}${qs ? `?${qs}` : ''}`;
      }
    }
  };

  const generateReport = async (type: ReportType, format: 'pdf' | 'excel', preview = false) => {
    setLoading(true);
    try {
      if (preview) {
        const response = await fetch(buildUrl(type, ''));
        if (!response.ok) throw new Error('Failed to fetch data for preview');
        const data = await response.json();
        setPreviewModal({
          isOpen: true,
          type,
          data,
          dateRange: type === 'transactions' ? txDateRange : undefined,
        });
        return;
      }

      const filename = {
        'stock': 'รายงานสต็อก',
        'transactions': 'รายงานเบิกจ่าย',
        'purchase-requests': 'รายงานคำขอซื้อ',
        'fixed-assets': 'รายงานครุภัณฑ์',
        'borrows': 'รายงานยืมคืน',
      }[type];

      const response = await fetch(buildUrl(type, `/${format}`));
      if (!response.ok) {
        const errText = await response.text();
        let msg = 'เกิดข้อผิดพลาดในการสร้างรายงาน';
        try { msg = JSON.parse(errText).error || msg; } catch {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      alert(`${msg}\n\nกรุณาตรวจสอบ:\n- HTMLDocs API key ใน .env\n- การเชื่อมต่ออินเทอร์เน็ต`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewExport = async (format: 'pdf' | 'excel') => {
    if (!previewModal.isOpen) return;
    setLoading(true);
    try {
      const response = await fetch(buildUrl(previewModal.type, `/${format}`));
      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการส่งออกรายงาน');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setPreviewModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';
  const selectClass = inputClass;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-orange-600 px-6 py-5">
          <h1 className="text-xl font-bold text-slate-800">รายงาน</h1>
          <p className="text-sm text-slate-500 mt-0.5">รายงานครอบคลุมทุกส่วนของระบบ — สต็อก เบิกจ่าย ครุภัณฑ์ ยืม-คืน และคำขอซื้อ</p>
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
          {stats.lowStockMaterials > 0 && (
            <p className="text-xs text-amber-600 mt-1 font-medium">⚠ สต็อกต่ำ {stats.lowStockMaterials} รายการ</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <WrenchScrewdriverIcon className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalAssets}</p>
          <p className="text-xs text-slate-500 mt-0.5">ครุภัณฑ์ทั้งหมด</p>
          {stats.borrowedAssets > 0 && (
            <p className="text-xs text-blue-600 mt-1 font-medium">📦 กำลังยืม {stats.borrowedAssets} รายการ</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
            <ArrowsRightLeftIcon className="h-5 w-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalBorrows}</p>
          <p className="text-xs text-slate-500 mt-0.5">รายการยืมทั้งหมด</p>
          {stats.overdueAssets > 0 && (
            <p className="text-xs text-red-600 mt-1 font-medium">🔴 เกินกำหนด {stats.overdueAssets} รายการ</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
            <ShoppingCartIcon className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.pendingRequests}</p>
          <p className="text-xs text-slate-500 mt-0.5">คำขอรออนุมัติ</p>
        </div>
      </div>

      {/* Report Cards — Row 1: วัสดุสิ้นเปลือง + เบิกจ่าย */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* สต็อกวัสดุ */}
        <ReportCard
          title="รายงานสต็อกวัสดุสิ้นเปลือง"
          description="สต็อกคงเหลือและสถานะวัสดุทั้งหมด"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          Icon={ChartBarIcon}
          onPreview={() => generateReport('stock', 'pdf', true)}
          onPDF={() => generateReport('stock', 'pdf')}
          onExcel={() => generateReport('stock', 'excel')}
          loading={loading}
        />

        {/* เบิก-จ่าย */}
        <ReportCard
          title="รายงานการเบิก-จ่ายวัสดุ"
          description="ประวัติการเบิก-จ่ายตามช่วงวันที่"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          Icon={ClipboardDocumentListIcon}
          onPreview={() => generateReport('transactions', 'pdf', true)}
          onPDF={() => generateReport('transactions', 'pdf')}
          onExcel={() => generateReport('transactions', 'excel')}
          loading={loading}
          filters={
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">เริ่มต้น</label>
                <input type="date" value={txDateRange.startDate}
                  onChange={e => setTxDateRange(p => ({ ...p, startDate: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">สิ้นสุด</label>
                <input type="date" value={txDateRange.endDate}
                  onChange={e => setTxDateRange(p => ({ ...p, endDate: e.target.value }))}
                  className={inputClass} />
              </div>
            </div>
          }
        />
      </div>

      {/* Row 2: ครุภัณฑ์ + ยืม-คืน */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ครุภัณฑ์ */}
        <ReportCard
          title="รายงานครุภัณฑ์ทั้งหมด"
          description="ทะเบียนครุภัณฑ์ สภาพ ตำแหน่ง และสถานะการยืม"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          Icon={WrenchScrewdriverIcon}
          onPreview={() => generateReport('fixed-assets', 'pdf', true)}
          onPDF={() => generateReport('fixed-assets', 'pdf')}
          onExcel={() => generateReport('fixed-assets', 'excel')}
          loading={loading}
          filters={
            <div>
              <label className="block text-xs text-slate-400 mb-1">กรองตามสภาพ</label>
              <select value={assetConditionFilter}
                onChange={e => setAssetConditionFilter(e.target.value)}
                className={selectClass}>
                <option value="ALL">ทุกสภาพ</option>
                <option value="GOOD">ดี</option>
                <option value="NEEDS_REPAIR">รอซ่อม</option>
                <option value="DAMAGED">ชำรุด</option>
                <option value="DISPOSED">จำหน่ายแล้ว</option>
              </select>
            </div>
          }
        />

        {/* ยืม-คืน */}
        <ReportCard
          title="รายงานการยืม-คืนครุภัณฑ์"
          description="ประวัติการยืมแยกตามประเภทผู้ยืม สถานะ และช่วงเวลา"
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          Icon={ArrowsRightLeftIcon}
          onPreview={() => generateReport('borrows', 'pdf', true)}
          onPDF={() => generateReport('borrows', 'pdf')}
          onExcel={() => generateReport('borrows', 'excel')}
          loading={loading}
          filters={
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">เริ่มต้น</label>
                  <input type="date" value={borrowFilters.startDate}
                    onChange={e => setBorrowFilters(p => ({ ...p, startDate: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">สิ้นสุด</label>
                  <input type="date" value={borrowFilters.endDate}
                    onChange={e => setBorrowFilters(p => ({ ...p, endDate: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">สถานะ</label>
                  <select value={borrowFilters.status}
                    onChange={e => setBorrowFilters(p => ({ ...p, status: e.target.value }))}
                    className={selectClass}>
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="BORROWED">กำลังยืม</option>
                    <option value="RETURNED">คืนแล้ว</option>
                    <option value="OVERDUE">เกินกำหนด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ประเภทผู้ยืม</label>
                  <select value={borrowFilters.borrowerType}
                    onChange={e => setBorrowFilters(p => ({ ...p, borrowerType: e.target.value }))}
                    className={selectClass}>
                    <option value="ALL">ทุกประเภท</option>
                    <option value="STUDENT">นักศึกษา</option>
                    <option value="LECTURER">อาจารย์</option>
                    <option value="FACULTY">คณะ</option>
                    <option value="STAFF">เจ้าหน้าที่</option>
                  </select>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* Row 3: คำขอซื้อ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReportCard
          title="รายงานคำขอซื้อ"
          description="คำขอซื้อและสถานะการอนุมัติทั้งหมด"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          Icon={ShoppingCartIcon}
          onPreview={() => generateReport('purchase-requests', 'pdf', true)}
          onPDF={() => generateReport('purchase-requests', 'pdf')}
          onExcel={() => generateReport('purchase-requests', 'excel')}
          loading={loading}
        />
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

/* ──────────────── ReportCard component ──────────────── */
interface ReportCardProps {
  title: string;
  description: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onPreview: () => void;
  onPDF: () => void;
  onExcel: () => void;
  loading: boolean;
  filters?: React.ReactNode;
}

function ReportCard({ title, description, Icon, iconBg, iconColor, onPreview, onPDF, onExcel, loading, filters }: ReportCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {filters && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-medium text-slate-500 mb-2.5">ตัวกรอง</p>
          {filters}
        </div>
      )}

      <div className="p-5 mt-auto space-y-2">
        <button onClick={onPreview} disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-sm font-medium transition-colors">
          <EyeIcon className="h-4 w-4" />
          พรีวิวรายงาน
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onPDF} disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            <DocumentArrowDownIcon className="h-4 w-4 shrink-0" />
            PDF
          </button>
          <button onClick={onExcel} disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            <TableCellsIcon className="h-4 w-4 shrink-0" />
            Excel
          </button>
        </div>
      </div>
    </div>
  );
}
