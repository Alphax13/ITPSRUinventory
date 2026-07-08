import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const HTMLDOCS_API_URL = 'https://api.htmldocs.com/v1';
const HTMLDOCS_API_KEY = process.env.HTMLDOCS_API_KEY || '';

const conditionLabel = (c: string) => {
  switch (c) {
    case 'GOOD': return 'ดี';
    case 'DAMAGED': return 'ชำรุด';
    case 'NEEDS_REPAIR': return 'รอซ่อม';
    case 'DISPOSED': return 'จำหน่ายแล้ว';
    default: return c;
  }
};

export async function GET(request: NextRequest) {
  try {
    if (!HTMLDOCS_API_KEY) {
      return NextResponse.json({ error: 'HTMLDocs API key is not configured' }, { status: 500 });
    }

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

    const rows = assets.map((asset, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${asset.assetNumber}</td>
        <td>${asset.name}</td>
        <td>${asset.category}</td>
        <td>${asset.brand || '-'}</td>
        <td>${asset.model || '-'}</td>
        <td>${conditionLabel(asset.condition)}</td>
        <td>${asset.location}</td>
        <td>${asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('th-TH') : '-'}</td>
        <td>${asset.purchasePrice ? Number(asset.purchasePrice).toLocaleString() : '-'}</td>
        <td>${asset.borrowHistory.length > 0 ? 'กำลังถูกยืม' : 'ว่าง'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>table{border-collapse:collapse;width:100%}th,td{border:1px solid black;padding:6px;text-align:left;font-size:12px}th{background-color:#1e3a5f;color:white;font-weight:bold}</style>
      </head><body>
      <h2>รายงานครุภัณฑ์ทั้งหมด</h2>
      <p>สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏพิบูลสงคราม</p>
      <table><thead><tr>
        <th>ลำดับ</th><th>เลขครุภัณฑ์</th><th>ชื่อครุภัณฑ์</th><th>หมวดหมู่</th>
        <th>ยี่ห้อ</th><th>รุ่น</th><th>สภาพ</th><th>ตำแหน่ง</th>
        <th>วันที่ซื้อ</th><th>ราคา (บาท)</th><th>สถานะ</th>
      </tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;

    const response = await axios.post(
      `${HTMLDOCS_API_URL}/convert`,
      { html, format: 'xlsx' },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HTMLDOCS_API_KEY}` }, responseType: 'arraybuffer' }
    );

    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="fixed-assets-report-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating fixed-asset Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel report' }, { status: 500 });
  }
}
