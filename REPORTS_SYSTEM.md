# Reports System Documentation

## Overview
ระบบรายงานที่ปรับปรุงใหม่สำหรับ ITPSRUinventory สามารถสร้างและดาวน์โหลดรายงานในรูปแบบ PDF และ Excel ได้

## ประเภทรายงาน

### 1. 📊 รายงานสต็อกวัสดุ
- **ข้อมูลที่รวม**: รหัสวัสดุ, ชื่อวัสดุ, หมวดหมู่, สต็อกปัจจุบัน, สต็อกขั้นต่ำ, หน่วย, ตำแหน่งเก็บ, สถานะ
- **รายงานพิเศษ**: ระบุวัสดุที่สต็อกต่ำ
- **API Endpoint**: `/api/reports/stock`
- **รูปแบบ**: PDF และ Excel (.xlsx)

### 2. 📋 รายงานการเบิก-จ่าย
- **ข้อมูลที่รวม**: วันที่, รหัสวัสดุ, ชื่อวัสดุ, ประเภท (เบิก/เพิ่ม), จำนวน, หน่วย, ผู้ทำรายการ, หน่วยงาน
- **การกรองข้อมูล**: สามารถเลือกช่วงวันที่ได้
- **API Endpoint**: `/api/reports/transactions?startDate=&endDate=`
- **รูปแบบ**: PDF และ Excel (.xlsx)

### 3. 🛒 รายงานคำขอซื้อ
- **ข้อมูลที่รวม**: วันที่ขอ, ผู้ขอ, หน่วยงาน, สถานะ, รายการที่ขอ, เหตุผล, วันที่อนุมัติ
- **สถิติ**: แยกตามสถานะ (รออนุมัติ, อนุมัติแล้ว, ปฏิเสธ)
- **API Endpoint**: `/api/reports/purchase-requests`
- **รูปแบบ**: PDF และ Excel (.xlsx)

## คุณสมบัติของ Excel Reports

### Excel Structure
- **Main Sheet**: ข้อมูลหลักของรายงาน
- **Summary Sheet**: สรุปสถิติและข้อมูลภาพรวม
- **Auto Column Width**: ปรับขนาดคอลัมน์อัตโนมัติ
- **Thai Date Format**: รูปแบบวันที่ภาษาไทย

### Excel Features
- **Conditional Status**: แยกสีตามสถานะ
- **Summary Statistics**: สรุปข้อมูลสำคัญ
- **Professional Layout**: รูปแบบที่เป็นมาตรฐาน

## คุณสมบัติของ PDF Reports

### PDF Features
- **Multi-page Support**: รองรับข้อมูลหลายหน้า
- **Thai Text**: รองรับข้อความภาษาไทย
- **Header/Footer**: หัวเรื่องและท้ายเรื่องชัดเจน
- **Summary Page**: หน้าสรุปแยกต่างหาก

## การใช้งาน

### สำหรับ Admin
1. เข้าเมนู **รายงาน** จาก Sidebar
2. เลือกช่วงวันที่ (สำหรับรายงานการเบิก-จ่าย)
3. เลือกประเภทรายงานที่ต้องการ
4. คลิก **ดาวน์โหลด PDF** หรือ **ดาวน์โหลด Excel**

### Dashboard Statistics
แสดงสถิติเบื้องต้น:
- จำนวนวัสดุทั้งหมด
- จำนวนวัสดุที่สต็อกต่ำ
- จำนวนรายการเบิก-จ่าย (30 วันล่าสุด)
- จำนวนคำขอรออนุมัติ

## Technical Implementation

### Libraries Used
- **jsPDF**: สำหรับสร้างไฟล์ PDF
- **xlsx**: สำหรับสร้างไฟล์ Excel
- **file-saver**: สำหรับดาวน์โหลดไฟล์

### API Structure
```typescript
// Material Report Data
interface MaterialReportData {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  location: string;
  status: string;
}

// Transaction Report Data
interface TransactionReportData {
  id: string;
  date: string;
  materialCode: string;
  materialName: string;
  type: string;
  quantity: number;
  unit: string;
  userName: string;
  department: string;
}

// Purchase Request Report Data
interface PurchaseRequestReportData {
  id: string;
  requestDate: string;
  requesterName: string;
  department: string;
  status: string;
  items: string;
  reason: string;
  approvedDate: string;
}
```

### File Naming Convention
- **Stock Report**: `stock-report-YYYY-MM-DD.{pdf|xlsx}`
- **Transaction Report**: `transaction-report-YYYY-MM-DD-YYYY-MM-DD.{pdf|xlsx}`
- **Purchase Request Report**: `purchase-request-report-YYYY-MM-DD.{pdf|xlsx}`

## Security & Access Control
- เฉพาะ Admin เท่านั้นที่สามารถเข้าถึงหน้ารายงาน
- API endpoints มีการตรวจสอบสิทธิ์
- ข้อมูลถูกกรองตามสิทธิ์ผู้ใช้

## Error Handling
- Graceful error handling สำหรับการดึงข้อมูล
- User-friendly error messages
- Loading states ขณะสร้างรายงาน

## Performance Optimization
- Lazy loading สำหรับข้อมูลขนาดใหญ่
- Client-side file generation เพื่อลดภาระเซิร์ฟเวอร์
- Efficient database queries

## Future Enhancements
- [ ] กำหนดเวลาส่งรายงานอัตโนมัติ
- [ ] รายงานแบบ Dashboard
- [ ] การ Export แบบ Custom Fields
- [ ] รายงานเปรียบเทียบระหว่างช่วงเวลา
- [ ] รายงานแบบ Charts และ Graphs
