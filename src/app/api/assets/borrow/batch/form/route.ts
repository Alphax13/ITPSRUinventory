import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePDFFromHTML } from '@/utils/puppeteerPdfGenerator';
import { generateMultiBorrowFormHTML } from '@/utils/reportTemplates';

// เพิ่ม timeout สำหรับการสร้าง PDF
export const maxDuration = 60;

/**
 * POST /api/assets/borrow/batch/form
 * Body: { borrowIds: string[] }
 * 
 * รวมหลายรายการยืมครุภัณฑ์ที่มีผู้ยืมคนเดียวกันเป็น PDF เดียว (แบบตาราง)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { borrowIds } = body;

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
        assetName: asset.name, // map name -> assetName
        condition: asset.condition,
        note: b.note || undefined
      };
    });

    // สร้าง borrowId รวม (เช่น "BRW-001,BRW-002,BRW-003" หรือใช้ของแรก + จำนวน)
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

    // สร้าง PDF
    const pdfBuffer = await generatePDFFromHTML(html);

    // ส่ง PDF กลับไป
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="borrow-form-batch-${Date.now()}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating batch borrow PDF:', error);
    return NextResponse.json(
      { 
        error: 'ไม่สามารถสร้าง PDF ได้',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
