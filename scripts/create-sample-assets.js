// scripts/create-sample-assets.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleAssets() {
  try {
    console.log('🏗️ Creating sample assets...');

    const sampleAssets = [
      {
        assetNumber: 'LAPTOP-001',
        name: 'แล็ปท็อป Dell Inspiron',
        category: 'คอมพิวเตอร์',
        brand: 'Dell',
        model: 'Inspiron 15 3000',
        serialNumber: 'DL001234567',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 25000.00,
        location: 'ห้อง IT-101',
        condition: 'GOOD',
        description: 'แล็ปท็อปสำหรับการเรียนการสอน'
      },
      {
        assetNumber: 'PROJ-001',
        name: 'โปรเจคเตอร์ Epson',
        category: 'อุปกรณ์นำเสนอ',
        brand: 'Epson',
        model: 'EB-S05',
        serialNumber: 'EP001234567',
        purchaseDate: new Date('2024-02-20'),
        purchasePrice: 15000.00,
        location: 'ห้อง IT-102',
        condition: 'GOOD',
        description: 'โปรเจคเตอร์สำหรับการนำเสนอ'
      },
      {
        assetNumber: 'CAM-001',
        name: 'กล้อง DSLR Canon',
        category: 'อุปกรณ์ถ่ายภาพ',
        brand: 'Canon',
        model: 'EOS 700D',
        serialNumber: 'CN001234567',
        purchaseDate: new Date('2023-11-10'),
        purchasePrice: 35000.00,
        location: 'ห้องเก็บอุปกรณ์',
        condition: 'GOOD',
        description: 'กล้อง DSLR สำหรับงานส่งเสริมภาพลักษณ์'
      },
      {
        assetNumber: 'TAB-001',
        name: 'แท็บเล็ต iPad',
        category: 'คอมพิวเตอร์',
        brand: 'Apple',
        model: 'iPad 10th Gen',
        serialNumber: 'AP001234567',
        purchaseDate: new Date('2024-03-05'),
        purchasePrice: 18000.00,
        location: 'ห้อง IT-103',
        condition: 'GOOD',
        description: 'แท็บเล็ตสำหรับการนำเสนอและเรียนการสอน'
      },
      {
        assetNumber: 'PRINTER-001',
        name: 'เครื่องพิมพ์เลเซอร์ HP',
        category: 'อุปกรณ์สำนักงาน',
        brand: 'HP',
        model: 'LaserJet Pro M404n',
        serialNumber: 'HP001234567',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 8500.00,
        location: 'ห้องพิมพ์',
        condition: 'GOOD',
        description: 'เครื่องพิมพ์เลเซอร์สำหรับงานเอกสาร'
      }
    ];

    for (const asset of sampleAssets) {
      await prisma.fixedAsset.create({
        data: asset
      });
      console.log(`✅ Created asset: ${asset.assetNumber} - ${asset.name}`);
    }

    console.log('🎉 Sample assets created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample assets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleAssets();
