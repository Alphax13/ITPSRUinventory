// src/app/api/consumables/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, amount, userId, note } = body;

    // Validation
    if (!id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วนหรือจำนวนไม่ถูกต้อง' }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find the consumable material
      const consumable = await tx.consumableMaterial.findUnique({
        where: { id: id }
      });

      if (!consumable) {
        throw new Error('ไม่พบวัสดุที่ระบุ');
      }

      // Check if there's enough stock
      if (consumable.currentStock < amount) {
        throw new Error(`สต็อกไม่เพียงพอ มีเหลือ ${consumable.currentStock} ${consumable.unit}`);
      }

      // Calculate new stock
      const newStock = consumable.currentStock - amount;

      // Update stock
      const updatedConsumable = await tx.consumableMaterial.update({
        where: { id: id },
        data: {
          currentStock: newStock
        }
      });

      // Create transaction record
      const transaction = await tx.consumableTransaction.create({
        data: {
          consumableMaterialId: id,
          userId: userId || 'system', // Use provided userId or default to system
          quantity: amount,
          type: TransactionType.OUT,
          note: note || `เบิกวัสดุ ${consumable.name}`,
        },
        include: {
          consumableMaterial: {
            select: { name: true, unit: true, category: true }
          },
          user: {
            select: { name: true, department: true }
          }
        }
      });

      return {
        transaction,
        updatedConsumable,
        message: `เบิกวัสดุ ${consumable.name} จำนวน ${amount} ${consumable.unit} เรียบร้อยแล้ว`
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเบิกวัสดุ';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
