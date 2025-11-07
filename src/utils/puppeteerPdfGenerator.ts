// src/utils/puppeteerPdfGenerator.ts
import puppeteer from 'puppeteer';

interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

/**
 * สร้าง PDF จาก HTML ด้วย Puppeteer
 * รองรับภาษาไทย 100%, ฟรี, คุณภาพสูง
 */
export async function generatePDFFromHTML(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  let browser;
  
  try {
    // เปิด browser (headless)
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // โหลด HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0', // รอให้โหลด fonts และรูปภาพเสร็จ
    });

    // สร้าง PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm',
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      printBackground: true, // พิมพ์สีและ background
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * สร้าง PDF พร้อมหัวกระดาษและท้ายกระดาษ
 */
export async function generatePDFWithHeaderFooter(
  html: string,
  options: PDFOptions & {
    headerHtml?: string;
    footerHtml?: string;
  } = {}
): Promise<Buffer> {
  // Header และ Footer templates (ต้องเป็น HTML พิเศษของ Puppeteer)
  const headerTemplate = options.headerHtml || `
    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 1cm;">
      <span style="color: #64748b;">สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏสุราษฎร์ธานี</span>
    </div>
  `;

  const footerTemplate = options.footerHtml || `
    <div style="font-size: 9px; text-align: center; width: 100%; color: #94a3b8; margin: 0 1cm;">
      <span>หน้า <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
      <span style="margin-left: 20px;">พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
    </div>
  `;

  return generatePDFFromHTML(html, {
    ...options,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {
      top: '2.5cm',    // เพิ่มระยะเพื่อให้พอกับ header
      right: '1.5cm',
      bottom: '2cm',   // เพิ่มระยะเพื่อให้พอกับ footer
      left: '1.5cm',
      ...options.margin,
    },
  });
}
