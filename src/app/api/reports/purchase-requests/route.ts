// src/app/api/reports/purchase-requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
      approvedDate: request.updatedAt !== request.createdAt ? 
                   request.updatedAt.toISOString().split('T')[0] : ''
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching purchase request report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase request report data' },
      { status: 500 }
    );
  }
}
