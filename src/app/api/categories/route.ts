// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = [
  { name: 'เครื่องเขียน', description: 'ปากกา ดินสอ ยางลบ' },
  { name: 'กระดาษ', description: 'กระดาษ A4 กระดาษถ่าย' },
  { name: 'อุปกรณ์ IT', description: 'คีย์บอร์ด เมาส์ สายแลน' },
  { name: 'ครุภัณฑ์', description: 'จอ เครื่องพิมพ์ เฟอร์นิเจอร์' },
  { name: 'อุปกรณ์ทำความสะอาด', description: 'น้ำยาทำความสะอาด ผ้า' },
  { name: 'วัสดุสำนักงาน', description: 'แฟ้ม กล่อง ซองเอกสาร' },
];

// GET: รายการหมวดหมู่ทั้งหมด
export async function GET() {
  try {
    // ส่งกลับ categories แบบ static สำหรับ demo
    return NextResponse.json(DEFAULT_CATEGORIES, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
