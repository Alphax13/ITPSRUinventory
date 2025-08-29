// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // สร้าง Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      username: 'admin',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // admin123
      name: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
      department: 'Information Technology',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      email: 'teacher@school.edu',
      username: 'teacher',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // teacher123
      name: 'อาจารย์',
      role: 'LECTURER',
      department: 'Computer Science',
    },
  });

  // สร้างวัสดุสิ้นเปลือง
  const consumables = await Promise.all([
    prisma.consumableMaterial.create({
      data: {
        name: 'ปากกาลูกลื่น สีน้ำเงิน',
        category: 'เครื่องเขียน',
        unit: 'ชิ้น',
        minStock: 20,
        currentStock: 45,
        location: 'ห้องพัสดุ ชั้น 1',
        description: 'ปากกาลูกลื่นสีน้ำเงิน ยี่ห้อ Pilot',
      },
    }),
    prisma.consumableMaterial.create({
      data: {
        name: 'กระดาษ A4',
        category: 'กระดาษ',
        unit: 'รีม',
        minStock: 10,
        currentStock: 25,
        location: 'ห้องพัสดุ ชั้น 1',
        description: 'กระดาษ A4 80 แกรม สีขาว',
      },
    }),
    prisma.consumableMaterial.create({
      data: {
        name: 'ดินสอ 2B',
        category: 'เครื่องเขียน',
        unit: 'ชิ้น',
        minStock: 30,
        currentStock: 8, // สต็อกต่ำ
        location: 'ห้องพัสดุ ชั้น 1',
        description: 'ดินสอ 2B ยี่ห้อ Steadtler',
      },
    }),
  ]);

  // สร้างครุภัณฑ์
  const assets = await Promise.all([
    prisma.fixedAsset.create({
      data: {
        assetNumber: 'AST-001001',
        name: 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ',
        category: 'คอมพิวเตอร์',
        brand: 'Dell',
        model: 'OptiPlex 3070',
        serialNumber: 'DL-2023-001',
        location: 'ห้อง 201 อาคาร A',
        condition: 'GOOD',
        description: 'เครื่องคอมพิวเตอร์สำหรับงานสำนักงาน',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 25000,
      },
    }),
    prisma.fixedAsset.create({
      data: {
        assetNumber: 'AST-002001',
        name: 'เครื่องปริ้นเตอร์เลเซอร์',
        category: 'เครื่องใช้ไฟฟ้า',
        brand: 'HP',
        model: 'LaserJet Pro M404n',
        serialNumber: 'HP-2023-002',
        location: 'ห้องพิมพ์ ชั้น 1',
        condition: 'GOOD',
        description: 'เครื่องปริ้นเตอร์เลเซอร์ขาวดำ',
        purchaseDate: new Date('2023-02-20'),
        purchasePrice: 8500,
      },
    }),
    prisma.fixedAsset.create({
      data: {
        assetNumber: 'AST-003001',
        name: 'เก้าอี้สำนักงาน',
        category: 'เฟอร์นิเจอร์',
        brand: 'Index Living',
        model: 'Office Chair Pro',
        location: 'ห้อง 202 อาคาร A',
        condition: 'NEEDS_REPAIR',
        description: 'เก้าอี้สำนักงานหนังสีดำ ล้อแตก',
        purchaseDate: new Date('2022-08-10'),
        purchasePrice: 3500,
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('👥 Users created:', { admin: admin.email, teacher: teacher.email });
  console.log('📦 Consumables created:', consumables.length);
  console.log('🏷️ Assets created:', assets.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
