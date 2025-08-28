// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // นับจำนวนวัสดุสิ้นเปลืองทั้งหมด
    const totalConsumables = await prisma.consumableMaterial.count();

    // นับวัสดุสิ้นเปลืองที่สต็อกต่ำ
    const consumables = await prisma.consumableMaterial.findMany({
      select: {
        currentStock: true,
        minStock: true,
      },
    });
    
    const lowStockConsumables = consumables.filter(
      (item: { currentStock: number; minStock: number }) => item.currentStock <= item.minStock
    ).length;

    // นับจำนวนครุภัณฑ์ทั้งหมด
    const totalAssets = await prisma.fixedAsset.count();

    // นับครุภัณฑ์ที่กำลังถูกยืม
    const borrowedAssets = await prisma.assetBorrow.count({
      where: {
        status: 'BORROWED',
      },
    });

    // นับครุภัณฑ์ที่ต้องซ่อม
    const assetsNeedRepair = await prisma.fixedAsset.count({
      where: {
        condition: {
          in: ['DAMAGED', 'NEEDS_REPAIR']
        }
      },
    });

    // นับจำนวนการเบิกจ่ายวัสดุสิ้นเปลือง
    const totalConsumableTransactions = await prisma.consumableTransaction.count({
      where: {
        type: 'OUT',
      },
    });

    // นับคำขอซื้อที่รอพิจารณา
    let pendingRequests = 0;
    try {
      pendingRequests = await prisma.purchaseRequest.count({
        where: {
          status: 'PENDING',
        },
      });
    } catch (error) {
      console.log('Purchase request table not ready yet');
    }

    // ดึงข้อมูลการเบิกจ่ายล่าสุด 5 รายการจากวัสดุสิ้นเปลือง
    const recentTransactions = await prisma.consumableTransaction.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        consumableMaterial: {
          select: { name: true, category: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      totalConsumables,
      lowStockConsumables,
      totalAssets,
      borrowedAssets,
      assetsNeedRepair,
      totalConsumableTransactions,
      pendingRequests,
      recentTransactions,
    }, { status: 200 });

  } catch {
    console.error('Error fetching dashboard data');
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}