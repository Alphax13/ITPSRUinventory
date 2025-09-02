// src/app/api/assets/borrow/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงข้อมูลการยืมเฉพาะ ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id },
      include: {
        fixedAsset: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    if (!borrow) {
      return NextResponse.json({ error: 'Borrow record not found' }, { status: 404 });
    }

    return NextResponse.json(borrow, { status: 200 });
  } catch (error) {
    console.error('Error fetching borrow:', error);
    return NextResponse.json({ error: 'Failed to fetch borrow record' }, { status: 500 });
  }
}

// PUT: อัปเดตการยืม (คืนครุภัณฑ์หรือแก้ไขข้อมูล)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      status, 
      actualReturnDate, 
      expectedReturnDate, 
      purpose, 
      note 
    } = body;

    const borrow = await prisma.assetBorrow.findUnique({
      where: { id }
    });

    if (!borrow) {
      return NextResponse.json({ error: 'Borrow record not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (status) updateData.status = status;
    if (actualReturnDate !== undefined) updateData.actualReturnDate = actualReturnDate ? new Date(actualReturnDate) : null;
    if (expectedReturnDate !== undefined) updateData.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : null;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (note !== undefined) updateData.note = note;

    // ถ้าสถานะเป็น RETURNED และยังไม่มีวันที่คืนจริง ให้ตั้งเป็นปัจจุบัน
    if (status === 'RETURNED' && !actualReturnDate && !borrow.actualReturnDate) {
      updateData.actualReturnDate = new Date();
    }

    const updatedBorrow = await prisma.assetBorrow.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedBorrow, { status: 200 });
  } catch (error) {
    console.error('Error updating borrow:', error);
    return NextResponse.json({ 
      error: 'Failed to update borrow record: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// DELETE: ลบรายการยืม (เฉพาะกรณีที่ยังไม่ได้คืน)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id }
    });

    if (!borrow) {
      return NextResponse.json({ error: 'Borrow record not found' }, { status: 404 });
    }

    if (borrow.status === 'RETURNED') {
      return NextResponse.json({ 
        error: 'Cannot delete returned borrow record' 
      }, { status: 400 });
    }

    await prisma.assetBorrow.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Borrow record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting borrow:', error);
    return NextResponse.json({ 
      error: 'Failed to delete borrow record: ' + (error as Error).message 
    }, { status: 500 });
  }
}
