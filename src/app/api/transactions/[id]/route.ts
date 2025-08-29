// src/app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// GET: ดึงข้อมูล transaction เดียว
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ลองหาใน Transaction (legacy) ก่อน
    const legacyTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, department: true } },
        material: { select: { name: true, code: true, unit: true } }
      }
    });

    if (legacyTransaction) {
      return NextResponse.json({
        ...legacyTransaction,
        source: 'legacy'
      });
    }

    // ถ้าไม่พบ ลองหาใน ConsumableTransaction
    const consumableTransaction = await prisma.consumableTransaction.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, department: true } },
        consumableMaterial: { select: { name: true, unit: true, category: true } }
      }
    });

    if (consumableTransaction) {
      return NextResponse.json({
        ...consumableTransaction,
        source: 'consumable'
      });
    }

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

// PUT: แก้ไข transaction (เฉพาะ legacy transactions เท่านั้น)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, reason, type, adminId } = body;

    // ตรวจสอบสิทธิ์ admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // ตรวจสอบว่าเป็น legacy transaction หรือไม่
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { material: true }
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or cannot be edited' }, { status: 404 });
    }

    // อัปเดต transaction ในฐานข้อมูล
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // คำนวณการเปลี่ยนแปลง stock หาก material ยังอยู่
      if (existingTransaction.material && existingTransaction.materialId) {
        const oldQuantity = existingTransaction.quantity;
        const oldType = existingTransaction.type;
        const newQuantity = parseInt(quantity, 10);
        const newType = type as TransactionType;

        // คืนค่า stock เดิม
        let stockAdjustment = 0;
        if (oldType === TransactionType.OUT) {
          stockAdjustment += oldQuantity; // คืนที่เบิกไป
        } else {
          stockAdjustment -= oldQuantity; // ลบที่เพิ่มเข้า
        }

        // ใช้ค่าใหม่
        if (newType === TransactionType.OUT) {
          stockAdjustment -= newQuantity; // เบิกใหม่
        } else {
          stockAdjustment += newQuantity; // เพิ่มใหม่
        }

        const newStock = existingTransaction.material.currentStock + stockAdjustment;
        if (newStock < 0) {
          throw new Error('Insufficient stock for this change');
        }

        // อัปเดต stock
        await tx.material.update({
          where: { id: existingTransaction.materialId },
          data: { currentStock: newStock }
        });
      }

      // อัปเดต transaction
      return await tx.transaction.update({
        where: { id },
        data: {
          quantity: parseInt(quantity, 10),
          reason,
          type: type as TransactionType
        },
        include: {
          user: { select: { name: true, department: true } },
          material: { select: { name: true, code: true, unit: true } }
        }
      });
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to update transaction: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// DELETE: ลบ transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId } = body;

    // ตรวจสอบสิทธิ์ admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // ลองหาใน Transaction (legacy) ก่อน
    const legacyTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { material: true }
    });

    if (legacyTransaction) {
      await prisma.$transaction(async (tx) => {
        // คืนค่า stock หาก material ยังอยู่
        if (legacyTransaction.material && legacyTransaction.materialId) {
          let stockAdjustment = 0;
          if (legacyTransaction.type === TransactionType.OUT) {
            stockAdjustment = legacyTransaction.quantity; // คืนที่เบิกไป
          } else {
            stockAdjustment = -legacyTransaction.quantity; // ลบที่เพิ่มเข้า
          }

          await tx.material.update({
            where: { id: legacyTransaction.materialId },
            data: { 
              currentStock: legacyTransaction.material.currentStock + stockAdjustment 
            }
          });
        }

        // ลบ transaction
        await tx.transaction.delete({
          where: { id }
        });
      });

      return NextResponse.json({ message: 'Transaction deleted successfully' });
    }

    // ลองหาใน ConsumableTransaction
    const consumableTransaction = await prisma.consumableTransaction.findUnique({
      where: { id },
      include: { consumableMaterial: true }
    });

    if (consumableTransaction) {
      await prisma.$transaction(async (tx) => {
        // คืนค่า stock
        let stockAdjustment = 0;
        if (consumableTransaction.type === TransactionType.OUT) {
          stockAdjustment = consumableTransaction.quantity; // คืนที่เบิกไป
        } else {
          stockAdjustment = -consumableTransaction.quantity; // ลบที่เพิ่มเข้า
        }

        await tx.consumableMaterial.update({
          where: { id: consumableTransaction.consumableMaterialId },
          data: { 
            currentStock: consumableTransaction.consumableMaterial.currentStock + stockAdjustment 
          }
        });

        // ลบ transaction
        await tx.consumableTransaction.delete({
          where: { id }
        });
      });

      return NextResponse.json({ message: 'Transaction deleted successfully' });
    }

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to delete transaction: ' + (error as Error).message 
    }, { status: 500 });
  }
}

