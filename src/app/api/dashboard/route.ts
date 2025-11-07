// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // รวม queries ทั้งหมดให้ทำงานพร้อมกัน (parallel) แทนการทำทีละอันเพื่อเพิ่มความเร็ว
    const [
      totalConsumables,
      lowStockResult,
      totalAssets,
      borrowedAssets,
      assetsNeedRepair,
      totalConsumableTransactions,
      pendingRequests,
      recentTransactions,
    ] = await Promise.all([
      // นับจำนวนวัสดุสิ้นเปลืองทั้งหมด
      prisma.consumableMaterial.count(),
      
      // นับวัสดุสิ้นเปลืองที่สต็อกต่ำ (ใช้ raw query เพราะต้องเปรียบเทียบ field กับ field)
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::integer as count 
        FROM "ConsumableMaterial" 
        WHERE "currentStock" <= "minStock"
      `,
      
      // นับจำนวนครุภัณฑ์ทั้งหมด
      prisma.fixedAsset.count(),
      
      // นับครุภัณฑ์ที่กำลังถูกยืม
      prisma.assetBorrow.count({
        where: {
          status: 'BORROWED',
        },
      }),
      
      // นับครุภัณฑ์ที่ต้องซ่อม
      prisma.fixedAsset.count({
        where: {
          condition: {
            in: ['DAMAGED', 'NEEDS_REPAIR']
          }
        },
      }),
      
      // นับจำนวนการเบิกจ่ายวัสดุสิ้นเปลือง
      prisma.consumableTransaction.count({
        where: {
          type: 'OUT',
        },
      }),
      
      // นับคำขอซื้อที่รอพิจารณา
      prisma.purchaseRequest.count({
        where: {
          status: 'PENDING',
        },
      }).catch(() => 0),
      
      // ดึงข้อมูลการเบิกจ่ายล่าสุด 5 รายการจากวัสดุสิ้นเปลือง
      prisma.consumableTransaction.findMany({
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
      }),
    ]);
    
    // แปลง BigInt เป็น Number
    const lowStockConsumables = Number(lowStockResult[0].count);

    return NextResponse.json({
      totalConsumables,
      lowStockConsumables,
      totalAssets,
      borrowedAssets,
      assetsNeedRepair,
      totalConsumableTransactions,
      pendingRequests,
      recentTransactions,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}