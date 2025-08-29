// src/app/api/purchase-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: อัปเดตสถานะคำขอซื้อ
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminId } = body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็น
    if (!status || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ตรวจสอบว่า admin มีสิทธิ์หรือไม่
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // ตรวจสอบว่าสถานะที่ส่งมาถูกต้องหรือไม่
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // อัปเดตสถานะคำขอซื้อ
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: { name: true, email: true, department: true },
        },
      },
    });

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error('Error updating purchase request:', error);
    return NextResponse.json({ 
      error: 'Failed to update purchase request: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// GET: ดึงข้อมูลคำขอซื้อตาม ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { name: true, email: true, department: true },
        },
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
    }

    return NextResponse.json(purchaseRequest, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch purchase request: ' + (error as Error).message 
    }, { status: 500 });
  }
}
