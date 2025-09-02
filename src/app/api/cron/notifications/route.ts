// src/app/api/cron/notifications/route.ts
import { NextResponse } from 'next/server';
import { runScheduledNotifications } from '@/lib/notificationIntegration';

export async function GET() {
  try {
    // This would typically be protected by an API key or cron service authentication
    const results = await runScheduledNotifications();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('Error in scheduled notifications:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run scheduled notifications',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Also allow manual trigger via POST
  return GET();
}
