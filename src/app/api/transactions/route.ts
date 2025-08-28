// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// GET: ดึงประวัติการทำรายการทั้งหมด
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: { name: true, department: true },
        },
        material: {
          select: { name: true, code: true, unit: true },
        },
      },
    });
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 });
  }
}

// POST: สร้างรายการเบิก-จ่ายใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, materialId, quantity, reason, type } = body;

    if (!userId || !materialId || !quantity || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transactionType = type === 'OUT' ? TransactionType.OUT : TransactionType.IN;

    const result = await prisma.$transaction(async (prisma) => {
      const newTransaction = await prisma.transaction.create({
        data: {
          userId: userId,
          materialId: materialId,
          quantity: parseInt(quantity, 10),
          reason: reason,
          type: transactionType,
        },
      });

      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        throw new Error('Material not found');
      }

      let newStock = material.currentStock;
      if (transactionType === TransactionType.OUT) {
        newStock -= parseInt(quantity, 10);
      } else {
        newStock += parseInt(quantity, 10);
      }

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      await prisma.material.update({
        where: { id: materialId },
        data: {
          currentStock: newStock,
        },
      });

      return newTransaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction: ' + (error as Error).message }, { status: 500 });
  }
}