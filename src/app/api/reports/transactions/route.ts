// src/app/api/reports/transactions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      materialCode: transaction.consumableMaterialId,
      materialName: transaction.consumableMaterial.name,
      type: transaction.type,
      quantity: transaction.quantity,
      unit: transaction.consumableMaterial.unit,
      userName: transaction.user?.name || 'System',
      department: transaction.user?.department || '',
      note: transaction.note || ''
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching transaction report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction report data' },
      { status: 500 }
    );
  }
}
