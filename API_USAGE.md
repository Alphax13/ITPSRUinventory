# Upload API Usage Guide

## การใช้งาน Upload API สำหรับ Cloudinary

### API Endpoint
```
POST /api/upload
```

### การใช้งานใน Frontend

#### 1. การอัปโหลดไฟล์แบบพื้นฐาน

```typescript
// React component example
import { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('materialCode', 'MAT001');
      formData.append('folder', 'it-stock/uploads/materials');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        console.log('Upload successful:', data.url);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {result && (
        <div>
          <p>Upload successful!</p>
          <p>URL: {result.url}</p>
          <p>Public ID: {result.publicId}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
```

#### 2. การอัปโหลดหลายไฟล์

```typescript
const MultipleFileUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadResults = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('materialCode', 'MAT001');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          uploadResults.push(data);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    setResults(uploadResults);
    setUploading(false);
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={handleFilesChange} 
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
      />
      <button onClick={uploadFiles} disabled={files.length === 0 || uploading}>
        {uploading ? 'Uploading...' : `Upload ${files.length} files`}
      </button>
      
      {results.length > 0 && (
        <div>
          <h3>Upload Results:</h3>
          {results.map((result, index) => (
            <div key={index}>
              <p>File {index + 1}: {result.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 3. การอัปโหลดพร้อม Progress Bar

```typescript
const UploadWithProgress = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('materialCode', 'MAT001');

      // Simulate progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();
      if (data.success) {
        console.log('Upload successful:', data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {uploading && (
        <div>
          <div style={{ width: '100%', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '20px', 
                backgroundColor: '#4CAF50', 
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <p>{progress}%</p>
        </div>
      )}
    </div>
  );
};
```

#### 4. การจัดการ Error และ Validation

```typescript
const UploadWithValidation = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // ตรวจสอบขนาดไฟล์ (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    // ตรวจสอบประเภทไฟล์
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

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('materialCode', 'MAT001');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Upload successful:', data.url);
        // Reset form
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
      
      {file && (
        <div style={{ margin: '10px 0' }}>
          <p>Selected file: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p>Type: {file.type}</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        style={{ 
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};
```

### การใช้งานใน Backend (Server-side)

#### 1. การลบไฟล์จาก Cloudinary

```typescript
import { deleteCloudinaryFile } from '@/lib/cloudinary';

// ใน API route
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json();
    
    const success = await deleteCloudinaryFile(publicId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'File deleted' });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to delete file' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
```

#### 2. การดึงข้อมูลไฟล์

```typescript
import { getFileInfo } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 });
    }
    
    const fileInfo = await getFileInfo(publicId);
    
    if (fileInfo) {
      return NextResponse.json(fileInfo);
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### การตั้งค่า CORS

API endpoint รองรับ CORS และมี OPTIONS method สำหรับ preflight requests:

```typescript
// OPTIONS method สำหรับ CORS
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
```

### การจัดการ Environment Variables

ต้องตั้งค่า environment variables ต่อไปนี้:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### หมายเหตุสำคัญ

1. **File Size Limit**: ไฟล์ขนาดสูงสุด 10MB
2. **Supported Formats**: รูปภาพ (JPEG, PNG, GIF, WebP), PDF, Word, Excel
3. **Security**: ใช้ server-side upload เพื่อความปลอดภัย
4. **Error Handling**: มีการจัดการ error ที่ครอบคลุม
5. **CORS**: รองรับ cross-origin requests
6. **Progress Tracking**: สามารถเพิ่ม progress bar ได้
7. **File Validation**: มีการตรวจสอบไฟล์ก่อนอัปโหลด
