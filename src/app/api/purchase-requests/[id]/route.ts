// src/app/api/purchase-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';

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

    // แจ้งเตือนผู้ขอเมื่อคำขอได้รับการอนุมัติหรือปฏิเสธ
    try {
      await NotificationService.notifyPurchaseRequestApproval(id, status);
    } catch (notificationError) {
      console.error('Error sending purchase request approval notification:', notificationError);
      // ไม่ให้ notification error ทำให้ transaction fail
    }

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

// DELETE: ลบคำขอซื้อ (เฉพาะ Admin เท่านั้น)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId } = body;

    console.log('DELETE request data:', { id, adminId, body });

    // ตรวจสอบว่ามี adminId
    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // ตรวจสอบว่า admin มีสิทธิ์หรือไม่
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    console.log('Admin found:', admin ? { id: admin.id, role: admin.role, name: admin.name } : null);

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (admin.role !== 'ADMIN') {
      console.log('User role mismatch:', admin.role, 'Expected: ADMIN');
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // ตรวจสอบว่าคำขอซื้อมีอยู่หรือไม่
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
    }

    // ลบคำขอซื้อ
    await prisma.purchaseRequest.delete({
      where: { id },
    });

    console.log('Purchase request deleted successfully:', id);
    return NextResponse.json({ message: 'Purchase request deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    return NextResponse.json({ 
      error: 'Failed to delete purchase request: ' + (error as Error).message 
    }, { status: 500 });
  }
}
