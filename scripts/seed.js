// scripts/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // สร้าง Users
  const staff = await prisma.user.upsert({
    where: { email: 'staff@school.edu' },
    update: {},
    create: {
      email: 'staff@school.edu',
      name: 'เจ้าหน้าที่ประจำ',
      role: 'STAFF',
      department: 'งานพัสดุ',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      email: 'teacher@school.edu',
      name: 'อาจารย์สมศักดิ์',
      role: 'LECTURER',
      department: 'คณะวิศวกรรมศาสตร์',
    },
  });

  console.log('✅ Users created');

  // สร้าง Materials
  const materials = [
    {
      name: 'ปากกาลูกลื่น สีน้ำเงิน',
      code: 'PEN-001',
      category: 'เครื่องเขียน',
      unit: 'ด้าม',
      minStock: 50,
      currentStock: 100,
      isAsset: false,
    },
    {
      name: 'กระดาษ A4 80 แกรม',
      code: 'PAPER-001',
      category: 'กระดาษ',
      unit: 'รีม',
      minStock: 10,
      currentStock: 5, // Low stock
      isAsset: false,
    },
    {
      name: 'จอคอมพิวเตอร์ 24 นิ้ว',
      code: 'MON-001',
      category: 'ครุภัณฑ์',
      unit: 'เครื่อง',
      minStock: 2,
      currentStock: 5,
      isAsset: true,
    },
    {
      name: 'เมาส์ไร้สาย',
      code: 'MOUSE-001',
      category: 'อุปกรณ์ IT',
      unit: 'ตัว',
      minStock: 10,
      currentStock: 15,
      isAsset: false,
    },
    {
      name: 'เครื่องพิมพ์เลเซอร์',
      code: 'PRINT-001',
      category: 'ครุภัณฑ์',
      unit: 'เครื่อง',
      minStock: 1,
      currentStock: 3,
      isAsset: true,
    },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { code: material.code },
      update: {},
      create: material,
    });
  }

  console.log('✅ Materials created');

  // สร้าง Sample Transactions
  const pen = await prisma.material.findUnique({ where: { code: 'PEN-001' } });
  const paper = await prisma.material.findUnique({ where: { code: 'PAPER-001' } });

  if (pen && paper) {
    await prisma.transaction.create({
      data: {
        type: 'OUT',
        quantity: 10,
        reason: 'ใช้สำหรับสอน',
        userId: teacher.id,
        materialId: pen.id,
      },
    });

    await prisma.transaction.create({
      data: {
        type: 'OUT',
        quantity: 2,
        reason: 'พิมพ์เอกสารการสอน',
        userId: teacher.id,
        materialId: paper.id,
      },
    });

    // Update stock
    await prisma.material.update({
      where: { id: pen.id },
      data: { currentStock: 90 },
    });

    await prisma.material.update({
      where: { id: paper.id },
      data: { currentStock: 3 },
    });
  }

  console.log('✅ Transactions created');

  // สร้าง Sample Assets
  const monitor = await prisma.material.findUnique({ where: { code: 'MON-001' } });
  const printer = await prisma.material.findUnique({ where: { code: 'PRINT-001' } });

  if (monitor) {
    await prisma.asset.create({
      data: {
        assetNumber: 'ASSET-MON-001',
        materialId: monitor.id,
        location: 'ห้อง 301',
        condition: 'GOOD',
      },
    });

    await prisma.asset.create({
      data: {
        assetNumber: 'ASSET-MON-002',
        materialId: monitor.id,
        location: 'ห้อง 302',
        condition: 'GOOD',
      },
    });
  }

  if (printer) {
    await prisma.asset.create({
      data: {
        assetNumber: 'ASSET-PRINT-001',
        materialId: printer.id,
        location: 'ห้องสำนักงาน',
        condition: 'GOOD',
      },
    });
  }

  console.log('✅ Assets created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
