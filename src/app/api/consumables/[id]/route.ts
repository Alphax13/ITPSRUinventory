// src/app/api/consumables/[id]/route.ts
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
    const { name, category, unit, minStock, currentStock, location, imageUrl, description } = body;

    // Validation
    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const consumable = await prisma.consumableMaterial.update({
      where: { id: id },
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

    return NextResponse.json(consumable);
  } catch (error) {
    console.error('Error updating consumable:', error);
    return NextResponse.json({ error: 'Failed to update consumable' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.consumableMaterial.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ message: 'Consumable deleted successfully' });
  } catch (error) {
    console.error('Error deleting consumable:', error);
    return NextResponse.json({ error: 'Failed to delete consumable' }, { status: 500 });
  }
}
