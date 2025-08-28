// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assetNumber, name, category, condition, location, imageUrl, description } = body;

    // Validation
    if (!assetNumber || !name || !category) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // ตรวจสอบว่าเลขครุภัณฑ์ซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const existingAsset = await prisma.fixedAsset.findFirst({
      where: {
        assetNumber,
        NOT: {
          id: id
        }
      }
    });

    if (existingAsset) {
      return NextResponse.json({ error: 'เลขครุภัณฑ์นี้มีอยู่แล้ว' }, { status: 400 });
    }

    const asset = await prisma.fixedAsset.update({
      where: { id: id },
      data: {
        assetNumber,
        name,
        category,
        condition,
        location: location || null,
        imageUrl: imageUrl || null,
        description: description || null,
      }
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ตรวจสอบว่าครุภัณฑ์ถูกยืมอยู่หรือไม่
    const borrowedAsset = await prisma.assetBorrow.findFirst({
      where: {
        fixedAssetId: id,
        actualReturnDate: null // ยังไม่ได้คืน
      }
    });

    if (borrowedAsset) {
      return NextResponse.json({ error: 'ไม่สามารถลบครุภัณฑ์ที่ถูกยืมอยู่ได้' }, { status: 400 });
    }

    await prisma.fixedAsset.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
