// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET: ดึงประวัติการทำรายการ (ผู้ใช้เห็นเฉพาะของตัวเอง, ADMIN เห็นทั้งหมด)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user')?.value;
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie);
    const isAdmin = currentUser.role === 'ADMIN';

    // สร้าง where condition สำหรับการกรองข้อมูล
    const userFilter = isAdmin ? {} : { userId: currentUser.id };

    // ดึงข้อมูลจากทั้ง ConsumableTransaction และ Transaction (legacy)
    const [consumableTransactions, legacyTransactions] = await Promise.all([
      prisma.consumableTransaction.findMany({
        where: userFilter,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: { name: true, department: true },
          },
          consumableMaterial: {
            select: { name: true, unit: true, category: true },
          },
        },
      }),
      prisma.transaction.findMany({
        where: userFilter,
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
      })
    ]);

    // รวมข้อมูลและปรับโครงสร้างให้เหมือนกัน
    const allTransactions = [
      ...consumableTransactions.map(tx => ({
        id: tx.id,
        quantity: tx.quantity,
        type: tx.type,
        reason: tx.note,
        createdAt: tx.createdAt.toISOString(),
        user: tx.user,
        material: {
          name: tx.consumableMaterial.name,
          code: `CON-${tx.consumableMaterialId.slice(-6)}`, // สร้างรหัสชั่วคราว
          unit: tx.consumableMaterial.unit,
        },
        source: 'consumable' as const
      })),
      ...legacyTransactions.map(tx => ({
        id: tx.id,
        quantity: tx.quantity,
        type: tx.type,
        reason: tx.reason,
        createdAt: tx.createdAt.toISOString(),
        user: tx.user,
        material: tx.material,
        source: 'legacy' as const
      }))
    ];

    // เรียงลำดับตามวันที่ล่าสุดก่อน
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allTransactions, { status: 200 });
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