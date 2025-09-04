// src/app/api/purchase-requests/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';

// GET: ดึงคำขอซื้อตามสิทธิ์ผู้ใช้
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    let whereCondition = {};

    // ถ้าไม่ใช่ ADMIN จะเห็นเฉพาะคำขอของตัวเอง
    if (user.role !== 'ADMIN') {
      whereCondition = { requesterId: user.id };
    }

    const requests = await prisma.purchaseRequest.findMany({
      where: whereCondition,
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

    // แจ้งเตือน Admin เมื่อมีคำขอซื้อใหม่
    try {
      await NotificationService.notifyNewPurchaseRequest(purchaseRequest.id, requesterId);
    } catch (notificationError) {
      console.error('Error sending purchase request notification:', notificationError);
      // ไม่ให้ notification error ทำให้ transaction fail
    }

    return NextResponse.json(purchaseRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    return NextResponse.json({ 
      error: 'Failed to create purchase request: ' + (error as Error).message 
    }, { status: 500 });
  }
}

