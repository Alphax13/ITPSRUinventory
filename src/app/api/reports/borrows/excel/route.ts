import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const HTMLDOCS_API_URL = 'https://api.htmldocs.com/v1';
const HTMLDOCS_API_KEY = process.env.HTMLDOCS_API_KEY || '';

const statusLabel = (s: string) => {
  switch (s) {
    case 'BORROWED': return 'กำลังยืม';
    case 'RETURNED': return 'คืนแล้ว';
    case 'OVERDUE': return 'เกินกำหนด';
    case 'LOST': return 'สูญหาย';
    default: return s;
  }
};

const borrowerTypeLabel = (t: string) => {
  switch (t) {
    case 'STUDENT': return 'นักศึกษา';
    case 'LECTURER': return 'อาจารย์';
    case 'FACULTY': return 'คณะ';
    case 'STAFF': return 'เจ้าหน้าที่';
    default: return t;
  }
};

export async function GET(request: NextRequest) {
  try {
    if (!HTMLDOCS_API_KEY) {
      return NextResponse.json({ error: 'HTMLDocs API key is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const borrowerType = searchParams.get('borrowerType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (borrowerType && borrowerType !== 'ALL') where.borrowerType = borrowerType;
    if (startDate || endDate) {
      where.borrowDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      };
    }

    const borrows = await prisma.assetBorrow.findMany({
      where,
      include: {
        fixedAsset: { select: { assetNumber: true, name: true, category: true } },
        user: { select: { name: true, department: true } },
      },
      orderBy: { borrowDate: 'desc' },
    });

    const rows = borrows.map((b, index) => {
      const primaryName = b.studentName || b.user.name;
      const sub = b.studentName ? b.studentId || '' : b.borrowOnBehalfOf || '';
      return `<tr>
        <td>${index + 1}</td>
        <td>${new Date(b.borrowDate).toLocaleDateString('th-TH')}</td>
        <td>${b.fixedAsset.assetNumber}</td>
        <td>${b.fixedAsset.name}</td>
        <td>${b.fixedAsset.category}</td>
        <td>${borrowerTypeLabel(b.borrowerType)}</td>
        <td>${primaryName}${sub ? ` (${sub})` : ''}</td>
        <td>${b.user.department}</td>
        <td>${b.expectedReturnDate ? new Date(b.expectedReturnDate).toLocaleDateString('th-TH') : '-'}</td>
        <td>${b.actualReturnDate ? new Date(b.actualReturnDate).toLocaleDateString('th-TH') : '-'}</td>
        <td>${statusLabel(b.status)}</td>
        <td>${b.purpose || '-'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>table{border-collapse:collapse;width:100%}th,td{border:1px solid black;padding:5px;text-align:left;font-size:11px}th{background-color:#1e3a5f;color:white;font-weight:bold}</style>
      </head><body>
      <h2>รายงานการยืม-คืนครุภัณฑ์</h2>
      <p>สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏพิบูลสงคราม</p>
      <table><thead><tr>
        <th>ลำดับ</th><th>วันที่ยืม</th><th>เลขครุภัณฑ์</th><th>ชื่อครุภัณฑ์</th><th>หมวดหมู่</th>
        <th>ประเภทผู้ยืม</th><th>ผู้ยืม</th><th>หน่วยงาน</th>
        <th>กำหนดคืน</th><th>คืนจริง</th><th>สถานะ</th><th>วัตถุประสงค์</th>
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
        'Content-Disposition': `attachment; filename="borrow-report-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating borrow Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel report' }, { status: 500 });
  }
}
