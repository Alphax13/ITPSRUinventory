// src/app/api/test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic response
    return NextResponse.json({ 
      message: 'API is working',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
