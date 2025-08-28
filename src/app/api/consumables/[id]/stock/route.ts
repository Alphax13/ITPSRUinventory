// src/app/api/consumables/[id]/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adjustment } = body; // adjustment สามารถเป็นบวกหรือลบได้

    // ตรวจสอบว่า consumable มีอยู่จริง
    const consumable = await prisma.consumableMaterial.findUnique({
      where: { id: id }
    });

    if (!consumable) {
      return NextResponse.json({ error: 'ไม่พบวัสดุที่ระบุ' }, { status: 404 });
    }

    const newStock = consumable.currentStock + adjustment;

    // ตรวจสอบว่าสต็อคไม่เป็นลบ
    if (newStock < 0) {
      return NextResponse.json({ error: 'สต็อคไม่สามารถเป็นลบได้' }, { status: 400 });
    }

    // อัปเดตสต็อค
    const updatedConsumable = await prisma.consumableMaterial.update({
      where: { id: id },
      data: {
        currentStock: newStock
      }
    });

    // TODO: บันทึกประวัติการปรับสต็อค (ถ้าต้องการ)
    /*
    await prisma.stockAdjustment.create({
      data: {
        consumableMaterialId: params.id,
        adjustment,
        reason: reason || null,
        userId: 'current-user-id', // ต้องดึงจาก auth
        createdAt: new Date()
      }
    });
    */

    return NextResponse.json(updatedConsumable);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
