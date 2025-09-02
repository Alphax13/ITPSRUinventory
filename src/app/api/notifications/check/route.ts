// src/app/api/notifications/check/route.ts
import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notificationService';

export async function POST() {
  try {
    const results = await NotificationService.runAllChecks();
    
    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Error running notification checks:', error);
    return NextResponse.json(
      { error: 'Failed to run notification checks' },
      { status: 500 }
    );
  }
}
