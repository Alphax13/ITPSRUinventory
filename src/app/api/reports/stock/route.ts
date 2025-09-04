// src/app/api/reports/stock/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const materials = await prisma.consumableMaterial.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    const reportData = materials.map(material => ({
      id: material.id,
      code: material.id, // ใช้ id แทน code ถ้าไม่มี code field
      name: material.name,
      category: material.category,
      currentStock: material.currentStock,
      minStock: material.minStock,
      unit: material.unit,
      supplier: '',  // ไม่มี supplier field ใน schema
      price: 0,     // ไม่มี price field ใน schema
      location: material.location || '',
      status: material.currentStock === 0 ? 'หมด' : 
              material.currentStock <= material.minStock ? 'สต็อกต่ำ' : 'ปกติ'
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching stock report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock report data' },
      { status: 500 }
    );
  }
}
