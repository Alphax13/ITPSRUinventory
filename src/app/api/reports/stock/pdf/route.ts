// src/app/api/reports/stock/pdf/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateStockReportHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET() {
  try {
    // ดึงข้อมูลวัสดุทั้งหมด
    const materials = await prisma.consumableMaterial.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    const reportData = materials.map(material => ({
      id: material.id,
      name: material.name,
      category: material.category,
      currentStock: material.currentStock,
      minStock: material.minStock,
      unit: material.unit,
      location: material.location || '',
      status: material.currentStock === 0 ? 'หมด' : 
              material.currentStock <= material.minStock ? 'สต็อกต่ำ' : 'ปกติ'
    }));

    // สร้าง HTML จาก template
    const html = generateStockReportHTML(reportData);

    // แปลงเป็น PDF ด้วย Puppeteer
    const pdfBuffer = await generatePDFWithHeaderFooter(html, {
      format: 'A4',
      landscape: true,
    });

    // ส่งคืน PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stock-report-${Date.now()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating stock PDF report:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate stock PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
