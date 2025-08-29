// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCloudinary } from '@/lib/cloudinary';
import { UploadApiResponse, UploadApiOptions } from 'cloudinary';

export const runtime = 'nodejs'; // สำคัญ: ใช้ Node runtime (ไม่ใช่ Edge)

// ตรวจสอบประเภทไฟล์ที่อนุญาต
function isAllowedFileType(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return allowedTypes.includes(file.type);
}

// กำหนด resource type สำหรับ Cloudinary
function getResourceType(fileType: string): 'image' | 'raw' | 'auto' | 'video' {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'raw';
  if (fileType.includes('word') || fileType.includes('excel')) return 'raw';
  return 'auto';
}

export async function POST(request: NextRequest) {
  try {
    // ตั้งค่า Cloudinary
    const cloudinary = await getCloudinary();

    const data = await request.formData();
    const file = data.get('file') as unknown as File | null;
    const materialCode = (data.get('materialCode') as string | null) ?? 'CON';
    const folder = (data.get('folder') as string | null) ?? 'it-stock/uploads/materials';

    if (!file) {
      return NextResponse.json({ 
        error: 'No file uploaded',
        success: false 
      }, { status: 400 });
    }

    // ตรวจสอบขนาดไฟล์ (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB',
        success: false 
      }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    if (!isAllowedFileType(file)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Allowed types: images, PDF, Word, Excel',
        success: false 
      }, { status: 400 });
    }

    // แปลงไฟล์เป็น Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // สร้าง public ID ที่ไม่ซ้ำกัน
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const publicId = `${materialCode}_${timestamp}_${randomId}`;

    // กำหนด resource type
    const resourceType = getResourceType(file.type);

    // อัปโหลดขึ้น Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        use_filename: false,
        unique_filename: false,
      };

      // เพิ่ม options สำหรับรูปภาพ
      if (resourceType === 'image') {
        uploadOptions.transformation = [
          { quality: 'auto:good' }, // ปรับคุณภาพอัตโนมัติ
          { fetch_format: 'auto' }  // เลือก format ที่เหมาะสม
        ];
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Upload failed - no result returned'));
          }
          resolve(result);
        }
      );
      
      stream.end(buffer);
    });

    // ส่งข้อมูลกลับ
    const response: {
      success: boolean;
      url: string;
      publicId: string;
      format: string;
      size: number;
      createdAt: string;
      width?: number;
      height?: number;
    } = {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes,
      createdAt: uploadResult.created_at,
    };

    // เพิ่มข้อมูลเฉพาะสำหรับรูปภาพ
    if (uploadResult.width && uploadResult.height) {
      response.width = uploadResult.width;
      response.height = uploadResult.height;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload API error:', error);
    
    // ส่ง error message ที่เหมาะสม
    let errorMessage = 'Upload failed';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Cloudinary env missing')) {
        errorMessage = 'Server configuration error';
        statusCode = 500;
      } else if (error.message.includes('File')) {
        errorMessage = error.message;
        statusCode = 400;
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      success: false 
    }, { status: statusCode });
  }
}

// เพิ่ม OPTIONS method สำหรับ CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
