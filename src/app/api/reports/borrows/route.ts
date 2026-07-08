import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        fixedAsset: { select: { assetNumber: true, name: true, category: true } },
        user: { select: { name: true, department: true } },
      },
      orderBy: { borrowDate: 'desc' },
    });

    const reportData = borrows.map(b => ({
      id: b.id,
      borrowDate: b.borrowDate.toISOString(),
      assetNumber: b.fixedAsset.assetNumber,
      assetName: b.fixedAsset.name,
      assetCategory: b.fixedAsset.category,
      borrowerType: b.borrowerType,
      borrowerName: b.user.name,
      department: b.user.department,
      studentName: b.studentName || '',
      studentId: b.studentId || '',
      borrowOnBehalfOf: b.borrowOnBehalfOf || '',
      expectedReturnDate: b.expectedReturnDate?.toISOString() || null,
      actualReturnDate: b.actualReturnDate?.toISOString() || null,
      status: b.status,
      purpose: b.purpose || '',
      note: b.note || '',
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching borrow report data:', error);
    return NextResponse.json({ error: 'Failed to fetch borrow report data' }, { status: 500 });
  }
}
