// src/app/api/assets/borrow/[id]/form/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBorrowFormHTML } from '@/utils/reportTemplates';
import { generatePDFWithHeaderFooter } from '@/utils/puppeteerPdfGenerator';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const borrowId = params.id;

    // ดึงข้อมูลการยืม
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        fixedAsset: true,
        user: true,
      },
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
    };

    // สร้าง HTML จาก template
    const html = generateBorrowFormHTML(formData);

    // แปลงเป็น PDF ด้วย Puppeteer
    const pdfBuffer = await generatePDFWithHeaderFooter(html, {
      format: 'A4',
      landscape: false,
    });

    // ส่งคืน PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="borrow-form-${borrowId}.pdf"`,
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
