// src/app/api/assets/borrow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงรายการการยืมทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // BORROWED, RETURNED, OVERDUE, LOST
    const userId = searchParams.get('userId');
    
    const where: any = {};
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

// POST: ยืมครุภัณฑ์
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fixedAssetId, 
      userId, 
      expectedReturnDate, 
      purpose, 
      note 
    } = body;

    if (!fixedAssetId || !userId) {
      return NextResponse.json({ 
        error: 'Asset ID and User ID are required' 
      }, { status: 400 });
    }

    // ตรวจสอบว่าครุภัณฑ์นี้ถูกยืมอยู่หรือไม่
    const existingBorrow = await prisma.assetBorrow.findFirst({
      where: {
        fixedAssetId,
        status: 'BORROWED'
      }
    });

    if (existingBorrow) {
      return NextResponse.json({ 
        error: 'This asset is currently borrowed' 
      }, { status: 400 });
    }

    // ตรวจสอบสภาพครุภัณฑ์
    const asset = await prisma.fixedAsset.findUnique({
      where: { id: fixedAssetId }
    });

    if (!asset) {
      return NextResponse.json({ 
        error: 'Asset not found' 
      }, { status: 404 });
    }

    if (asset.condition === 'DISPOSED' || asset.condition === 'DAMAGED') {
      return NextResponse.json({ 
        error: 'Asset is not available for borrowing' 
      }, { status: 400 });
    }

    // สร้างรายการยืม
    const borrow = await prisma.assetBorrow.create({
      data: {
        fixedAssetId,
        userId,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        purpose: purpose || null,
        note: note || null,
        status: 'BORROWED'
      },
      include: {
        fixedAsset: {
          select: {
            assetNumber: true,
            name: true,
            category: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(borrow, { status: 201 });
  } catch (error) {
    console.error('Error creating asset borrow:', error);
    return NextResponse.json({ 
      error: 'Failed to create asset borrow: ' + (error as Error).message 
    }, { status: 500 });
  }
}
