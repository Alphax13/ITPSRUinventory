// src/app/api/consumables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const consumables = await prisma.consumableMaterial.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(consumables);
  } catch (error) {
    console.error('Error fetching consumables:', error);
    return NextResponse.json({ error: 'Failed to fetch consumables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, unit, minStock, currentStock, location, imageUrl, description } = body;

    // Validation
    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const consumable = await prisma.consumableMaterial.create({
      data: {
        name,
        category,
        unit,
        minStock: parseInt(minStock) || 0,
        currentStock: parseInt(currentStock) || 0,
        location: location || null,
        imageUrl: imageUrl || null,
        description: description || null,
      }
    });

    return NextResponse.json(consumable, { status: 201 });
  } catch (error) {
    console.error('Error creating consumable:', error);
    return NextResponse.json({ error: 'Failed to create consumable' }, { status: 500 });
  }
}
