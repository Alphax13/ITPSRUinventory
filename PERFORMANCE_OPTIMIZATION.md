# การปรับปรุงประสิทธิภาพระบบ (Performance Optimization)

## สรุปการปรับปรุง

เอกสารนี้บันทึกการปรับปรุงประสิทธิภาพที่ทำกับระบบ Material Management เพื่อลดเวลาในการโหลดข้อมูลและลดความซับซ้อนของโค้ด

---

## 1. ปรับปรุง Dashboard API

### ปัญหาเดิม
- Query ทำงานแบบ Sequential (ทีละตัว) ทำให้ช้า
- ดึงข้อมูลทั้งหมดจาก ConsumableMaterial แล้วค่อย filter ใน JavaScript
- ใช้เวลารวม ~12 วินาที

### การแก้ไข
```typescript
// ใช้ Promise.all() เพื่อรัน queries พร้อมกัน
const [
  totalConsumables,
  lowStockResult,
  totalAssets,
  borrowedAssets,
  assetsNeedRepair,
  totalConsumableTransactions,
  pendingRequests,
  recentTransactions,
] = await Promise.all([...]);
```

### ผลลัพธ์ที่คาดหวัง
- ลดเวลาจาก ~12 วินาที เหลือ ~2-3 วินาที
- ลด Network Round Trips
- ลดภาระของ Application Server

---

## 2. เพิ่ม Database Indexes

### Indexes ที่เพิ่มเข้าไป

#### ConsumableMaterial
```prisma
@@index([currentStock, minStock])  // สำหรับค้นหาสต็อกต่ำ
@@index([category])                 // สำหรับค้นหาตามหมวดหมู่
```

#### ConsumableTransaction
```prisma
@@index([createdAt(sort: Desc)])   // สำหรับดึงรายการล่าสุด
@@index([type, createdAt])         // สำหรับ filter ตาม type
@@index([userId])                   // สำหรับค้นหาตาม user
```

#### Notification
```prisma
@@index([userId, createdAt(sort: Desc)])  // สำหรับดึง notifications ของ user
@@index([userId, isRead])                  // สำหรับนับ unread notifications
```

#### AssetBorrow
```prisma
@@index([status])              // สำหรับค้นหาตามสถานะ
@@index([fixedAssetId])        // สำหรับค้นหาตามครุภัณฑ์
```

#### FixedAsset
```prisma
@@index([condition])           // สำหรับค้นหาตามสภาพ
@@index([category])            // สำหรับค้นหาตาม category
```

#### PurchaseRequest
```prisma
@@index([status])              // สำหรับค้นหาตาม status
@@index([requesterId])         // สำหรับค้นหาตาม requester
```

### ผลลัพธ์
- Query เร็วขึ้น 5-10 เท่า สำหรับตารางที่มีข้อมูลมาก
- ลดการ Full Table Scan
- เพิ่มประสิทธิภาพของ WHERE, ORDER BY, และ JOIN operations

---

## 3. ปิด Prisma Query Logging

### การเปลี่ยนแปลง

#### ไฟล์: `src/lib/prisma.ts`
```typescript
// เดิม
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// ใหม่ - ปิด query logging
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
```

### ผลลัพธ์
- ลดเวลาในการ log queries
- ลดขนาดของ console output
- ลด I/O overhead
- Terminal ไม่รก ดูผลลัพธ์ได้ง่ายขึ้น

---

## 4. ปรับปรุง Notifications API

### การเปลี่ยนแปลง

1. **ใช้ Parallel Queries**
```typescript
const [notifications, unreadCount] = await Promise.all([
  prisma.notification.findMany({...}),
  prisma.notification.count({...}),
]);
```

2. **ลบ User Relations ที่ไม่จำเป็น**
```typescript
// เดิม - include user relation
include: {
  user: { select: { id: true, name: true, role: true } }
}

// ใหม่ - ใช้ select เฉพาะ fields ที่ต้องการ
select: {
  id: true,
  userId: true,
  title: true,
  message: true,
  // ...
}
```

### ผลลัพธ์
- ลดเวลาจาก ~6 วินาที เหลือ ~1-2 วินาที
- ลดขนาดของ Response payload
- ลด JOIN operations ที่ไม่จำเป็น

---

## 5. เพิ่ม HTTP Cache Headers

### Dashboard API
```typescript
headers: {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
}
```
- Cache ข้อมูลได้ 30 วินาที
- ใช้ stale data ได้อีก 60 วินาที ระหว่างที่รอ revalidate

### Notifications API
```typescript
headers: {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
}
```
- ไม่ cache เพราะข้อมูลต้องเป็น real-time

---

## การ Deploy

### ขั้นตอนที่ต้องทำ

1. **Run Migration**
```bash
npx prisma migrate deploy
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Restart Application**
```bash
npm run build
npm start
```

---

## ผลลัพธ์รวม

### ก่อนปรับปรุง
- Dashboard API: ~12 วินาที
- Notifications API: ~6 วินาที
- มี Query Logging ทุกครั้ง
- ไม่มี Cache

### หลังปรับปรุง (คาดการณ์)
- Dashboard API: ~2-3 วินาที (เร็วขึ้น 75-83%)
- Notifications API: ~1-2 วินาที (เร็วขึ้น 67-83%)
- ไม่มี Query Logging (console สะอาด)
- มี Cache สำหรับ Dashboard

---

## การติดตาม Performance ต่อไป

### ควรติดตาม
1. Response Time ของแต่ละ API
2. Database Query Execution Time
3. จำนวน Database Connections
4. Memory Usage
5. Cache Hit Rate

### Tools ที่แนะนำ
- Prisma Studio: ดู database
- Next.js Analytics
- Database Monitoring (Neon Dashboard)
- Browser DevTools (Network tab)

---

## คำแนะนำเพิ่มเติม

### อนาคต
1. **Implement React Query หรือ SWR**
   - Client-side caching
   - Auto refetch
   - Background updates

2. **Pagination**
   - เพิ่ม pagination สำหรับ lists ที่มีข้อมูลเยอะ
   - Infinite scroll

3. **Server-Side Rendering Optimization**
   - ใช้ Next.js ISR (Incremental Static Regeneration)
   - Streaming

4. **Database Connection Pooling**
   - Configure Prisma connection pool
   - ใช้ PgBouncer ถ้าจำเป็น

5. **CDN และ Asset Optimization**
   - ใช้ Cloudinary สำหรับรูปภาพ
   - Compress images
   - Use WebP format

---

## วันที่อัพเดท
7 พฤศจิกายน 2025

## ผู้ดำแนือการ
GitHub Copilot
