// scripts/import-it-stock.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importITStock() {
  try {
    console.log('🚀 เริ่มการนำเข้าข้อมูลวัสดุจากไฟล์ it_stock.json...\n');

    // อ่านไฟล์ JSON
    const jsonPath = path.join(__dirname, '..', 'it_stock.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`ไม่พบไฟล์ ${jsonPath}`);
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const stockItems = JSON.parse(jsonData);

    console.log(`📋 พบข้อมูลวัสดุทั้งหมด ${stockItems.length} รายการ\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    // สร้างแผนที่หมวดหมู่ที่ปรับปรุงแล้ว
    const categoryMap = {
      'อุปกรณ์สำนักงาน': 'อุปกรณ์สำนักงาน',
      'เครื่องเขียน': 'เครื่องเขียน', 
      'อุปกรณ์คอมพิวเตอร์': 'อุปกรณ์คอมพิวเตอร์',
      'อุปกรณ์ต่อพ่วง': 'อุปกรณ์ไฟฟ้า',
      'อิเล็กทรอนิกส์': 'อุปกรณ์อิเล็กทรอนิกส์'
    };

    // ฟังก์ชันปรับปรุงชื่อวัสดุ
    const cleanItemName = (name) => {
      return name
        .replace(/\s+/g, ' ') // แทนที่ช่องว่างหลายตัวด้วยช่องว่างเดียว
        .trim() // ลบช่องว่างหน้าหลัง
        .replace(/\(ชำรุด\)/g, '') // ลบคำว่า (ชำรุด)
        .trim();
    };

    // ฟังก์ชันสร้างรหัสวัสดุ
    const generateMaterialCode = (name, category, index) => {
      const categoryCode = {
        'อุปกรณ์สำนักงาน': 'OFF',
        'เครื่องเขียน': 'STA', 
        'อุปกรณ์คอมพิวเตอร์': 'COM',
        'อุปกรณ์ไฟฟ้า': 'ELE',
        'อุปกรณ์อิเล็กทรอนิกส์': 'ELC'
      };
      
      const code = categoryCode[category] || 'GEN';
      const number = String(index + 1).padStart(3, '0');
      return `${code}-${number}`;
    };

    // ฟังก์ชันกำหนดตำแหน่งตามหมวดหมู่
    const getLocationByCategory = (category) => {
      const locationMap = {
        'อุปกรณ์สำนักงาน': 'ตู้เก็บของ A (อุปกรณ์สำนักงาน)',
        'เครื่องเขียน': 'ตู้เก็บของ B (เครื่องเขียน)', 
        'อุปกรณ์คอมพิวเตอร์': 'ตู้เก็บของ C (อุปกรณ์คอมพิวเตอร์)',
        'อุปกรณ์ไฟฟ้า': 'ตู้เก็บของ D (อุปกรณ์ไฟฟ้า)',
        'อุปกรณ์อิเล็กทรอนิกส์': 'ตู้เก็บของ E (อิเล็กทรอนิกส์)'
      };
      return locationMap[category] || 'คลังวัสดุหลัก';
    };

    // วนลูปสร้างวัสดุแต่ละรายการ
    for (let i = 0; i < stockItems.length; i++) {
      const item = stockItems[i];
      
      try {
        // ปรับปรุงชื่อวัสดุ
        const cleanedName = cleanItemName(item.item_name);
        
        // ตรวจสอบว่ามีวัสดุชื่อเดียวกันอยู่แล้วหรือไม่
        const existingItem = await prisma.consumableMaterial.findFirst({
          where: { name: cleanedName }
        });

        if (existingItem) {
          console.log(`⚠️  ข้าม: ${cleanedName} (มีอยู่แล้ว)`);
          skipCount++;
          continue;
        }

        // จัดการหมวดหมู่
        const mappedCategory = categoryMap[item.Category] || item.Category;
        
        // สร้างรหัสวัสดุ
        const materialCode = generateMaterialCode(cleanedName, mappedCategory, i);
        
        // กำหนดตำแหน่ง
        const location = getLocationByCategory(mappedCategory);

        // จัดการกรณีพิเศษ
        let specialNote = '';
        if (item.item_name.includes('(ชำรุด)')) {
          specialNote = ' - สินค้าชำรุด';
        }
        if (item.quantity === 0) {
          specialNote += ' - สินค้าหมด';
        }

        // เตรียมข้อมูลสำหรับสร้าง
        const materialData = {
          name: cleanedName,
          category: mappedCategory,
          unit: item.unit,
          minStock: item.min_quantity,
          currentStock: item.quantity,
          imageUrl: item.image_url || null,
          location: location,
          description: `รหัส: ${materialCode} | นำเข้าจากระบบเก่า${specialNote} | หมวดหมู่เดิม: ${item.Category}`
        };

        // สร้างวัสดุใหม่
        const created = await prisma.consumableMaterial.create({
          data: materialData
        });

        const statusIcon = item.quantity === 0 ? '🔴' : item.quantity <= item.min_quantity ? '🟡' : '🟢';
        console.log(`✅ สร้าง: ${statusIcon} ${created.name} (${created.currentStock} ${created.unit}) - ${mappedCategory}`);
        successCount++;

      } catch (error) {
        console.error(`❌ ข้อผิดพลาด: ${item.item_name} - ${error.message}`);
        errors.push({ item: item.item_name, error: error.message });
        errorCount++;
      }
    }

    // แสดงสรุปผล
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการนำเข้าข้อมูล');
    console.log('='.repeat(60));
    console.log(`✅ สร้างสำเร็จ:     ${successCount} รายการ`);
    console.log(`⚠️  ข้าม:          ${skipCount} รายการ`);
    console.log(`❌ ข้อผิดพลาด:    ${errorCount} รายการ`);
    console.log(`📋 รวมทั้งหมด:     ${stockItems.length} รายการ`);

    // แสดงข้อผิดพลาดหากมี
    if (errors.length > 0) {
      console.log('\n🚨 รายการที่มีข้อผิดพลาด:');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.item}: ${err.error}`);
      });
    }

    // แสดงสถิติหมวดหมู่
    console.log('\n📈 สถิติตามหมวดหมู่:');
    const categoryCounts = await prisma.consumableMaterial.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    categoryCounts.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category} รายการ`);
    });

    console.log('\n🎉 การนำเข้าข้อมูลเสร็จสิ้น!');

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดร้ายแรง:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ฟังก์ชันสำหรับตรวจสอบข้อมูลก่อนนำเข้า
async function previewImport() {
  try {
    console.log('👀 ตัวอย่างข้อมูลที่จะนำเข้า:\n');

    const jsonPath = path.join(__dirname, '..', 'it_stock.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const stockItems = JSON.parse(jsonData);

    // แสดงตัวอย่าง 5 รายการแรก
    console.log('📋 ตัวอย่าง 5 รายการแรก:');
    console.log('-'.repeat(80));
    
    for (let i = 0; i < Math.min(5, stockItems.length); i++) {
      const item = stockItems[i];
      console.log(`${i + 1}. ชื่อ: ${item.item_name}`);
      console.log(`   หมวดหมู่: ${item.Category}`);
      console.log(`   หน่วย: ${item.unit}`);
      console.log(`   จำนวน: ${item.quantity} (ขั้นต่ำ: ${item.min_quantity})`);
      console.log(`   รูปภาพ: ${item.image_url ? 'มี' : 'ไม่มี'}`);
      console.log('-'.repeat(40));
    }

    // แสดงสถิติหมวดหมู่
    const categoryStats = {};
    stockItems.forEach(item => {
      categoryStats[item.Category] = (categoryStats[item.Category] || 0) + 1;
    });

    console.log('\n📊 สถิติหมวดหมู่:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} รายการ`);
      });

    console.log(`\n📋 รวมทั้งหมด: ${stockItems.length} รายการ`);
    console.log('\n💡 หากต้องการนำเข้าข้อมูล ให้รันคำสั่ง:');
    console.log('   node scripts/import-it-stock.js --import');

  } catch (error) {
    console.error('❌ ข้อผิดพลาด:', error);
  }
}

