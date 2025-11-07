// src/app/api/consumables/withdraw/[id]/form/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePDFFromHTML } from '@/utils/puppeteerPdfGenerator';
import { generateWithdrawFormHTML } from '@/utils/reportTemplates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;

    // ดึงข้อมูลการเบิกพร้อม relation
    const transaction = await prisma.consumableTransaction.findUnique({
      where: { id: transactionId },
      include: {
        consumableMaterial: true,
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการเบิก' },
        { status: 404 }
      );
    }

    if (transaction.type !== 'OUT') {
      return NextResponse.json(
        { error: 'ข้อมูลนี้ไม่ใช่การเบิกของ' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลสำหรับ template
    const formData = {
      transactionId: transaction.id,
      withdrawDate: transaction.createdAt.toISOString(),
      requester: transaction.user.name,
      department: transaction.user.department || 'ไม่ระบุ',
      items: [
        {
          materialName: transaction.consumableMaterial.name,
          quantity: transaction.quantity,
          unit: transaction.consumableMaterial.unit,
        },
      ],
      note: transaction.note || undefined,
      purpose: undefined, // ConsumableTransaction ไม่มี field purpose
    };

    // สร้าง HTML template
    const html = generateWithdrawFormHTML(formData);

    // สร้าง PDF
    const pdfBuffer = await generatePDFFromHTML(html, {
      format: 'A4',
      landscape: false,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    });

    // ส่ง PDF กลับไป
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="withdraw-form-${transactionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating withdraw form:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างใบเบิก' },
      { status: 500 }
    );
  }
}
