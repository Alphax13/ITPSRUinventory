// src/app/api/assets/borrow/[id]/undo-return/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const borrowId = id;

    // ตรวจสอบว่ารายการยืมมีอยู่จริง
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        fixedAsset: true,
      },
    });

    if (!borrow) {
      return NextResponse.json(
        { error: 'ไม่พบรายการยืมครุภัณฑ์' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าเคยคืนแล้วหรือยัง
    if (borrow.status !== 'RETURNED') {
      return NextResponse.json(
        { error: 'รายการนี้ยังไม่ได้ถูกบันทึกการคืน ไม่สามารถยกเลิกได้' },
        { status: 400 }
      );
    }

    // ยกเลิกการคืน: เปลี่ยนสถานะกลับเป็น BORROWED และลบวันที่คืน
    const updatedBorrow = await prisma.assetBorrow.update({
      where: { id: borrowId },
      data: {
        status: 'BORROWED',
        actualReturnDate: null,
      },
      include: {
        fixedAsset: true,
        user: true,
      },
    });

    return NextResponse.json({
      message: 'ยกเลิกการคืนเรียบร้อยแล้ว สถานะเปลี่ยนเป็น "กำลังยืม"',
      borrow: updatedBorrow,
    });

  } catch (error) {
    console.error('Error undoing return:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการยกเลิกการคืน',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
