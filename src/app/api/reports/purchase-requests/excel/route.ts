// src/app/api/reports/purchase-requests/excel/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const HTMLDOCS_API_URL = 'https://api.htmldocs.com/v1';
const HTMLDOCS_API_KEY = process.env.HTMLDOCS_API_KEY || '';

export async function GET() {
  try {
    // ตรวจสอบ API key
    if (!HTMLDOCS_API_KEY) {
      return NextResponse.json(
        { error: 'HTMLDocs API key is not configured' },
        { status: 500 }
      );
    }

    // ดึงข้อมูลคำขอซื้อ
    const requests = await prisma.purchaseRequest.findMany({
      include: {
        requester: {
          select: {
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const reportData = requests.map(request => {
      let items = [];
      try {
        items = JSON.parse(JSON.stringify(request.items));
      } catch {
        items = [];
      }
      
      const itemsList = Array.isArray(items) 
        ? items.map((i: any) => `${i.name || 'ไม่ระบุ'} (${i.quantity || 0} ${i.unit || ''})`).join(', ')
        : '';

      return {
        requestDate: request.createdAt.toISOString().split('T')[0],
        requesterName: request.requester.name,
        department: request.requester.department || '',
        items: itemsList,
        reason: request.reason,
        status: request.status === 'PENDING' ? 'รอพิจารณา' : 
                request.status === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ',
      };
    });

    // สร้าง HTML table สำหรับ Excel
    const rows = reportData.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.requestDate}</td>
        <td>${item.requesterName}</td>
        <td>${item.department}</td>
        <td>${item.items}</td>
        <td>${item.reason}</td>
        <td>${item.status}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>รายงานคำขอซื้อวัสดุ</h1>
        <p>สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏพิบูลสงคราม</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>วันที่ขอ</th>
              <th>ผู้ขอ</th>
              <th>หน่วยงาน</th>
              <th>รายการที่ขอซื้อ</th>
              <th>เหตุผล</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // แปลงเป็น Excel ผ่าน HTMLDocs API
    const response = await axios.post(
      `${HTMLDOCS_API_URL}/convert`,
      {
        html,
        format: 'xlsx',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HTMLDOCS_API_KEY}`,
        },
        responseType: 'arraybuffer',
      }
    );

    // ส่งคืน Excel
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="purchase-requests-report-${Date.now()}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating purchase requests Excel report:', error);
    return NextResponse.json(
      { error: 'Failed to generate purchase requests Excel report' },
      { status: 500 }
    );
  }
}
