// src/app/api/consumables/withdraw/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePDFFromHTML } from '@/utils/puppeteerPdfGenerator';
import { generateWithdrawFormHTML } from '@/utils/reportTemplates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionIds } = body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุ transaction IDs' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลการเบิกทั้งหมดพร้อม relation
    const transactions = await prisma.consumableTransaction.findMany({
      where: { 
        id: { in: transactionIds },
        type: 'OUT',
      },
      include: {
        consumableMaterial: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการเบิก' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าทุกรายการเป็นของผู้ใช้คนเดียวกัน
    const uniqueUsers = new Set(transactions.map(t => t.userId));
    if (uniqueUsers.size > 1) {
      return NextResponse.json(
        { error: 'รายการเบิกต้องเป็นของผู้ใช้คนเดียวกัน' },
        { status: 400 }
      );
    }

    // ใช้ข้อมูลจาก transaction แรก
    const firstTransaction = transactions[0];
    
    // รวมรายการวัสดุทั้งหมด
    const items = transactions.map(tx => ({
      materialName: tx.consumableMaterial.name,
      quantity: tx.quantity,
      unit: tx.consumableMaterial.unit,
    }));

    // รวม note (ถ้ามี)
    const notes = transactions
      .map(tx => tx.note)
      .filter(note => note && note.trim())
      .join(', ');

    // เตรียมข้อมูลสำหรับ template
    const formData = {
      transactionId: `BATCH-${firstTransaction.id.slice(-8)}`,
      withdrawDate: firstTransaction.createdAt.toISOString(),
      requester: firstTransaction.user.name,
      department: firstTransaction.user.department || 'ไม่ระบุ',
      items: items,
      note: notes || undefined,
      purpose: undefined,
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
        'Content-Disposition': `attachment; filename="withdraw-batch-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating batch withdraw form:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างใบเบิก' },
      { status: 500 }
    );
  }
}
