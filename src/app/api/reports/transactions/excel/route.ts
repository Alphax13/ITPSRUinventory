// src/app/api/reports/transactions/excel/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const HTMLDOCS_API_URL = 'https://api.htmldocs.com/v1';
const HTMLDOCS_API_KEY = process.env.HTMLDOCS_API_KEY || '';

export async function GET(request: Request) {
  try {
    // ตรวจสอบ API key
    if (!HTMLDOCS_API_KEY) {
      return NextResponse.json(
        { error: 'HTMLDocs API key is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล transactions
    const transactions = await prisma.consumableTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z')
        }
      },
      include: {
        consumableMaterial: {
          select: {
            name: true,
            unit: true
          }
        },
        user: {
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

    const reportData = transactions.map(transaction => ({
      date: transaction.createdAt.toISOString().split('T')[0],
      materialName: transaction.consumableMaterial.name,
      type: transaction.type === 'IN' ? 'นำเข้า' : 'เบิกจ่าย',
      quantity: transaction.quantity,
      unit: transaction.consumableMaterial.unit,
      userName: transaction.user?.name || 'System',
      department: transaction.user?.department || '',
      note: transaction.note || ''
    }));

    // สร้าง HTML table สำหรับ Excel
    const rows = reportData.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.date}</td>
        <td>${item.materialName}</td>
        <td>${item.type}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>${item.userName}</td>
        <td>${item.department}</td>
        <td>${item.note}</td>
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
        <h1>รายงานการเบิก-จ่ายวัสดุสิ้นเปลือง</h1>
        <p>สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏสุราษฎร์ธานี</p>
        <p>ระหว่างวันที่: ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>วันที่</th>
              <th>รายการวัสดุ</th>
              <th>ประเภท</th>
              <th>จำนวน</th>
              <th>หน่วย</th>
              <th>ผู้ทำรายการ</th>
              <th>หน่วยงาน</th>
              <th>หมายเหตุ</th>
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
        'Content-Disposition': `attachment; filename="transactions-report-${Date.now()}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating transactions Excel report:', error);
    return NextResponse.json(
      { error: 'Failed to generate transactions Excel report' },
      { status: 500 }
    );
  }
}
