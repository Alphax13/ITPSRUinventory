// src/app/api/notifications/mark-all-read/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
