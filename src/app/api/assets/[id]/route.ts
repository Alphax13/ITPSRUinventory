// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงข้อมูลครุภัณฑ์ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        borrowHistory: {
          where: { status: 'BORROWED' },
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'ไม่พบครุภัณฑ์' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

// PUT: อัปเดตข้อมูลครุภัณฑ์
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      assetNumber, 
      name, 
      category, 
      brand, 
      model, 
      serialNumber, 
      purchaseDate, 
      purchasePrice, 
      location, 
      condition, 
      imageUrl, 
      description 
    } = body;

    // Validation
    if (!assetNumber || !name || !category) {
      return NextResponse.json({ error: 'เลขครุภัณฑ์ ชื่อ และหมวดหมู่ จำเป็นต้องกรอก' }, { status: 400 });
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
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice.toString()) : null,
        location: location || null,
        condition: condition || 'GOOD',
        imageUrl: imageUrl || null,
        description: description || null,
      }
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ 
      error: 'Failed to update asset: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// DELETE: ลบครุภัณฑ์
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบว่ามีการยืมอยู่หรือไม่
    const activeBorrow = await prisma.assetBorrow.findFirst({
      where: {
        fixedAssetId: id,
        status: 'BORROWED'
      }
    });

    if (activeBorrow) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบครุภัณฑ์ที่ถูกยืมอยู่ได้' 
      }, { status: 400 });
    }

    // ลบครุภัณฑ์
    await prisma.fixedAsset.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'ลบครุภัณฑ์สำเร็จ' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ 
      error: 'Failed to delete asset: ' + (error as Error).message 
    }, { status: 500 });
  }
}
