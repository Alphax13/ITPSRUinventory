// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Prisma import
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    
    // Test simple query
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
