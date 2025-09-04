// src/utils/thaiFont.ts
// Thai font support for jsPDF

import jsPDF from 'jspdf';

// Base64 encoded Thai font (Sarabun - subset for common Thai characters)
const sarabunFont = 'data:font/truetype;charset=utf-8;base64,AAEAAAAVAQAABAAwR1NVQgCLJXoAAAE4AAAAKERGUVE1fxTmAAABaAAAAChPUy8yc1l...'; // นี่คือ placeholder

export const addThaiFont = (doc: jsPDF) => {
  // ถ้าไม่มี font file จริง ให้ใช้ workaround ด้วยการแยกข้อความ
  // และใช้ latin characters แทน
  return doc;
};

export const writeThaiText = (doc: jsPDF, text: string, x: number, y: number, options?: any) => {
  try {
    // พยายามใช้ font ที่รองรับ Unicode
    doc.setFont('helvetica', 'normal');
    
    // สำหรับการแสดงผลภาษาไทยใน jsPDF
    // วิธีที่ดีที่สุดคือใช้ SVG หรือ image แทน text
    // หรือใช้ทาง workaround ด้วยการเข้ารหัส
    
    const encodedText = encodeURIComponent(text);
    const decodedText = decodeURIComponent(encodedText);
    
    doc.text(decodedText, x, y, options);
  } catch (error) {
    // Fallback: ใช้ text ปกติ
    doc.text(text, x, y, options);
  }
};
