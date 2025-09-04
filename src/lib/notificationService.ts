// src/lib/notificationService.ts
import { prisma } from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'LOW_STOCK' | 'OVERDUE' | 'MAINTENANCE' | 'REQUEST';
  actionUrl?: string;
  metadata?: any;
}

export class NotificationService {
  
  // สร้างการแจ้งเตือนใหม่
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
          actionUrl: params.actionUrl,
          metadata: params.metadata,
        },
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // สร้างการแจ้งเตือนสำหรับหลายคน
  static async createBulkNotifications(params: CreateNotificationParams[]) {
    try {
      const notifications = await prisma.notification.createMany({
        data: params.map(param => ({
          userId: param.userId,
          title: param.title,
          message: param.message,
          type: param.type || 'INFO',
          actionUrl: param.actionUrl,
          metadata: param.metadata,
        })),
      });
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // ตรวจสอบสต็อกต่ำและสร้างการแจ้งเตือน
  static async checkLowStockAndNotify() {
    try {
      // ตรวจสอบวัสดุสิ้นเปลือง - ใช้ raw query เพื่อเปรียบเทียบ field
      const lowStockConsumables = await prisma.$queryRaw`
        SELECT * FROM "ConsumableMaterial" 
        WHERE "currentStock" <= "minStock" OR "currentStock" < 5
      ` as any[];

      // ดึงรายการ admin ทั้งหมด
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      // สร้างการแจ้งเตือนสำหรับสต็อกต่ำ
      const notifications: CreateNotificationParams[] = [];

      for (const consumable of lowStockConsumables) {
        for (const admin of admins) {
          notifications.push({
            userId: admin.id,
            title: 'แจ้งเตือนสต็อกต่ำ',
            message: `${consumable.name} เหลือเพียง ${consumable.currentStock} ${consumable.unit} (ขั้นต่ำ ${consumable.minStock})`,
            type: 'LOW_STOCK',
            actionUrl: '/dashboard/consumables',
            metadata: {
              consumableId: consumable.id,
              currentStock: consumable.currentStock,
              minStock: consumable.minStock,
            },
          });
        }
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return { 
        lowStockItems: lowStockConsumables.length,
        notificationsCreated: notifications.length 
      };
    } catch (error) {
      console.error('Error checking low stock:', error);
      throw error;
    }
  }

  // ตรวจสอบครุภัณฑ์ที่เกินกำหนดการคืน
  static async checkOverdueAssetsAndNotify() {
    try {
      const overdueAssets = await prisma.assetBorrow.findMany({
        where: {
          status: 'BORROWED',
          expectedReturnDate: {
            lt: new Date(),
          },
        },
        include: {
          user: true,
          fixedAsset: true,
        },
      });

      const notifications: CreateNotificationParams[] = [];

      // แจ้งเตือนผู้ยืม
      for (const borrow of overdueAssets) {
        notifications.push({
          userId: borrow.userId,
          title: 'แจ้งเตือนการคืนครุภัณฑ์เกินกำหนด',
          message: `กรุณาคืน ${borrow.fixedAsset.name} ที่ยืมเมื่อ ${new Date(borrow.borrowDate).toLocaleDateString('th-TH')}`,
          type: 'OVERDUE',
          actionUrl: `/dashboard/asset-borrows`,
          metadata: {
            borrowId: borrow.id,
            assetId: borrow.fixedAssetId,
            expectedReturnDate: borrow.expectedReturnDate,
          },
        });
      }

      // แจ้งเตือน admin
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      for (const admin of admins) {
        if (overdueAssets.length > 0) {
          notifications.push({
            userId: admin.id,
            title: 'แจ้งเตือนครุภัณฑ์เกินกำหนดคืน',
            message: `มีครุภัณฑ์ ${overdueAssets.length} รายการที่เกินกำหนดคืน`,
            type: 'OVERDUE',
            actionUrl: '/dashboard/asset-borrows',
            metadata: {
              overdueCount: overdueAssets.length,
            },
          });
        }
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return { 
        overdueItems: overdueAssets.length,
        notificationsCreated: notifications.length 
      };
    } catch (error) {
      console.error('Error checking overdue assets:', error);
      throw error;
    }
  }

  // ตรวจสอบครุภัณฑ์ที่ต้องซ่อมบำรุง
  static async checkMaintenanceAndNotify() {
    try {
      const needsRepairAssets = await prisma.fixedAsset.findMany({
        where: {
          condition: {
            in: ['NEEDS_REPAIR', 'DAMAGED'],
          },
        },
      });

      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      const notifications: CreateNotificationParams[] = [];

      for (const admin of admins) {
        if (needsRepairAssets.length > 0) {
          notifications.push({
            userId: admin.id,
            title: 'แจ้งเตือนครุภัณฑ์ที่ต้องซ่อมบำรุง',
            message: `มีครุภัณฑ์ ${needsRepairAssets.length} รายการที่ต้องซ่อมบำรุง`,
            type: 'MAINTENANCE',
            actionUrl: '/dashboard/fixed-assets',
            metadata: {
              needsRepairCount: needsRepairAssets.length,
              assetIds: needsRepairAssets.map(a => a.id),
            },
          });
        }
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return { 
        needsRepairItems: needsRepairAssets.length,
        notificationsCreated: notifications.length 
      };
    } catch (error) {
      console.error('Error checking maintenance needs:', error);
      throw error;
    }
  }

  // แจ้งเตือนคำขอซื้อใหม่
  static async notifyNewPurchaseRequest(requestId: string, requesterId: string) {
    try {
      const request = await prisma.purchaseRequest.findUnique({
        where: { id: requestId },
        include: { requester: true },
      });

      if (!request) {
        throw new Error('Purchase request not found');
      }

      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      const notifications: CreateNotificationParams[] = [];

      for (const admin of admins) {
        notifications.push({
          userId: admin.id,
          title: 'คำขอซื้อใหม่',
          message: `${request.requester.name} ส่งคำขอซื้อใหม่`,
          type: 'REQUEST',
          actionUrl: `/dashboard/purchase-requests`,
          metadata: {
            requestId: request.id,
            requesterId: request.requesterId,
          },
        });
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error notifying new purchase request:', error);
      throw error;
    }
  }

  // แจ้งเตือนการเบิกวัสดุสิ้นเปลือง
  static async notifyConsumableWithdrawal(
    consumableId: string, 
    userId: string, 
    quantity: number
  ) {
    try {
      const consumable = await prisma.consumableMaterial.findUnique({
        where: { id: consumableId },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!consumable || !user) {
        throw new Error('Consumable or user not found');
      }

      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      const notifications: CreateNotificationParams[] = [];

      for (const admin of admins) {
        notifications.push({
          userId: admin.id,
          title: 'การเบิกวัสดุสิ้นเปลือง',
          message: `${user.name} เบิก ${consumable.name} จำนวน ${quantity} ${consumable.unit}`,
          type: 'INFO',
          actionUrl: '/dashboard/consumables',
          metadata: {
            consumableId: consumable.id,
            userId: user.id,
            quantity,
            type: 'WITHDRAWAL',
          },
        });
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error notifying consumable withdrawal:', error);
      throw error;
    }
  }

  // แจ้งเตือนการยืมครุภัณฑ์
  static async notifyAssetBorrow(borrowId: string) {
    try {
      const borrow = await prisma.assetBorrow.findUnique({
        where: { id: borrowId },
        include: {
          fixedAsset: true,
          user: true,
        },
      });

      if (!borrow) {
        throw new Error('Borrow record not found');
      }

      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
      });

      const notifications: CreateNotificationParams[] = [];

      for (const admin of admins) {
        notifications.push({
          userId: admin.id,
          title: 'การยืมครุภัณฑ์',
          message: `${borrow.user.name} ยืม ${borrow.fixedAsset.name} (${borrow.fixedAsset.assetNumber})`,
          type: 'INFO',
          actionUrl: '/dashboard/asset-borrows',
          metadata: {
            borrowId: borrow.id,
            assetId: borrow.fixedAssetId,
            userId: borrow.userId,
            type: 'BORROW',
          },
        });
      }

      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error notifying asset borrow:', error);
      throw error;
    }
  }

  // แจ้งเตือนการอนุมัติคำขอซื้อ
  static async notifyPurchaseRequestApproval(requestId: string, status: string) {
    try {
      const request = await prisma.purchaseRequest.findUnique({
        where: { id: requestId },
        include: { requester: true },
      });

      if (!request) {
        throw new Error('Purchase request not found');
      }

      // แจ้งเตือนผู้ขอเมื่อคำขอได้รับอนุมัติหรือถูกปฏิเสธ
      const title = status === 'APPROVED' ? 'คำขอซื้อได้รับอนุมัติ' : 'คำขอซื้อถูกปฏิเสธ';
      const message = status === 'APPROVED' 
        ? 'คำขอซื้อของคุณได้รับอนุมัติแล้ว' 
        : 'คำขอซื้อของคุณถูกปฏิเสธ';
      const type = status === 'APPROVED' ? 'SUCCESS' : 'WARNING';

      await this.createNotification({
        userId: request.requesterId,
        title,
        message,
        type,
        actionUrl: '/dashboard/purchase-requests',
        metadata: {
          requestId: request.id,
          status,
          type: 'PURCHASE_REQUEST_UPDATE',
        },
      });

      return 1;
    } catch (error) {
      console.error('Error notifying purchase request approval:', error);
      throw error;
    }
  }

  // รันการตรวจสอบทั้งหมด
  static async runAllChecks() {
    try {
      const results = await Promise.allSettled([
        this.checkLowStockAndNotify(),
        this.checkOverdueAssetsAndNotify(),
        this.checkMaintenanceAndNotify(),
      ]);

      return results.map((result, index) => ({
        check: ['lowStock', 'overdueAssets', 'maintenance'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    } catch (error) {
      console.error('Error running all notification checks:', error);
      throw error;
    }
  }
}
