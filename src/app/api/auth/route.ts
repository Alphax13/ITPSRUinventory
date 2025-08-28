// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: ล็อกอิน (ระบบง่าย ๆ ใช้ email)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // ค้นหาผู้ใช้จาก email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (findError) {
      console.error('User lookup failed:', findError);
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    }

    // หากไม่มีผู้ใช้ ให้สร้างใหม่ (สำหรับ demo)
    if (!user) {
      try {
        // สร้างผู้ใช้ใหม่โดยใช้ email domain เป็น department
        const domain = email.split('@')[1];
        const department = domain?.includes('edu') ? 'Academic' : 'General';
        
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0], // ใช้ส่วนหน้า @ เป็นชื่อ
            department,
          },
        });
      } catch (createError) {
        console.error('User creation failed:', createError);
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
