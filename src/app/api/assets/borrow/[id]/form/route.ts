// src/app/api/assets/borrow/[id]/form/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBorrowFormHTML } from '@/utils/reportTemplates';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const borrowId = id;

    // ดึงข้อมูลการยืม และข้อมูล admin ที่ล็อกอิน
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        fixedAsset: true,
        user: true,
      },
    });

    // ดึงข้อมูล admin ที่ login อยู่ (ดึง admin คนแรก หรือ admin ที่สร้างรายการ)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { name: true }
    });

    if (!borrow) {
      return NextResponse.json(
        { error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    // เตรียมข้อมูลสำหรับแบบฟอร์ม
    const formData = {
      borrowId: borrow.id,
      assetNumber: borrow.fixedAsset.assetNumber,
      assetName: borrow.fixedAsset.name,
      borrower: borrow.user.name,
      department: borrow.user.department || 'ไม่ระบุ',
      purpose: borrow.purpose || 'ไม่ระบุ',
      borrowDate: borrow.borrowDate.toISOString(),
      expectedReturnDate: borrow.expectedReturnDate?.toISOString() || new Date().toISOString(),
      condition: borrow.fixedAsset.condition,
      note: borrow.note || undefined,
      studentName: borrow.studentName || undefined,
      studentId: borrow.studentId || undefined,
      adminName: admin?.name || 'เจ้าหน้าที่',
    };

    // สร้าง HTML จาก template พร้อมปุ่มพิมพ์อัตโนมัติ
    const html = generateBorrowFormHTML(formData);
    
    // แปลง relative path เป็น absolute URL สำหรับ logo
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const htmlWithAbsoluteUrls = html.replace(/src="\/logo\.png"/g, `src="${baseUrl}/logo.png"`);
    
    // เพิ่มสคริปต์สำหรับพิมพ์อัตโนมัติ
    const htmlWithPrintScript = htmlWithAbsoluteUrls.replace(
      '</body>',
      `
      <script>
        // Auto-open print dialog when page loads
        window.onload = function() {
          window.print();
        };
      </script>
      </body>
      `
    );

    // ส่งคืน HTML ที่พร้อมพิมพ์
    return new NextResponse(htmlWithPrintScript, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating borrow form:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate borrow form',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
