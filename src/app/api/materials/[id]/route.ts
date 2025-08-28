// src/app/api/materials/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: ดึงข้อมูลวัสดุหนึ่งรายการ
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const material = await prisma.material.findUnique({
      where: { id },
    });
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json(material, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });
  }
}

// PUT: อัปเดตข้อมูลวัสดุ
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        category: body.category,
        unit: body.unit,
        minStock: parseInt(body.minStock, 10),
        isAsset: body.isAsset,
        imageUrl: body.imageUrl || null,
      },
    });
    return NextResponse.json(updatedMaterial, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

// DELETE: ลบข้อมูลวัสดุ
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.material.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Material deleted successfully' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}