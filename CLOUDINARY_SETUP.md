# Cloudinary Setup Guide

## การตั้งค่า Cloudinary สำหรับ Vercel Deployment

### 1. สร้าง Cloudinary Account
1. ไปที่ [Cloudinary Console](https://cloudinary.com/console)
2. สร้าง account ใหม่ (ฟรี tier มี 25 credits/month)
3. หลังจากสร้าง account แล้ว ให้ไปที่ Dashboard

### 2. หา Credentials
ใน Dashboard คุณจะเห็น:
- **Cloud Name**: ชื่อ cloud ของคุณ
- **API Key**: key สำหรับการเรียกใช้ API
- **API Secret**: secret key สำหรับการยืนยันตัวตน

### 3. ตั้งค่า Environment Variables ใน Vercel

#### วิธีที่ 1: ผ่าน Vercel Dashboard (แนะนำ)
1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจคของคุณ
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่ม variable นี้:

```
CLOUDINARY_URL = cloudinary://your_api_key:your_api_secret@your_cloud_name
```

**หรือ** ใช้ตัวแปรแยกกัน:
```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

#### วิธีที่ 2: ผ่าน Vercel CLI
```bash
# แนะนำ: ใช้ CLOUDINARY_URL
vercel env add CLOUDINARY_URL

# หรือใช้ตัวแปรแยกกัน
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

### 4. ตั้งค่า Local Development
สร้างไฟล์ `.env.local` ในโปรเจค:

```env
# แนะนำ: ใช้ CLOUDINARY_URL
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

# หรือใช้ตัวแปรแยกกัน
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

### 5. การใช้งาน API

#### Endpoint
```
POST /api/upload
```

#### Request Body (FormData)
- `file`: ไฟล์ที่ต้องการอัปโหลด
- `materialCode`: รหัสวัสดุ (optional, default: 'CON')
- `folder`: โฟลเดอร์ใน Cloudinary (optional, default: 'it-stock/uploads/materials')

#### Response
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "CON_1234567890_abc123",
  "format": "jpg",
  "size": 1024000,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "width": 1920,
  "height": 1080
}
```

### 6. ไฟล์ที่รองรับ
- **รูปภาพ**: JPEG, JPG, PNG, GIF, WebP
- **เอกสาร**: PDF, Word, Excel
- **ขนาดไฟล์**: สูงสุด 10MB

### 7. การจัดการไฟล์ใน Cloudinary
- ไฟล์จะถูกจัดเก็บในโฟลเดอร์ที่กำหนด
- รูปภาพจะถูก optimize อัตโนมัติ
- สามารถเข้าถึงไฟล์ผ่าน URL ที่ได้จาก response

### 8. การลบไฟล์ (ถ้าต้องการ)
```typescript
// ตัวอย่างการลบไฟล์
import { v2 as cloudinary } from 'cloudinary';

cloudinary.uploader.destroy('public_id_here', (error, result) => {
  if (error) console.error('Delete error:', error);
  else console.log('Delete result:', result);
});
```

### 9. การตั้งค่า CORS
API endpoint รองรับ CORS และมี OPTIONS method สำหรับ preflight requests

### 10. การ Monitor และ Analytics
- ไปที่ Cloudinary Dashboard เพื่อดูการใช้งาน
- ตรวจสอบ bandwidth และ storage usage
- ดู logs ของการอัปโหลด

### หมายเหตุ
- ฟรี tier ของ Cloudinary มีข้อจำกัด 25 credits/month
- 1 credit = 1GB bandwidth หรือ 1GB storage
- สำหรับ production ควรพิจารณา upgrade เป็น paid plan
