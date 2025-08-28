// src/app/api/materials/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงข้อมูลวัสดุทั้งหมด
export async function GET() {
  try {
    const materials = await prisma.material.findMany();
    return NextResponse.json(materials, { status: 200 });
  } catch {
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