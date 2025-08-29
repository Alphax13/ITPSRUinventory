// src/app/api/materials/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดึงข้อมูลวัสดุหนึ่งรายการ
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const material = await prisma.material.findUnique({
      where: { id },
    });
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json(material, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });
  }
}

// PUT: อัปเดตข้อมูลวัสดุ
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        category: body.category,
        unit: body.unit,
        minStock: parseInt(body.minStock, 10),
        isAsset: body.isAsset,
        imageUrl: body.imageUrl || null,
      },
    });
    return NextResponse.json(updatedMaterial, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

// DELETE: ลบข้อมูลวัสดุ
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // ตรวจสอบว่ามี Transaction ที่อ้างอิงถึงวัสดุนี้หรือไม่
    const existingTransactions = await prisma.transaction.findMany({
      where: { materialId: id },
    });

    // ใช้ Transaction เพื่อให้การลบเป็น atomic operation
    const result = await prisma.$transaction(async (tx) => {
      if (existingTransactions.length > 0) {
        // อัปเดต transactions ให้ชี้ไปที่ null แทนการลบ (เก็บประวัติไว้)
        await tx.transaction.updateMany({
          where: { materialId: id },
          data: { 
            materialId: null,
            // เพิ่มหมายเหตุว่าวัสดุถูกลบแล้ว
            reason: existingTransactions[0].reason 
              ? `${existingTransactions[0].reason} [วัสดุถูกลบแล้ว]`
              : '[วัสดุถูกลบแล้ว]'
          },
        });
      }

      // ลบวัสดุ
      await tx.material.delete({
        where: { id },
      });

      return {
        deletedMaterial: true,
        affectedTransactions: existingTransactions.length
      };
    });
    
    return NextResponse.json({ 
      message: 'ลบวัสดุเรียบร้อยแล้ว',
      details: result.affectedTransactions > 0 
        ? `ประวัติการใช้งาน ${result.affectedTransactions} รายการยังคงเก็บไว้ในระบบ`
        : 'ไม่มีประวัติการใช้งาน'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting material:', error);
    
    // ตรวจสอบประเภทข้อผิดพลาด
    if (error instanceof Error) {
      // Record not found error
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ 
          error: 'ไม่พบรายการวัสดุที่ต้องการลบ' 
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการลบวัสดุ กรุณาลองใหม่อีกครั้ง' 
    }, { status: 500 });
  }
}