// scripts/create-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating default admin user...');

    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }

    // สร้าง hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // สร้าง admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        department: 'Information Technology',
        isActive: true,
      },
    });

    console.log('Default admin user created successfully:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: ADMIN');
    console.log('Department: Information Technology');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
