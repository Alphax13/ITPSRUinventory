// scripts/create-sample-notifications.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleNotifications() {
  try {
    console.log('Creating sample notifications...');

    // Get users
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    const teacher = await prisma.user.findFirst({
      where: { role: 'LECTURER' }
    });

    if (!admin || !teacher) {
      console.log('❌ No users found. Please run the seed script first.');
      return;
    }

    // Sample notifications for admin
    const adminNotifications = [
      {
        userId: admin.id,
        title: 'แจ้งเตือนสต็อกต่ำ',
        message: 'ปากกาลูกลื่น สีน้ำเงิน เหลือเพียง 15 ชิ้น (ขั้นต่ำ 20)',
        type: 'LOW_STOCK',
        actionUrl: '/dashboard/consumables',
        metadata: {
          consumableId: 'sample-id',
          currentStock: 15,
          minStock: 20,
        },
      },
      {
        userId: admin.id,
        title: 'คำขอซื้อใหม่',
        message: 'อาจารย์ส่งคำขอซื้อวัสดุใหม่',
        type: 'REQUEST',
        actionUrl: '/dashboard/purchase-requests',
      },
      {
        userId: admin.id,
        title: 'ครุภัณฑ์ต้องซ่อมบำรุง',
        message: 'เก้าอี้สำนักงาน ต้องการซ่อมบำรุง',
        type: 'MAINTENANCE',
        actionUrl: '/dashboard/fixed-assets',
      },
      {
        userId: admin.id,
        title: 'การยืมครุภัณฑ์ใหม่',
        message: 'อาจารย์ยืมเครื่องคอมพิวเตอร์ตั้งโต๊ะ',
        type: 'INFO',
        actionUrl: '/dashboard/asset-borrows',
      },
    ];

    // Sample notifications for teacher
    const teacherNotifications = [
      {
        userId: teacher.id,
        title: 'คำขอซื้อได้รับการอนุมัติ',
        message: 'คำขอซื้อวัสดุของคุณได้รับการอนุมัติแล้ว',
        type: 'SUCCESS',
        actionUrl: '/dashboard/purchase-requests',
      },
      {
        userId: teacher.id,
        title: 'แจ้งเตือนการคืนครุภัณฑ์เกินกำหนด',
        message: 'กรุณาคืนเครื่องคอมพิวเตอร์ตั้งโต๊ะที่ยืมเมื่อวันที่ 15 ส.ค. 2025',
        type: 'OVERDUE',
        actionUrl: '/dashboard/asset-borrows',
      },
      {
        userId: teacher.id,
        title: 'ข้อมูลการเบิกวัสดุ',
        message: 'การเบิกปากกาลูกลื่น 10 ชิ้น ได้รับการอนุมัติแล้ว',
        type: 'INFO',
        actionUrl: '/dashboard/transactions',
      },
    ];

    // Create notifications
    const allNotifications = [...adminNotifications, ...teacherNotifications];
    
    for (const notification of allNotifications) {
      await prisma.notification.create({
        data: notification,
      });
    }

    console.log(`✅ Created ${allNotifications.length} sample notifications`);
    console.log(`   - Admin notifications: ${adminNotifications.length}`);
    console.log(`   - Teacher notifications: ${teacherNotifications.length}`);

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleNotifications();