// ฟังก์ชันสำหรับลบข้อมูลทั้งหมด (ใช้ระวัง!)
async function clearAllData() {
  try {
    console.log('⚠️  คำเตือน: คุณกำลังจะลบข้อมูลวัสดุสิ้นเปลืองทั้งหมด!');
    
    // ในสคริปต์จริงควรมีการยืนยันจากผู้ใช้
    const count = await prisma.consumableMaterial.count();
    console.log(`📊 พบข้อมูล ${count} รายการ`);
    
    if (count > 0) {
      await prisma.consumableMaterial.deleteMany({});
      console.log('✅ ลบข้อมูลทั้งหมดเรียบร้อย');
    } else {
      console.log('ℹ️  ไม่มีข้อมูลให้ลบ');
    }
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการลบข้อมูล:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// จัดการ command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--preview')) {
    previewImport();
  } else if (args.includes('--clear')) {
    clearAllData();
  } else if (args.includes('--import')) {
    importITStock();
  } else {
    console.log('🎯 IT Stock Import Tool');
    console.log('='.repeat(30));
    console.log('การใช้งาน:');
    console.log('  node scripts/import-it-stock.js --preview   # ดูตัวอย่างข้อมูล');
    console.log('  node scripts/import-it-stock.js --import    # นำเข้าข้อมูล');
    console.log('  node scripts/import-it-stock.js --clear     # ลบข้อมูลทั้งหมด (ระวัง!)');
    console.log('\n💡 แนะนำให้รัน --preview ก่อนเพื่อดูข้อมูล');
  }
}

module.exports = {
  importITStock,
  previewImport,
  clearAllData
};
