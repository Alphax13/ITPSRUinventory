// src/app/api/reports/transactions/pdf/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTransactionReportHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล transactions
    const transactions = await prisma.consumableTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z')
        }
      },
      include: {
        consumableMaterial: {
          select: {
            name: true,
            unit: true
          }
        },
        user: {
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

    const reportData = transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.createdAt.toISOString().split('T')[0],
      materialName: transaction.consumableMaterial.name,
      type: transaction.type,
      quantity: transaction.quantity,
      unit: transaction.consumableMaterial.unit,
      userName: transaction.user?.name || 'System',
      department: transaction.user?.department || '',
      note: transaction.note || ''
    }));

    // สร้าง HTML จาก template
    const html = generateTransactionReportHTML(reportData, startDate, endDate);

    // แปลงเป็น PDF ด้วย Puppeteer
    const pdfBuffer = await generatePDFWithHeaderFooter(html, {
      format: 'A4',
      landscape: true,
    });

    // ส่งคืน PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transactions-report-${Date.now()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating transactions PDF report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate transactions PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
