// src/app/api/assets/return/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: คืนครุภัณฑ์
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      borrowId, 
      condition, 
      note 
    } = body;

    if (!borrowId) {
      return NextResponse.json({ 
        error: 'Borrow ID is required' 
      }, { status: 400 });
    }

    // หารายการยืม
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        fixedAsset: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!borrow) {
      return NextResponse.json({ error: 'Borrow record not found' }, { status: 404 });
    }

    if (borrow.status !== 'BORROWED' && borrow.status !== 'OVERDUE') {
      return NextResponse.json({ 
        error: 'This asset is not currently borrowed' 
      }, { status: 400 });
    }

    // อัปเดตสถานะการยืมและวันที่คืน
    const updatedBorrow = await prisma.assetBorrow.update({
      where: { id: borrowId },
      data: {
        status: 'RETURNED',
        actualReturnDate: new Date(),
        note: note ? `${borrow.note ? borrow.note + ' | ' : ''}คืน: ${note}` : borrow.note
      },
      include: {
        fixedAsset: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // อัปเดตสภาพครุภัณฑ์ (ถ้ามีการระบุ)
    if (condition && condition !== borrow.fixedAsset.condition) {
      await prisma.fixedAsset.update({
        where: { id: borrow.fixedAssetId },
        data: { condition }
      });
    }

    return NextResponse.json(updatedBorrow, { status: 200 });
  } catch (error) {
    console.error('Error returning asset:', error);
    return NextResponse.json({ 
      error: 'Failed to return asset: ' + (error as Error).message 
    }, { status: 500 });
  }
}
