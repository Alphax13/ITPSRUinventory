// scripts/create-sample-materials.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleMaterials() {
  try {
    console.log('🚀 กำลังสร้างวัสดุตัวอย่าง...\n');

    // 1. สร้างวัสดุสิ้นเปลือง (ConsumableMaterial)
    console.log('📦 สร้างวัสดุสิ้นเปลือง...');
    const consumables = [
      {
        name: 'กระดาษ A4',
        category: 'เครื่องเขียน',
        unit: 'รีม',
        minStock: 10,
        currentStock: 50,
        location: 'ตู้เก็บของ A-1',
        description: 'กระดาษ A4 80 แกรม สีขาว'
      },
      {
        name: 'ปากกาลูกลื่น',
        category: 'เครื่องเขียน',
        unit: 'ด้าม',
        minStock: 20,
        currentStock: 100,
        location: 'ตู้เก็บของ A-2',
        description: 'ปากกาลูกลื่น สีน้ำเงิน'
      },
      {
        name: 'หมึกเครื่องพิมพ์ HP',
        category: 'อุปกรณ์คอมพิวเตอร์',
        unit: 'ตลับ',
        minStock: 5,
        currentStock: 15,
        location: 'ตู้เก็บของ B-1',
        description: 'หมึกเครื่องพิมพ์ HP LaserJet'
      },
      {
        name: 'แบตเตอรี่ AA',
        category: 'อิเล็กทรอนิกส์',
        unit: 'ก้อน',
        minStock: 10,
        currentStock: 30,
        location: 'ตู้เก็บของ C-1',
        description: 'แบตเตอรี่อัลคาไลน์ AA'
      },
      {
        name: 'สายแลน Cat6',
        category: 'อุปกรณ์เครือข่าย',
        unit: 'เมตร',
        minStock: 100,
        currentStock: 500,
        location: 'คลังเก็บของ D-1',
        description: 'สายแลน Cat6 UTP Cable'
      }
    ];

    for (const consumable of consumables) {
      const created = await prisma.consumableMaterial.create({
        data: consumable
      });
      console.log(`  ✅ สร้าง: ${created.name} (${created.currentStock} ${created.unit})`);
    }

    // 2. สร้างครุภัณฑ์ (FixedAsset)
    console.log('\n🏷️ สร้างครุภัณฑ์...');
    const assets = [
      {
        assetNumber: 'AST-2024-001',
        name: 'คอมพิวเตอร์ All-in-One',
        category: 'คอมพิวเตอร์',
        brand: 'Dell',
        model: 'OptiPlex 3000',
        serialNumber: 'DL001234567',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 25000.00,
        location: 'ห้อง IT-101',
        condition: 'GOOD',
        description: 'คอมพิวเตอร์ All-in-One สำหรับงานสำนักงาน'
      },
      {
        assetNumber: 'AST-2024-002',
        name: 'เครื่องพิมพ์เลเซอร์',
        category: 'เครื่องพิมพ์',
        brand: 'HP',
        model: 'LaserJet Pro M404n',
        serialNumber: 'HP987654321',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 8500.00,
        location: 'ห้องเอกสาร',
        condition: 'GOOD',
        description: 'เครื่องพิมพ์เลเซอร์ขาวดำ'
      },
      {
        assetNumber: 'AST-2024-003',
        name: 'โปรเจคเตอร์',
        category: 'อุปกรณ์นำเสนอ',
        brand: 'Epson',
        model: 'EB-X41',
        serialNumber: 'EP456789123',
        purchaseDate: new Date('2024-03-10'),
        purchasePrice: 15000.00,
        location: 'ห้องประชุม A',
        condition: 'GOOD',
        description: 'โปรเจคเตอร์ LCD 3600 Lumens'
      },
      {
        assetNumber: 'AST-2024-004',
        name: 'เก้าอี้สำนักงาน',
        category: 'เฟอร์นิเจอร์',
        brand: 'Herman Miller',
        model: 'Aeron Chair',
        serialNumber: 'HM789123456',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 35000.00,
        location: 'ห้องผู้อำนวยการ',
        condition: 'GOOD',
        description: 'เก้าอี้เพื่อสุขภาพ ergonomic design'
      }
    ];

    for (const asset of assets) {
      const created = await prisma.fixedAsset.create({
        data: asset
      });
      console.log(`  ✅ สร้าง: ${created.name} (${created.assetNumber}) - ${created.location}`);
    }

    // 3. สร้างวัสดุแบบเก่า (Material - Legacy)
    console.log('\n📋 สร้างวัสดุแบบเก่า (Legacy)...');
    const legacyMaterials = [
      {
        name: 'คลิปหนีบกระดาษ',
        code: 'MAT-001',
        category: 'เครื่องเขียน',
        unit: 'กล่อง',
        minStock: 5,
        currentStock: 20,
        isAsset: false
      },
      {
        name: 'เทปใส',
        code: 'MAT-002',
        category: 'เครื่องเขียน',
        unit: 'ม้วน',
        minStock: 10,
        currentStock: 25,
        isAsset: false
      },
      {
        name: 'กาวแท่ง',
        code: 'MAT-003',
        category: 'เครื่องเขียน',
        unit: 'แท่ง',
        minStock: 8,
        currentStock: 30,
        isAsset: false
      }
    ];

    for (const material of legacyMaterials) {
      const created = await prisma.material.create({
        data: material
      });
      console.log(`  ✅ สร้าง: ${created.name} (${created.code}) - ${created.currentStock} ${created.unit}`);
    }

    console.log('\n🎉 สร้างวัสดุตัวอย่างเสร็จสิ้น!');
    console.log('\n📊 สรุปผลการสร้าง:');
    
    const consumableCount = await prisma.consumableMaterial.count();
    const assetCount = await prisma.fixedAsset.count();
    const legacyCount = await prisma.material.count();
    
    console.log(`  📦 วัสดุสิ้นเปลือง: ${consumableCount} รายการ`);
    console.log(`  🏷️ ครุภัณฑ์: ${assetCount} รายการ`);
    console.log(`  📋 วัสดุแบบเก่า: ${legacyCount} รายการ`);
    console.log(`  🔢 รวมทั้งหมด: ${consumableCount + assetCount + legacyCount} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างวัสดุ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ฟังก์ชันสำหรับสร้างวัสดุเดี่ยว
async function createSingleMaterial(type, data) {
  try {
    let created;
    
    switch (type) {
      case 'consumable':
        created = await prisma.consumableMaterial.create({ data });
        console.log(`✅ สร้างวัสดุสิ้นเปลือง: ${created.name}`);
        break;
        
      case 'asset':
        created = await prisma.fixedAsset.create({ data });
        console.log(`✅ สร้างครุภัณฑ์: ${created.name} (${created.assetNumber})`);
        break;
        
      case 'legacy':
        created = await prisma.material.create({ data });
        console.log(`✅ สร้างวัสดุแบบเก่า: ${created.name} (${created.code})`);
        break;
        
      default:
        throw new Error('ประเภทวัสดุไม่ถูกต้อง (consumable, asset, legacy)');
    }
    
    return created;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ตัวอย่างการใช้งาน
async function example() {
  console.log('📝 ตัวอย่างการสร้างวัสดุแต่ละประเภท:\n');
  
  // ตัวอย่างการสร้างวัสดุสิ้นเปลือง
  console.log('1. สร้างวัสดุสิ้นเปลือง:');
  console.log(`
const newConsumable = await createSingleMaterial('consumable', {
  name: 'ยางลบ',
  category: 'เครื่องเขียน',
  unit: 'ก้อน',
  minStock: 20,
  currentStock: 50,
  location: 'ตู้เก็บของ A-1',
  description: 'ยางลบดินสอ'
});`);

  // ตัวอย่างการสร้างครุภัณฑ์
  console.log('\n2. สร้างครุภัณฑ์:');
  console.log(`
const newAsset = await createSingleMaterial('asset', {
  assetNumber: 'AST-2024-005',
  name: 'โน๊ตบุ๊ค',
  category: 'คอมพิวเตอร์',
  brand: 'Lenovo',
  model: 'ThinkPad E14',
  serialNumber: 'LN123456789',
  purchaseDate: new Date('2024-04-01'),
  purchasePrice: 22000.00,
  location: 'ห้อง IT-102',
  condition: 'GOOD',
  description: 'โน๊ตบุ๊คสำหรับงานเคลื่อนที่'
});`);

  // ตัวอย่างการสร้างวัสดุแบบเก่า
  console.log('\n3. สร้างวัสดุแบบเก่า:');
  console.log(`
const newLegacy = await createSingleMaterial('legacy', {
  name: 'ไม้บรรทัด',
  code: 'MAT-004',
  category: 'เครื่องเขียน',
  unit: 'อัน',
  minStock: 10,
  currentStock: 25,
  isAsset: false
});`);
}

// รันสคริปต์หลัก
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--example')) {
    example();
  } else {
    createSampleMaterials();
  }
}

module.exports = {
  createSampleMaterials,
  createSingleMaterial
};
