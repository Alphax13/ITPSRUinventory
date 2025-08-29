// scripts/create-material-interactive.js
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// สร้าง readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ฟังก์ชันสำหรับถามคำถาม
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// ฟังก์ชันแสดงเมนู
function showMenu() {
  console.log('\n🎯 เลือกประเภทวัสดุที่ต้องการสร้าง:');
  console.log('1. 📦 วัสดุสิ้นเปลือง (ConsumableMaterial)');
  console.log('2. 🏷️ ครุภัณฑ์ (FixedAsset)');
  console.log('3. 📋 วัสดุแบบเก่า (Material - Legacy)');
  console.log('4. 🚪 ออกจากโปรแกรม');
  console.log('─'.repeat(50));
}

// สร้างวัสดุสิ้นเปลือง
async function createConsumableMaterial() {
  console.log('\n📦 สร้างวัสดุสิ้นเปลือง');
  console.log('─'.repeat(30));
  
  try {
    const name = await askQuestion('ชื่อวัสดุ: ');
    const category = await askQuestion('หมวดหมู่: ');
    const unit = await askQuestion('หน่วยนับ (เช่น กล่อง, ชิ้น, ม้วน): ');
    const minStock = parseInt(await askQuestion('จำนวนขั้นต่ำ: '));
    const currentStock = parseInt(await askQuestion('จำนวนปัจจุบัน: '));
    const location = await askQuestion('ตำแหน่งจัดเก็บ (ไม่บังคับ): ');
    const description = await askQuestion('รายละเอียด (ไม่บังคับ): ');

    const data = {
      name,
      category,
      unit,
      minStock,
      currentStock,
      location: location || null,
      description: description || null
    };

    const created = await prisma.consumableMaterial.create({ data });
    
    console.log('\n✅ สร้างวัสดุสิ้นเปลืองสำเร็จ!');
    console.log(`📦 ชื่อ: ${created.name}`);
    console.log(`🏷️ หมวดหมู่: ${created.category}`);
    console.log(`📊 จำนวน: ${created.currentStock} ${created.unit}`);
    console.log(`📍 ตำแหน่ง: ${created.location || 'ไม่ระบุ'}`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

// สร้างครุภัณฑ์
async function createFixedAsset() {
  console.log('\n🏷️ สร้างครุภัณฑ์');
  console.log('─'.repeat(20));
  
  try {
    const assetNumber = await askQuestion('เลขกำกับครุภัณฑ์ (เช่น AST-2024-001): ');
    const name = await askQuestion('ชื่อครุภัณฑ์: ');
    const category = await askQuestion('หมวดหมู่: ');
    const brand = await askQuestion('ยี่ห้อ (ไม่บังคับ): ');
    const model = await askQuestion('รุ่น (ไม่บังคับ): ');
    const serialNumber = await askQuestion('เลขซีเรียล (ไม่บังคับ): ');
    const purchaseDateStr = await askQuestion('วันที่ซื้อ (YYYY-MM-DD, ไม่บังคับ): ');
    const purchasePriceStr = await askQuestion('ราคาซื้อ (ไม่บังคับ): ');
    const location = await askQuestion('ตำแหน่ง: ');
    const conditionInput = await askQuestion('สภาพ (GOOD/DAMAGED/NEEDS_REPAIR/DISPOSED) [GOOD]: ');
    const description = await askQuestion('รายละเอียด (ไม่บังคับ): ');

    const data = {
      assetNumber,
      name,
      category,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDateStr ? new Date(purchaseDateStr) : null,
      purchasePrice: purchasePriceStr ? parseFloat(purchasePriceStr) : null,
      location,
      condition: conditionInput || 'GOOD',
      description: description || null
    };

    const created = await prisma.fixedAsset.create({ data });
    
    console.log('\n✅ สร้างครุภัณฑ์สำเร็จ!');
    console.log(`🏷️ เลขกำกับ: ${created.assetNumber}`);
    console.log(`📛 ชื่อ: ${created.name}`);
    console.log(`🏭 ยี่ห้อ: ${created.brand || 'ไม่ระบุ'} ${created.model || ''}`);
    console.log(`📍 ตำแหน่ง: ${created.location}`);
    console.log(`📊 สภาพ: ${created.condition}`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

// สร้างวัสดุแบบเก่า
async function createLegacyMaterial() {
  console.log('\n📋 สร้างวัสดุแบบเก่า');
  console.log('─'.repeat(25));
  
  try {
    const name = await askQuestion('ชื่อวัสดุ: ');
    const code = await askQuestion('รหัสวัสดุ (เช่น MAT-001): ');
    const category = await askQuestion('หมวดหมู่: ');
    const unit = await askQuestion('หน่วยนับ (ไม่บังคับ): ');
    const minStock = await askQuestion('จำนวนขั้นต่ำ (ไม่บังคับ): ');
    const currentStock = parseInt(await askQuestion('จำนวนปัจจุบัน: ')) || 0;
    const isAssetInput = await askQuestion('เป็นครุภัณฑ์? (y/n) [n]: ');

    const data = {
      name,
      code,
      category,
      unit: unit || null,
      minStock: minStock ? parseInt(minStock) : null,
      currentStock,
      isAsset: isAssetInput.toLowerCase() === 'y'
    };

    const created = await prisma.material.create({ data });
    
    console.log('\n✅ สร้างวัสดุแบบเก่าสำเร็จ!');
    console.log(`📋 รหัส: ${created.code}`);
    console.log(`📛 ชื่อ: ${created.name}`);
    console.log(`🏷️ หมวดหมู่: ${created.category}`);
    console.log(`📊 จำนวน: ${created.currentStock} ${created.unit || 'หน่วย'}`);
    console.log(`🏷️ ประเภท: ${created.isAsset ? 'ครุภัณฑ์' : 'วัสดุสิ้นเปลือง'}`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

// ฟังก์ชันหลัก
async function main() {
  console.log('🎉 ยินดีต้อนรับสู่โปรแกรมสร้างวัสดุ!');
  console.log('📝 โปรแกรมนี้จะช่วยให้คุณสร้างวัสดุใหม่ในระบบได้อย่างง่ายดาย');
  
  while (true) {
    showMenu();
    const choice = await askQuestion('เลือกตัวเลข (1-4): ');
    
    switch (choice) {
      case '1':
        await createConsumableMaterial();
        break;
      case '2':
        await createFixedAsset();
        break;
      case '3':
        await createLegacyMaterial();
        break;
      case '4':
        console.log('👋 ขอบคุณที่ใช้บริการ!');
        rl.close();
        return;
      default:
        console.log('❌ กรุณาเลือกตัวเลข 1-4');
    }
    
    const continueInput = await askQuestion('\n🔄 ต้องการสร้างวัสดุเพิ่มเติมหรือไม่? (y/n): ');
    if (continueInput.toLowerCase() !== 'y') {
      console.log('👋 ขอบคุณที่ใช้บริการ!');
      break;
    }
  }
  
  rl.close();
}

// รันโปรแกรม
if (require.main === module) {
  main().catch(console.error).finally(() => {
    prisma.$disconnect();
  });
}
