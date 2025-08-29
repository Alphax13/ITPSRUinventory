// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

// ตั้งค่า Cloudinary (เรียกใช้เมื่อต้องการเท่านั้น)
export function configureCloudinary() {
  if (isConfigured) return;
  
  try {
    // วิธีที่ 1: ใช้ CLOUDINARY_URL (แนะนำสำหรับ Vercel)
    if (process.env.CLOUDINARY_URL) {
      // Cloudinary SDK จะใช้ CLOUDINARY_URL อัตโนมัติ
      cloudinary.config();
      isConfigured = true;
      return;
    }
    
    // วิธีที่ 2: ใช้ตัวแปรแยกกัน (สำหรับ development)
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      isConfigured = true;
      return;
    }
    
    // ไม่มี environment variables
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
      console.warn('Cloudinary environment variables not found. Please set either CLOUDINARY_URL or individual CLOUDINARY_* variables.');
    }
    
  } catch (error) {
    console.error('Failed to configure Cloudinary:', error);
  }
}

// ฟังก์ชันสำหรับลบไฟล์จาก Cloudinary
export async function deleteCloudinaryFile(publicId: string): Promise<boolean> {
  try {
    configureCloudinary();
    
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      });
    });
    
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
}

// ฟังก์ชันสำหรับสร้าง URL ที่ optimize แล้ว
export function getOptimizedImageUrl(publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
} = {}) {
  configureCloudinary();
  
  const { width, height, quality = 'auto:good', format = 'auto' } = options;
  
  const url = cloudinary.url(publicId, {
    quality,
    fetch_format: format,
    ...(width && { width }),
    ...(height && { height }),
  });
  
  return url;
}

// ฟังก์ชันสำหรับสร้าง thumbnail
export function getThumbnailUrl(publicId: string, size: number = 150) {
  configureCloudinary();
  
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:good',
  });
}

// ฟังก์ชันสำหรับตรวจสอบว่าไฟล์มีอยู่ใน Cloudinary หรือไม่
export async function checkFileExists(publicId: string): Promise<boolean> {
  try {
    configureCloudinary();
    
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      });
    });
    
    return !!result;
  } catch {
    return false;
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลไฟล์
export async function getFileInfo(publicId: string) {
  try {
    configureCloudinary();
    
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      });
    });
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

// ฟังก์ชันสำหรับสร้าง signed upload URL (สำหรับ client-side upload)
export function createSignedUploadUrl(folder: string, publicId: string) {
  configureCloudinary();
  
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      public_id: publicId,
    },
    process.env.CLOUDINARY_API_SECRET!
  );
  
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
