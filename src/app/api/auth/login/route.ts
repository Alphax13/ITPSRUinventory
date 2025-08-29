// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username และ Password จำเป็นต้องกรอก' }, { status: 400 });
    }

    // ค้นหาผู้ใช้จาก username
    const user = await prisma.user.findUnique({
      where: { 
        username: username.toLowerCase() 
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'บัญชีผู้ใช้ถูกปิดใช้งาน' }, { status: 401 });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวม password)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    }, { status: 500 });
  }
}
