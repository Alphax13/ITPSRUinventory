// src/app/api/reports/stock/excel/route.ts
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

    // ดึงข้อมูลวัสดุทั้งหมด
    const materials = await prisma.consumableMaterial.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    const reportData = materials.map(material => ({
      id: material.id,
      name: material.name,
      category: material.category,
      currentStock: material.currentStock,
      minStock: material.minStock,
      unit: material.unit,
      location: material.location || '',
      status: material.currentStock === 0 ? 'หมด' : 
              material.currentStock <= material.minStock ? 'สต็อกต่ำ' : 'ปกติ'
    }));

    // สร้าง HTML table สำหรับ Excel
    const rows = reportData.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.currentStock}</td>
        <td>${item.minStock}</td>
        <td>${item.unit}</td>
        <td>${item.location}</td>
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
        <h1>รายงานสต็อกวัสดุสิ้นเปลือง</h1>
        <p>สาขาวิชาเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏสุราษฎร์ธานี</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่อวัสดุ</th>
              <th>หมวดหมู่</th>
              <th>จำนวนคงเหลือ</th>
              <th>จำนวนขั้นต่ำ</th>
              <th>หน่วย</th>
              <th>ตำแหน่ง</th>
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
        'Content-Disposition': `attachment; filename="stock-report-${Date.now()}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating stock Excel report:', error);
    return NextResponse.json(
      { error: 'Failed to generate stock Excel report' },
      { status: 500 }
    );
  }
}
