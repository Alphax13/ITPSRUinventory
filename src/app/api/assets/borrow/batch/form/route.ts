import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMultiBorrowFormHTML } from '@/utils/reportTemplates';

/**
 * POST /api/assets/borrow/batch/form
 * Body: { borrowIds: string[] } หรือ form data
 * 
 * รวมหลายรายการยืมครุภัณฑ์ที่มีผู้ยืมคนเดียวกันเป็น HTML พร้อมพิมพ์
 */
export async function POST(request: Request) {
  try {
    let borrowIds: string[] = [];
    
    // รองรับทั้ง JSON และ form data
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      borrowIds = body.borrowIds;
    } else {
      const formData = await request.formData();
      const borrowIdsStr = formData.get('borrowIds') as string;
      borrowIds = JSON.parse(borrowIdsStr);
    }

    if (!Array.isArray(borrowIds) || borrowIds.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุ borrowIds อย่างน้อย 1 รายการ' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลการยืมทั้งหมด พร้อมข้อมูลครุภัณฑ์และผู้ใช้
    const borrows = await prisma.assetBorrow.findMany({
      where: {
        id: { in: borrowIds }
      },
      include: {
        fixedAsset: true,
        user: {
          select: {
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        borrowDate: 'asc'
      }
    });

    if (borrows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการยืม' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าทุกรายการมีผู้ยืมคนเดียวกัน
    const firstUserId = borrows[0].userId;
    const differentUser = borrows.find((b) => b.userId !== firstUserId);
    if (differentUser) {
      return NextResponse.json(
        { error: 'ไม่สามารถรวม PDF ได้: มีผู้ยืมต่างคนกัน' },
        { status: 400 }
      );
    }

    // ใช้ข้อมูลจากรายการแรก (ผู้ยืม, หน่วยงาน, วันที่)
    const firstBorrow = borrows[0];
    
    // สร้างรายการครุภัณฑ์สำหรับตาราง
    const assets = borrows.map((b) => {
      const asset = b.fixedAsset;
      return {
        assetNumber: asset.assetNumber,
        assetName: asset.name,
        condition: asset.condition,
        note: b.note || undefined
      };
    });

    // สร้าง borrowId รวม
    const combinedId = borrows.length > 1 
      ? `${firstBorrow.id.slice(0, 8)} (+${borrows.length - 1})`
      : firstBorrow.id;

    // สร้าง HTML จาก template
    const html = generateMultiBorrowFormHTML({
      borrowId: combinedId,
      borrower: firstBorrow.user.name || 'ไม่ระบุ',
      department: firstBorrow.user.department || 'ไม่ระบุ',
      purpose: firstBorrow.purpose || 'ยืมใช้งาน',
      borrowDate: firstBorrow.borrowDate.toISOString(),
      expectedReturnDate: firstBorrow.expectedReturnDate 
        ? firstBorrow.expectedReturnDate.toISOString()
        : new Date(firstBorrow.borrowDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      studentName: firstBorrow.studentName || undefined,
      studentId: firstBorrow.studentId || undefined,
      note: firstBorrow.note || undefined,
      assets
    });

    // แปลง relative path เป็น absolute URL สำหรับ logo
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const htmlWithAbsoluteUrls = html.replace(/src="\/logo\.png"/g, `src="${baseUrl}/logo.png"`);

    // เพิ่มสคริปต์สำหรับพิมพ์อัตโนมัติ
    const htmlWithPrintScript = htmlWithAbsoluteUrls.replace(
      '</body>',
      `
      <script>
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
    console.error('Error generating batch borrow form:', error);
    return NextResponse.json(
      { 
        error: 'ไม่สามารถสร้างแบบฟอร์มได้',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
