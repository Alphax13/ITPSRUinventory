// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PUT: อัพเดตข้อมูลผู้ใช้
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, password, name, role, email, isActive } = body;

    if (!name) {
      return NextResponse.json({ 
        error: 'ชื่อจำเป็นต้องกรอก' 
      }, { status: 400 });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // ตรวจสอบ username ซ้ำ (ถ้าเปลี่ยน)
    if (username && username.toLowerCase() !== existingUser.username) {
      const duplicateUser = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });

      if (duplicateUser) {
        return NextResponse.json({ 
          error: 'Username นี้ถูกใช้งานแล้ว' 
        }, { status: 409 });
      }
    }

    // เตรียมข้อมูลสำหรับอัพเดต
    const updateData: any = {
      name,
      role: role || existingUser.role,
      email: email || existingUser.email,
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
    };

    if (username) {
      updateData.username = username.toLowerCase();
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
        }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    // อัพเดตผู้ใช้
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'อัพเดตข้อมูลผู้ใช้สำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลผู้ใช้'
    }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // ป้องกันการลบ admin คนสุดท้าย
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      });

      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'ไม่สามารถลบ Admin คนสุดท้ายได้' 
        }, { status: 400 });
      }
    }

    // ลบผู้ใช้
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'ลบผู้ใช้สำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
    }, { status: 500 });
  }
}
