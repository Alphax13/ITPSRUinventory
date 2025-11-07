// src/app/api/reports/purchase-requests/pdf/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePurchaseRequestReportHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET() {
  try {
    // ดึงข้อมูลคำขอซื้อ
    const requests = await prisma.purchaseRequest.findMany({
      include: {
        requester: {
          select: {
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const reportData = requests.map(request => ({
      id: request.id,
      requestDate: request.createdAt.toISOString().split('T')[0],
      requesterName: request.requester.name,
      department: request.requester.department || '',
      status: request.status,
      items: JSON.stringify(request.items),
      reason: request.reason,
    }));

    // สร้าง HTML จาก template
    const html = generatePurchaseRequestReportHTML(reportData);

    // แปลงเป็น PDF ด้วย Puppeteer
    const pdfBuffer = await generatePDFWithHeaderFooter(html, {
      format: 'A4',
      landscape: true,
    });

    // ส่งคืน PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase-requests-report-${Date.now()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating purchase requests PDF report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate purchase requests PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
