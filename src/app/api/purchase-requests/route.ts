// src/app/api/purchase-requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงคำขอซื้อทั้งหมด
export async function GET() {
  try {
    const requests = await prisma.purchaseRequest.findMany({
      include: {
        requester: {
          select: { name: true, email: true, department: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase requests' }, { status: 500 });
  }
}

// POST: สร้างคำขอซื้อใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterId, items, reason } = body;

    if (!requesterId || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requesterId,
        items,
        reason: reason || '',
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { name: true, email: true, department: true },
        },
      },
    });

    return NextResponse.json(purchaseRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    return NextResponse.json({ 
      error: 'Failed to create purchase request: ' + (error as Error).message 
    }, { status: 500 });
  }
}

