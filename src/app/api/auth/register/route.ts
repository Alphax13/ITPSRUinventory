// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, role = 'LECTURER' } = body;

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
        role: role as 'ADMIN' | 'LECTURER',
        department: 'Information Technology',
        isActive: true,
      },
    });

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวม password)
    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
      },
      message: 'สมัครสมาชิกสำเร็จ'
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
    }, { status: 500 });
  }
}
