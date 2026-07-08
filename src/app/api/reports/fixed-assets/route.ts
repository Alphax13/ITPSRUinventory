import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition'); // GOOD, DAMAGED, NEEDS_REPAIR, DISPOSED

    const where: Record<string, unknown> = {};
    if (condition && condition !== 'ALL') where.condition = condition;

    const assets = await prisma.fixedAsset.findMany({
      where,
      include: {
        borrowHistory: {
          where: { status: 'BORROWED' },
          select: { id: true }
        }
      },
      orderBy: [{ category: 'asc' }, { assetNumber: 'asc' }]
    });

    const reportData = assets.map(asset => ({
      assetNumber: asset.assetNumber,
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      condition: asset.condition,
      location: asset.location,
      purchaseDate: asset.purchaseDate?.toISOString() || null,
      purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
      borrowStatus: asset.borrowHistory.length > 0 ? 'กำลังถูกยืม' : 'ว่าง',
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching fixed-asset report data:', error);
    return NextResponse.json({ error: 'Failed to fetch fixed-asset report data' }, { status: 500 });
  }
}
