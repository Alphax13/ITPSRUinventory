import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBorrowReportHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const borrowerType = searchParams.get('borrowerType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (borrowerType && borrowerType !== 'ALL') where.borrowerType = borrowerType;
    if (startDate || endDate) {
      where.borrowDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      };
    }

    const borrows = await prisma.assetBorrow.findMany({
      where,
      include: {
        fixedAsset: { select: { assetNumber: true, name: true } },
        user: { select: { name: true } },
      },
      orderBy: { borrowDate: 'desc' },
    });

    const reportData = borrows.map(b => ({
      borrowDate: b.borrowDate.toISOString(),
      assetNumber: b.fixedAsset.assetNumber,
      assetName: b.fixedAsset.name,
      borrowerType: b.borrowerType,
      borrowerName: b.user.name,
      studentName: b.studentName || undefined,
      studentId: b.studentId || undefined,
      borrowOnBehalfOf: b.borrowOnBehalfOf || undefined,
      expectedReturnDate: b.expectedReturnDate?.toISOString(),
      actualReturnDate: b.actualReturnDate?.toISOString(),
      status: b.status,
      purpose: b.purpose || undefined,
    }));

    const html = generateBorrowReportHTML(reportData, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || undefined,
      borrowerType: borrowerType || undefined,
    });

    const pdfBuffer = await generatePDFWithHeaderFooter(html, { format: 'A4', landscape: true });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="borrow-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating borrow PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
