// src/app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงรายการครุภัณฑ์ทั้งหมด
export async function GET() {
  try {
    const assets = await prisma.fixedAsset.findMany({
      include: {
        borrowHistory: {
          where: { status: 'BORROWED' },
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { assetNumber: 'asc' }
    });

    return NextResponse.json(assets, { status: 200 });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

// POST: สร้างครุภัณฑ์ใหม่
export async function POST(request: NextRequest) {
  try {
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

    if (!assetNumber || !name || !category) {
      return NextResponse.json({ 
        error: 'Asset number, name, and category are required' 
      }, { status: 400 });
    }

    const asset = await prisma.fixedAsset.create({
      data: {
        assetNumber,
        name,
        category,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        location: location || 'Unassigned',
        condition: condition || 'GOOD',
        imageUrl: imageUrl || null,
        description: description || null,
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ 
      error: 'Failed to create asset: ' + (error as Error).message 
    }, { status: 500 });
  }
}

