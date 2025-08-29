// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: ดึงรายการผู้ใช้ทั้งหมด (สำหรับ admin)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: สร้างผู้ใช้ใหม่ (สำหรับ admin)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, role = 'LECTURER', email } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ 
        error: 'Username, Password และ ชื่อ จำเป็นต้องกรอก' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
      }, { status: 400 });
    }

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Username นี้ถูกใช้งานแล้ว' 
      }, { status: 409 });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 12);

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        name,
        email: email || null,
        role: role as 'ADMIN' | 'LECTURER',
        department: 'Information Technology',
        isActive: true,
      },
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
      user: newUser,
      message: 'สร้างผู้ใช้สำเร็จ'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
    }, { status: 500 });
  }
}
