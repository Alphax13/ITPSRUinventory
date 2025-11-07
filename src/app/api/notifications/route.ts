// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงรายการการแจ้งเตือนของผู้ใช้
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const whereCondition: any = { userId };
    if (unreadOnly) {
      whereCondition.isRead = false;
    }

    // ใช้ Promise.all เพื่อรัน queries พร้อมกัน แทนการรันทีละตัว
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        // ลบ user relation ออก เพราะไม่จำเป็นต้องใช้ในหน้า notification list
        select: {
          id: true,
          userId: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          actionUrl: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // นับจำนวน notifications ที่ยังไม่อ่าน
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST: สร้างการแจ้งเตือนใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, message, type = 'INFO', actionUrl, metadata } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'UserId, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
        metadata,
      },
      // ลบ user relation ออกเพราะไม่จำเป็น
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        actionUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH: อัพเดตสถานะการอ่าน
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationIds, isRead = true } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        isRead,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
