// src/lib/notificationIntegration.ts
import { NotificationService } from '@/lib/notificationService';

// Integration with consumable transactions
export async function notifyLowStock(consumableId: string) {
  try {
    const results = await NotificationService.checkLowStockAndNotify();
    return results;
  } catch (error) {
    console.error('Error in low stock notification:', error);
  }
}

// Integration with asset borrowing
export async function notifyNewBorrow(borrowId: string) {
  try {
    // Get admins to notify
    const { prisma } = await import('@/lib/prisma');
    
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        user: true,
        fixedAsset: true,
      },
    });

    if (!borrow) return;

    const admins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        isActive: true 
      },
    });

    const notifications = admins.map(admin => ({
      userId: admin.id,
      title: 'การยืมครุภัณฑ์ใหม่',
      message: `${borrow.user.name} ยืม ${borrow.fixedAsset.name}`,
      type: 'INFO' as const,
      actionUrl: '/dashboard/asset-borrows',
      metadata: {
        borrowId: borrow.id,
        userId: borrow.userId,
        assetId: borrow.fixedAssetId,
      },
    }));

    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(notifications);
    }

    return notifications.length;
  } catch (error) {
    console.error('Error notifying new borrow:', error);
  }
}

// Integration with asset return
export async function notifyOverdueReturn(borrowId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const borrow = await prisma.assetBorrow.findUnique({
      where: { id: borrowId },
      include: {
        user: true,
        fixedAsset: true,
      },
    });

    if (!borrow || !borrow.expectedReturnDate) return;

    const isOverdue = new Date() > new Date(borrow.expectedReturnDate);
    
    if (isOverdue) {
      await NotificationService.createNotification({
        userId: borrow.userId,
        title: 'แจ้งเตือนการคืนครุภัณฑ์เกินกำหนด',
        message: `กรุณาคืน ${borrow.fixedAsset.name} ที่ยืมเมื่อ ${new Date(borrow.borrowDate).toLocaleDateString('th-TH')}`,
        type: 'OVERDUE',
        actionUrl: '/dashboard/asset-borrows',
        metadata: {
          borrowId: borrow.id,
          assetId: borrow.fixedAssetId,
          expectedReturnDate: borrow.expectedReturnDate,
        },
      });

      return 1;
    }

    return 0;
  } catch (error) {
    console.error('Error notifying overdue return:', error);
  }
}

// Integration with purchase requests
export async function notifyPurchaseRequestStatusChange(
  requestId: string, 
  newStatus: 'APPROVED' | 'REJECTED'
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });

    if (!request) return;

    const statusText = newStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';
    const notificationType = newStatus === 'APPROVED' ? 'SUCCESS' : 'ERROR';

    await NotificationService.createNotification({
      userId: request.requesterId,
      title: `คำขอซื้อถูก${statusText}`,
      message: `คำขอซื้อของคุณได้รับการ${statusText}แล้ว`,
      type: notificationType,
      actionUrl: '/dashboard/purchase-requests',
      metadata: {
        requestId: request.id,
        status: newStatus,
      },
    });

    return 1;
  } catch (error) {
    console.error('Error notifying purchase request status change:', error);
  }
}

// Integration with asset maintenance
export async function notifyMaintenanceRequired(assetId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const asset = await prisma.fixedAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) return;

    const admins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        isActive: true 
      },
    });

    const notifications = admins.map(admin => ({
      userId: admin.id,
      title: 'ครุภัณฑ์ต้องการบำรุงรักษา',
      message: `${asset.name} (${asset.assetNumber}) ต้องการบำรุงรักษา`,
      type: 'MAINTENANCE' as const,
      actionUrl: '/dashboard/fixed-assets',
      metadata: {
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        condition: asset.condition,
      },
    }));

    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(notifications);
    }

    return notifications.length;
  } catch (error) {
    console.error('Error notifying maintenance required:', error);
  }
}

// Cron job function (can be called by a scheduled task)
export async function runScheduledNotifications() {
  try {
    console.log('Running scheduled notifications...');
    const results = await NotificationService.runAllChecks();
    console.log('Scheduled notifications completed:', results);
    return results;
  } catch (error) {
    console.error('Error in scheduled notifications:', error);
    throw error;
  }
}
