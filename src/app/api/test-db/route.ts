// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test ConsumableMaterial table
    const consumables = await prisma.consumableMaterial.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        currentStock: true,
      }
    });
    
    // Test legacy Material table  
    const legacyMaterials = await prisma.material.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        currentStock: true,
      }
    });
    
    // Count totals
    const [consumableCount, legacyCount] = await Promise.all([
      prisma.consumableMaterial.count(),
      prisma.material.count()
    ]);
    
    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      counts: {
        consumableMaterials: consumableCount,
        legacyMaterials: legacyCount,
        total: consumableCount + legacyCount
      },
      samples: {
        consumables: consumables,
        legacyMaterials: legacyMaterials
      }
    };
    
    console.log('Database test result:', result);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}