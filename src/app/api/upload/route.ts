// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const materialCode = data.get('materialCode') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'materials');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // สร้างชื่อไฟล์ใหม่
    const fileExtension = file.name.split('.').pop();
    const fileName = `${materialCode}_${Date.now()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // อ่านไฟล์และบันทึก
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // ส่งกลับ URL ของไฟล์
    const fileUrl = `/uploads/materials/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: fileName 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
