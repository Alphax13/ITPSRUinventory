// src/utils/htmldocsService.ts
import axios from 'axios';

const HTMLDOCS_API_URL = 'https://api.htmldocs.com/v1';
const HTMLDOCS_API_KEY = process.env.NEXT_PUBLIC_HTMLDOCS_API_KEY || '';

export interface HTMLDocsOptions {
  format?: 'pdf' | 'xlsx' | 'docx';
  landscape?: boolean;
  pageSize?: 'A4' | 'A3' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * แปลง HTML เป็น PDF, Excel หรือ Word ผ่าน HTMLDocs API
 */
export async function convertHTMLToDocument(
  html: string, 
  options: HTMLDocsOptions = {}
): Promise<Blob> {
  try {
    const {
      format = 'pdf',
      landscape = false,
      pageSize = 'A4',
      margin = { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    } = options;

    const response = await axios.post(
      `${HTMLDOCS_API_URL}/convert`,
      {
        html,
        format,
        options: {
          landscape,
          pageSize,
          margin,
          printBackground: true,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HTMLDOCS_API_KEY}`,
        },
        responseType: 'blob',
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error converting HTML to document:', error);
    throw new Error('Failed to convert HTML to document');
  }
}

/**
 * แปลง HTML template พร้อมข้อมูลเป็นเอกสาร
 */
export async function generateDocumentFromTemplate(
  templateHtml: string,
  data: Record<string, any>,
  options: HTMLDocsOptions = {}
): Promise<Blob> {
  // Replace placeholders ในรูปแบบ {{variable}}
  let processedHtml = templateHtml;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedHtml = processedHtml.replace(regex, String(data[key] || ''));
  });

  return convertHTMLToDocument(processedHtml, options);
}

/**
 * สร้าง PDF จาก HTML
 */
export async function generatePDF(html: string, options: Omit<HTMLDocsOptions, 'format'> = {}): Promise<Blob> {
  return convertHTMLToDocument(html, { ...options, format: 'pdf' });
}

/**
 * สร้าง Excel จาก HTML table
 */
export async function generateExcel(html: string): Promise<Blob> {
  return convertHTMLToDocument(html, { format: 'xlsx' });
}

/**
 * ดาวน์โหลดเอกสารที่สร้าง
 */
export function downloadDocument(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
