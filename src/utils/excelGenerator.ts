// src/utils/excelGenerator.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface MaterialReportData {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  price?: number;
  location?: string;
  status: string;
}

export interface TransactionReportData {
  id: string;
  date: string;
  materialCode: string;
  materialName: string;
  type: string;
  quantity: number;
  unit: string;
  userName: string;
  department?: string;
  note?: string;
}

export interface PurchaseRequestReportData {
  id: string;
  requestDate: string;
  requesterName: string;
  department?: string;
  status: string;
  items: string;
  reason: string;
  approvedDate?: string;
}

// สร้าง Excel สำหรับรายงานสต็อกวัสดุ
export const generateStockExcel = (data: MaterialReportData[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'รหัสวัสดุ': item.code,
    'ชื่อวัสดุ': item.name,
    'หมวดหมู่': item.category,
    'สต็อกปัจจุบัน': item.currentStock,
    'สต็อกขั้นต่ำ': item.minStock,
    'หน่วย': item.unit,
    'ผู้จำหน่าย': item.supplier || '-',
    'ราคาต่อหน่วย': item.price || 0,
    'ตำแหน่งเก็บ': item.location || '-',
    'สถานะ': item.status,
    'สถานะสต็อก': item.currentStock <= item.minStock ? 'สต็อกต่ำ' : 'ปกติ'
  })));

  // ปรับขนาดคอลัมน์
  const colWidths = [
    { wch: 15 }, // รหัสวัสดุ
    { wch: 30 }, // ชื่อวัสดุ
    { wch: 15 }, // หมวดหมู่
    { wch: 12 }, // สต็อกปัจจุบัน
    { wch: 12 }, // สต็อกขั้นต่ำ
    { wch: 10 }, // หน่วย
    { wch: 20 }, // ผู้จำหน่าย
    { wch: 15 }, // ราคาต่อหน่วย
    { wch: 20 }, // ตำแหน่งเก็บ
    { wch: 12 }, // สถานะ
    { wch: 12 }  // สถานะสต็อก
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานสต็อกวัสดุ');

  // เพิ่มข้อมูลสรุป
  const summaryData = [
    { 'รายการ': 'จำนวนวัสดุทั้งหมด', 'ค่า': data.length },
    { 'รายการ': 'วัสดุที่สต็อกต่ำ', 'ค่า': data.filter(item => item.currentStock <= item.minStock).length },
    { 'รายการ': 'วัสดุที่หมด', 'ค่า': data.filter(item => item.currentStock === 0).length },
    { 'รายการ': 'วันที่สร้างรายงาน', 'ค่า': new Date().toLocaleDateString('th-TH') }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

// สร้าง Excel สำหรับรายงานการเบิก-จ่าย
export const generateTransactionExcel = (data: TransactionReportData[], filename: string, dateRange: { start: string, end: string }) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'วันที่': item.date,
    'รหัสวัสดุ': item.materialCode,
    'ชื่อวัสดุ': item.materialName,
    'ประเภท': item.type === 'OUT' ? 'เบิก' : 'เพิ่ม',
    'จำนวน': item.quantity,
    'หน่วย': item.unit,
    'ผู้ทำรายการ': item.userName,
    'หน่วยงาน': item.department || '-',
    'หมายเหตุ': item.note || '-'
  })));

  const colWidths = [
    { wch: 12 }, // วันที่
    { wch: 15 }, // รหัสวัสดุ
    { wch: 30 }, // ชื่อวัสดุ
    { wch: 10 }, // ประเภท
    { wch: 10 }, // จำนวน
    { wch: 10 }, // หน่วย
    { wch: 20 }, // ผู้ทำรายการ
    { wch: 15 }, // หน่วยงาน
    { wch: 25 }  // หมายเหตุ
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานการเบิก-จ่าย');

  // เพิ่มข้อมูลสรุป
  const outTransactions = data.filter(t => t.type === 'OUT');
  const inTransactions = data.filter(t => t.type === 'IN');

  const summaryData = [
    { 'รายการ': 'ช่วงวันที่', 'ค่า': `${dateRange.start} - ${dateRange.end}` },
    { 'รายการ': 'รายการทั้งหมด', 'ค่า': data.length },
    { 'รายการ': 'รายการเบิก', 'ค่า': outTransactions.length },
    { 'รายการ': 'รายการเพิ่ม', 'ค่า': inTransactions.length },
    { 'รายการ': 'วันที่สร้างรายงาน', 'ค่า': new Date().toLocaleDateString('th-TH') }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

// สร้าง Excel สำหรับรายงานคำขอซื้อ
export const generatePurchaseRequestExcel = (data: PurchaseRequestReportData[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'วันที่ขอ': item.requestDate,
    'ผู้ขอ': item.requesterName,
    'หน่วยงาน': item.department || '-',
    'สถานะ': item.status === 'PENDING' ? 'รออนุมัติ' : 
             item.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ',
    'รายการที่ขอ': item.items,
    'เหตุผล': item.reason,
    'วันที่อนุมัติ': item.approvedDate || '-'
  })));

  const colWidths = [
    { wch: 12 }, // วันที่ขอ
    { wch: 20 }, // ผู้ขอ
    { wch: 15 }, // หน่วยงาน
    { wch: 12 }, // สถานะ
    { wch: 40 }, // รายการที่ขอ
    { wch: 30 }, // เหตุผล
    { wch: 12 }  // วันที่อนุมัติ
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานคำขอซื้อ');

  // เพิ่มข้อมูลสรุป
  const pendingRequests = data.filter(r => r.status === 'PENDING');
  const approvedRequests = data.filter(r => r.status === 'APPROVED');
  const rejectedRequests = data.filter(r => r.status === 'REJECTED');

  const summaryData = [
    { 'รายการ': 'คำขอทั้งหมด', 'ค่า': data.length },
    { 'รายการ': 'รออนุมัติ', 'ค่า': pendingRequests.length },
    { 'รายการ': 'อนุมัติแล้ว', 'ค่า': approvedRequests.length },
    { 'รายการ': 'ปฏิเสธ', 'ค่า': rejectedRequests.length },
    { 'รายการ': 'วันที่สร้างรายงาน', 'ค่า': new Date().toLocaleDateString('th-TH') }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};
