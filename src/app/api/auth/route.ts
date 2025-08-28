// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';

// POST: ล็อกอิน (ระบบง่าย ๆ ใช้ email) - v3 simple version
export async function POST(request: Request) {
  try {
    console.log('Auth API called');
    const body = await request.json();
    const { email } = body;
    
    console.log('Email received:', email);

    if (!email) {
      console.log('No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Import Prisma dynamically to avoid initialization issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    console.log('Prisma client created');

    // ค้นหาผู้ใช้จาก email
    let user;
    try {
      console.log('Looking up user...');
      user = await prisma.user.findUnique({
        where: { email },
      });
      console.log('User found:', user);
    } catch (findError) {
      console.error('User lookup failed:', findError);
      await prisma.$disconnect();
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    }

    // หากไม่มีผู้ใช้ ให้สร้างใหม่ (สำหรับ demo)
    if (!user) {
      try {
        console.log('Creating new user...');
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
        console.log('New user created:', user);
      } catch (createError) {
        console.error('User creation failed:', createError);
        await prisma.$disconnect();
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
      }
    }

    await prisma.$disconnect();

    console.log('Returning user data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });

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
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
