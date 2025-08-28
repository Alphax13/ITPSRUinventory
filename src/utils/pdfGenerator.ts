// src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import type { Material } from '../app/dashboard/materials/page';

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
  material: {
    code: string;
    name: string;
  };
  user: {
    name: string;
  };
}

export interface ReportData {
  title: string;
  date: string;
  data: Material[] | Transaction[];
  headers: string[];
}

export const generateStockReport = async (materials: Material[]) => {
  const pdf = new jsPDF();
  
  // Set Thai font (you might need to configure this)
  pdf.setFont('helvetica');
  
  // Title
  pdf.setFontSize(20);
  pdf.text('รายงานสต็อกวัสดุ', 20, 30);
  
  // Date
  pdf.setFontSize(12);
  pdf.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 20, 45);
  
  // Headers
  let yPosition = 65;
  pdf.setFontSize(10);
  pdf.text('รหัส', 20, yPosition);
  pdf.text('ชื่อวัสดุ', 60, yPosition);
  pdf.text('หมวดหมู่', 120, yPosition);
  pdf.text('สต็อก', 160, yPosition);
  pdf.text('หน่วย', 180, yPosition);
  
  // Draw line
  pdf.line(20, yPosition + 5, 200, yPosition + 5);
  yPosition += 15;
  
  // Data rows
  materials.forEach((material) => {
    if (yPosition > 280) { // New page if needed
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.text(material.code, 20, yPosition);
    pdf.text(material.name.substring(0, 25), 60, yPosition); // Truncate long names
    pdf.text(material.category, 120, yPosition);
    pdf.text(material.currentStock.toString(), 160, yPosition);
    pdf.text(material.unit, 180, yPosition);
    
    yPosition += 12;
  });
  
  return pdf;
};

export const generateTransactionReport = async (transactions: Transaction[], startDate: string, endDate: string) => {
  const pdf = new jsPDF();
  
  pdf.setFont('helvetica');
  
  // Title
  pdf.setFontSize(20);
  pdf.text('รายงานการเบิก-จ่ายวัสดุ', 20, 30);
  
  // Date range
  pdf.setFontSize(12);
  pdf.text(`ระหว่างวันที่: ${startDate} - ${endDate}`, 20, 45);
  
  // Headers
  let yPosition = 65;
  pdf.setFontSize(9);
  pdf.text('วันที่', 20, yPosition);
  pdf.text('รหัส', 45, yPosition);
  pdf.text('วัสดุ', 70, yPosition);
  pdf.text('จำนวน', 120, yPosition);
  pdf.text('ประเภท', 145, yPosition);
  pdf.text('ผู้ใช้', 170, yPosition);
  
  // Draw line
  pdf.line(20, yPosition + 5, 200, yPosition + 5);
  yPosition += 15;
  
  // Data rows
  transactions.forEach((transaction) => {
    if (yPosition > 280) {
      pdf.addPage();
      yPosition = 30;
    }
    
    const date = new Date(transaction.createdAt).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit'
    });
    
    pdf.text(date, 20, yPosition);
    pdf.text(transaction.material.code, 45, yPosition);
    pdf.text(transaction.material.name.substring(0, 20), 70, yPosition);
    pdf.text(transaction.quantity.toString(), 120, yPosition);
    pdf.text(transaction.type === 'OUT' ? 'เบิก' : 'เพิ่ม', 145, yPosition);
    pdf.text(transaction.user.name.substring(0, 15), 170, yPosition);
    
    yPosition += 10;
  });
  
  return pdf;
};

export const downloadPDF = (pdf: jsPDF, filename: string) => {
  pdf.save(filename);
};
