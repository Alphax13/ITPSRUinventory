// src/utils/thaiPdfGenerator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MaterialReportData, TransactionReportData, PurchaseRequestReportData } from './excelGenerator';

// สร้าง HTML template สำหรับรายงาน
const createStockReportHTML = (materials: MaterialReportData[]) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .date { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-normal { color: green; }
            .status-low { color: orange; }
            .status-empty { color: red; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">รายงานสต็อกวัสดุ</div>
            <div class="date">วันที่: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>รหัส</th>
                    <th>ชื่อวัสดุ</th>
                    <th>หมวดหมู่</th>
                    <th>สต็อกปัจจุบัน</th>
                    <th>สต็อกขั้นต่ำ</th>
                    <th>หน่วย</th>
                    <th>ตำแหน่งเก็บ</th>
                    <th>สถานะ</th>
                </tr>
            </thead>
            <tbody>
                ${materials.map(material => `
                    <tr>
                        <td>${material.code}</td>
                        <td>${material.name}</td>
                        <td>${material.category}</td>
                        <td>${material.currentStock}</td>
                        <td>${material.minStock}</td>
                        <td>${material.unit}</td>
                        <td>${material.location}</td>
                        <td class="status-${material.status === 'ปกติ' ? 'normal' : material.status === 'สต็อกต่ำ' ? 'low' : 'empty'}">${material.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
  `;
};

const createTransactionReportHTML = (transactions: TransactionReportData[], startDate: string, endDate: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .date-range { font-size: 14px; color: #666; margin-bottom: 5px; }
            .date { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .type-in { color: green; }
            .type-out { color: red; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">รายงานการเบิก-จ่ายวัสดุ</div>
            <div class="date-range">ระหว่างวันที่: ${startDate} - ${endDate}</div>
            <div class="date">วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>วันที่</th>
                    <th>รหัสวัสดุ</th>
                    <th>ชื่อวัสดุ</th>
                    <th>ประเภท</th>
                    <th>จำนวน</th>
                    <th>หน่วย</th>
                    <th>ผู้ทำรายการ</th>
                    <th>หน่วยงาน</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(transaction => `
                    <tr>
                        <td>${transaction.date}</td>
                        <td>${transaction.materialCode}</td>
                        <td>${transaction.materialName}</td>
                        <td class="type-${transaction.type === 'OUT' ? 'out' : 'in'}">${transaction.type === 'OUT' ? 'เบิก' : 'เพิ่ม'}</td>
                        <td>${transaction.quantity}</td>
                        <td>${transaction.unit}</td>
                        <td>${transaction.userName}</td>
                        <td>${transaction.department || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
  `;
};

const createPurchaseRequestReportHTML = (requests: PurchaseRequestReportData[]) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .date { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-pending { color: orange; }
            .status-approved { color: green; }
            .status-rejected { color: red; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">รายงานคำขอซื้อ</div>
            <div class="date">วันที่: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>วันที่ขอ</th>
                    <th>ผู้ขอ</th>
                    <th>หน่วยงาน</th>
                    <th>สถานะ</th>
                    <th>รายการที่ขอ</th>
                    <th>เหตุผล</th>
                    <th>วันที่อนุมัติ</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr>
                        <td>${request.requestDate}</td>
                        <td>${request.requesterName}</td>
                        <td>${request.department || '-'}</td>
                        <td class="status-${request.status.toLowerCase()}">${request.status === 'PENDING' ? 'รออนุมัติ' : request.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}</td>
                        <td>${request.items.substring(0, 100)}${request.items.length > 100 ? '...' : ''}</td>
                        <td>${request.reason}</td>
                        <td>${request.approvedDate || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
  `;
};

// สร้าง PDF จาก HTML
const generatePDFFromHTML = async (html: string): Promise<jsPDF> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timeout'));
    }, 15000); // เพิ่ม timeout เป็น 15 วินาที

    // สร้าง iframe ชั่วคราวเพื่อ render HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.width = '794px'; // A4 width in pixels
    iframe.style.height = '1123px'; // A4 height in pixels
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error('Cannot access iframe document');

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // รอให้ fonts โหลดเสร็จ
        await new Promise(resolve => setTimeout(resolve, 2000)); // เพิ่มเวลารอ

        // สร้าง canvas จาก HTML
        const canvas = await html2canvas(iframeDoc.body, {
          width: 794,
          height: 1123,
          scale: 1, // ลด scale ลงเพื่อประสิทธิภาพดีขึ้น
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false // ปิด logging
        });

        // สร้าง PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const imgData = canvas.toDataURL('image/png');
        let position = 0;

        // เพิ่มหน้าแรก
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // เพิ่มหน้าใหม่หากจำเป็น
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // ทำความสะอาด
        document.body.removeChild(iframe);
        clearTimeout(timeout);
        resolve(pdf);
      } catch (error) {
        document.body.removeChild(iframe);
        clearTimeout(timeout);
        reject(error);
      }
    };

    iframe.onerror = () => {
      document.body.removeChild(iframe);
      clearTimeout(timeout);
      reject(new Error('Failed to load iframe'));
    };
  });
};

// Export functions สำหรับใช้งาน
export const generateThaiStockPDF = async (materials: MaterialReportData[]) => {
  const html = createStockReportHTML(materials);
  return await generatePDFFromHTML(html);
};

export const generateThaiTransactionPDF = async (transactions: TransactionReportData[], startDate: string, endDate: string) => {
  const html = createTransactionReportHTML(transactions, startDate, endDate);
  return await generatePDFFromHTML(html);
};

export const generateThaiPurchaseRequestPDF = async (requests: PurchaseRequestReportData[]) => {
  const html = createPurchaseRequestReportHTML(requests);
  return await generatePDFFromHTML(html);
};

// ฟังก์ชันช่วยในการดาวน์โหลด PDF
export const downloadPDF = (pdf: jsPDF, filename: string) => {
  pdf.save(filename);
};
