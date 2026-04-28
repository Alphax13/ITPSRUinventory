// src/utils/excelGenerator.ts
import ExcelJS from 'exceljs';
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
export const generateStockExcel = async (data: MaterialReportData[], filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('รายงานสต็อกวัสดุ');

  worksheet.columns = [
    { header: 'รหัสวัสดุ', key: 'code', width: 15 },
    { header: 'ชื่อวัสดุ', key: 'name', width: 30 },
    { header: 'หมวดหมู่', key: 'category', width: 15 },
    { header: 'สต็อกปัจจุบัน', key: 'currentStock', width: 12 },
    { header: 'สต็อกขั้นต่ำ', key: 'minStock', width: 12 },
    { header: 'หน่วย', key: 'unit', width: 10 },
    { header: 'ผู้จำหน่าย', key: 'supplier', width: 20 },
    { header: 'ราคาต่อหน่วย', key: 'price', width: 15 },
    { header: 'ตำแหน่งเก็บ', key: 'location', width: 20 },
    { header: 'สถานะ', key: 'status', width: 12 },
    { header: 'สถานะสต็อก', key: 'stockStatus', width: 12 },
  ];

  worksheet.addRows(data.map(item => ({
    code: item.code,
    name: item.name,
    category: item.category,
    currentStock: item.currentStock,
    minStock: item.minStock,
    unit: item.unit,
    supplier: item.supplier || '-',
    price: item.price || 0,
    location: item.location || '-',
    status: item.status,
    stockStatus: item.currentStock <= item.minStock ? 'สต็อกต่ำ' : 'ปกติ',
  })));

  const summarySheet = workbook.addWorksheet('สรุป');
  summarySheet.columns = [
    { header: 'รายการ', key: 'label', width: 25 },
    { header: 'ค่า', key: 'value', width: 15 },
  ];
  summarySheet.addRows([
    { label: 'จำนวนวัสดุทั้งหมด', value: data.length },
    { label: 'วัสดุที่สต็อกต่ำ', value: data.filter(item => item.currentStock <= item.minStock).length },
    { label: 'วัสดุที่หมด', value: data.filter(item => item.currentStock === 0).length },
    { label: 'วันที่สร้างรายงาน', value: new Date().toLocaleDateString('th-TH') },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

// สร้าง Excel สำหรับรายงานการเบิก-จ่าย
export const generateTransactionExcel = async (data: TransactionReportData[], filename: string, dateRange: { start: string, end: string }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('รายงานการเบิก-จ่าย');

  worksheet.columns = [
    { header: 'วันที่', key: 'date', width: 12 },
    { header: 'รหัสวัสดุ', key: 'materialCode', width: 15 },
    { header: 'ชื่อวัสดุ', key: 'materialName', width: 30 },
    { header: 'ประเภท', key: 'type', width: 10 },
    { header: 'จำนวน', key: 'quantity', width: 10 },
    { header: 'หน่วย', key: 'unit', width: 10 },
    { header: 'ผู้ทำรายการ', key: 'userName', width: 20 },
    { header: 'หน่วยงาน', key: 'department', width: 15 },
    { header: 'หมายเหตุ', key: 'note', width: 25 },
  ];

  worksheet.addRows(data.map(item => ({
    date: item.date,
    materialCode: item.materialCode,
    materialName: item.materialName,
    type: item.type === 'OUT' ? 'เบิก' : 'เพิ่ม',
    quantity: item.quantity,
    unit: item.unit,
    userName: item.userName,
    department: item.department || '-',
    note: item.note || '-',
  })));

  const outTransactions = data.filter(t => t.type === 'OUT');
  const inTransactions = data.filter(t => t.type === 'IN');

  const summarySheet = workbook.addWorksheet('สรุป');
  summarySheet.columns = [
    { header: 'รายการ', key: 'label', width: 25 },
    { header: 'ค่า', key: 'value', width: 20 },
  ];
  summarySheet.addRows([
    { label: 'ช่วงวันที่', value: `${dateRange.start} - ${dateRange.end}` },
    { label: 'รายการทั้งหมด', value: data.length },
    { label: 'รายการเบิก', value: outTransactions.length },
    { label: 'รายการเพิ่ม', value: inTransactions.length },
    { label: 'วันที่สร้างรายงาน', value: new Date().toLocaleDateString('th-TH') },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

// สร้าง Excel สำหรับรายงานคำขอซื้อ
export const generatePurchaseRequestExcel = async (data: PurchaseRequestReportData[], filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('รายงานคำขอซื้อ');

  worksheet.columns = [
    { header: 'วันที่ขอ', key: 'requestDate', width: 12 },
    { header: 'ผู้ขอ', key: 'requesterName', width: 20 },
    { header: 'หน่วยงาน', key: 'department', width: 15 },
    { header: 'สถานะ', key: 'status', width: 12 },
    { header: 'รายการที่ขอ', key: 'items', width: 40 },
    { header: 'เหตุผล', key: 'reason', width: 30 },
    { header: 'วันที่อนุมัติ', key: 'approvedDate', width: 12 },
  ];

  worksheet.addRows(data.map(item => ({
    requestDate: item.requestDate,
    requesterName: item.requesterName,
    department: item.department || '-',
    status: item.status === 'PENDING' ? 'รออนุมัติ' :
            item.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ',
    items: item.items,
    reason: item.reason,
    approvedDate: item.approvedDate || '-',
  })));

  const pendingRequests = data.filter(r => r.status === 'PENDING');
  const approvedRequests = data.filter(r => r.status === 'APPROVED');
  const rejectedRequests = data.filter(r => r.status === 'REJECTED');

  const summarySheet = workbook.addWorksheet('สรุป');
  summarySheet.columns = [
    { header: 'รายการ', key: 'label', width: 25 },
    { header: 'ค่า', key: 'value', width: 15 },
  ];
  summarySheet.addRows([
    { label: 'คำขอทั้งหมด', value: data.length },
    { label: 'รออนุมัติ', value: pendingRequests.length },
    { label: 'อนุมัติแล้ว', value: approvedRequests.length },
    { label: 'ปฏิเสธ', value: rejectedRequests.length },
    { label: 'วันที่สร้างรายงาน', value: new Date().toLocaleDateString('th-TH') },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};
