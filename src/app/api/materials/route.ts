// src/app/api/materials/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงข้อมูลวัสดุทั้งหมด
export async function GET() {
  try {
    // ดึงข้อมูลจากทั้ง ConsumableMaterial และ Material (legacy)
    const [consumables, legacyMaterials] = await Promise.all([
      prisma.consumableMaterial.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          unit: true,
          currentStock: true,
          imageUrl: true,
          description: true,
          createdAt: true,
        }
      }),
      prisma.material.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          unit: true,
          currentStock: true,
          imageUrl: true,
          isAsset: true,
        }
      })
    ]);

    // รวมข้อมูลและปรับโครงสร้างให้เหมือนกัน
    const materials = [
      ...consumables.map(item => ({
        id: item.id,
        name: item.name,
        code: `CON-${item.id.slice(-6)}`, // สร้างรหัสชั่วคราว
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        imageUrl: item.imageUrl,
        isAsset: false,
        type: 'consumable' as const
      })),
      ...legacyMaterials.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code || `MAT-${item.id.slice(-6)}`,
        category: item.category,
        unit: item.unit || 'ชิ้น',
        currentStock: item.currentStock,
        imageUrl: item.imageUrl,
        isAsset: item.isAsset,
        type: 'legacy' as const
      }))
    ];

    return NextResponse.json(materials, { status: 200 });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

// POST: สร้างรายการวัสดุใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMaterial = await prisma.material.create({
      data: {
        name: body.name,
        code: body.code,
        category: body.category,
        unit: body.unit,
        minStock: parseInt(body.minStock, 10),
        isAsset: body.isAsset,
        imageUrl: body.imageUrl || null,
        qrCode: body.qrCode || null,
      },
    });
    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}