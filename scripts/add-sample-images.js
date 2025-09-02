// scripts/add-sample-images.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleImages() {
  try {
    console.log('🖼️ Adding sample images to assets...');

    // ตัวอย่าง URL รูปภาพจาก Unsplash
    const imageUpdates = [
      {
        assetNumber: 'LAPTOP-001',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&crop=center'
      },
      {
        assetNumber: 'PROJ-001',
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center'
      },
      {
        assetNumber: 'CAM-001',
        imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&crop=center'
      },
      {
        assetNumber: 'TAB-001',
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop&crop=center'
      },
      {
        assetNumber: 'PRINTER-001',
        imageUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=300&fit=crop&crop=center'
      }
    ];

    for (const update of imageUpdates) {
      await prisma.fixedAsset.update({
        where: { assetNumber: update.assetNumber },
        data: { imageUrl: update.imageUrl }
      });
      console.log(`✅ Updated image for: ${update.assetNumber}`);
    }

    console.log('🎉 Sample images added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleImages();
