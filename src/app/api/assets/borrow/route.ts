// src/app/api/assets/borrow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';

// GET: ดึงรายการการยืมทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // BORROWED, RETURNED, OVERDUE, LOST
    const userId = searchParams.get('userId');
    
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const borrows = await prisma.assetBorrow.findMany({
      where,
      include: {
        fixedAsset: {
          select: {
            id: true,
            assetNumber: true,
            name: true,
            category: true,
            brand: true,
            model: true,
            location: true,
            condition: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(borrows, { status: 200 });
  } catch (error) {
    console.error('Error fetching asset borrows:', error);
    return NextResponse.json({ error: 'Failed to fetch asset borrows' }, { status: 500 });
  }
}

// POST: ยืมครุภัณฑ์ (รองรับทั้งรายการเดียวและหลายรายการ)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fixedAssetId,      // single (backward compat)
      fixedAssetIds,     // multi
      userId, 
      borrowerType,
      expectedReturnDate, 
      purpose, 
      note,
      studentName,
      studentId,
      borrowOnBehalfOf
    } = body;

    // รองรับทั้ง single และ multi
    const assetIds: string[] = fixedAssetIds?.length
      ? fixedAssetIds
      : fixedAssetId
      ? [fixedAssetId]
      : [];

    if (assetIds.length === 0 || !userId) {
      return NextResponse.json({ 
        error: 'Asset ID(s) and User ID are required' 
      }, { status: 400 });
    }

    // ตรวจสอบทุกครุภัณฑ์
    const assets = await prisma.fixedAsset.findMany({
      where: { id: { in: assetIds } }
    });

    if (assets.length !== assetIds.length) {
      return NextResponse.json({ error: 'Some assets not found' }, { status: 404 });
    }

    const unavailable = assets.filter(a => a.condition === 'DISPOSED' || a.condition === 'DAMAGED');
    if (unavailable.length > 0) {
      return NextResponse.json({ 
        error: `ครุภัณฑ์ต่อไปนี้ไม่พร้อมให้ยืม: ${unavailable.map(a => a.name).join(', ')}` 
      }, { status: 400 });
    }

    // ตรวจสอบว่าถูกยืมอยู่หรือไม่
    const alreadyBorrowed = await prisma.assetBorrow.findMany({
      where: { fixedAssetId: { in: assetIds }, status: 'BORROWED' },
      include: { fixedAsset: { select: { name: true } } }
    });

    if (alreadyBorrowed.length > 0) {
      return NextResponse.json({ 
        error: `ครุภัณฑ์ต่อไปนี้ถูกยืมอยู่แล้ว: ${alreadyBorrowed.map(b => b.fixedAsset.name).join(', ')}` 
      }, { status: 400 });
    }

    // สร้างรายการยืมทั้งหมดใน transaction
    const borrowData = assetIds.map(id => ({
      fixedAssetId: id,
      userId,
      borrowerType: borrowerType || 'LECTURER',
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      purpose: purpose || null,
      note: note || null,
      studentName: studentName || null,
      studentId: studentId || null,
      borrowOnBehalfOf: borrowOnBehalfOf || null,
      status: 'BORROWED' as const,
    }));

    const createdBorrows = await prisma.$transaction(
      borrowData.map(data => prisma.assetBorrow.create({
        data,
        include: {
          fixedAsset: { select: { assetNumber: true, name: true, category: true } },
          user: { select: { name: true, email: true } }
        }
      }))
    );

    // แจ้งเตือน Admin
    for (const borrow of createdBorrows) {
      try {
        await NotificationService.notifyAssetBorrow(borrow.id);
      } catch (notificationError) {
        console.error('Error sending borrow notification:', notificationError);
      }
    }

    // ส่งคืน single object หากยืมเดียว (backward compat), array หากหลายรายการ
    return NextResponse.json(
      createdBorrows.length === 1 ? createdBorrows[0] : createdBorrows,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating asset borrow:', error);
    return NextResponse.json({ 
      error: 'Failed to create asset borrow: ' + (error as Error).message 
    }, { status: 500 });
  }
}
