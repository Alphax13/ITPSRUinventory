import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFixedAssetReportHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');

    const where: Record<string, unknown> = {};
    if (condition && condition !== 'ALL') where.condition = condition;

    const assets = await prisma.fixedAsset.findMany({
      where,
      include: {
        borrowHistory: { where: { status: 'BORROWED' }, select: { id: true } }
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
      purchaseDate: asset.purchaseDate?.toISOString(),
      purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : undefined,
      borrowStatus: asset.borrowHistory.length > 0 ? 'กำลังถูกยืม' : 'ว่าง',
    }));

    const html = generateFixedAssetReportHTML(reportData);
    const pdfBuffer = await generatePDFWithHeaderFooter(html, { format: 'A4', landscape: true });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fixed-assets-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating fixed-asset PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
