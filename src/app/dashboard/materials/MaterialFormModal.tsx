// src/app/dashboard/materials/MaterialFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import { useMaterialStore } from '@/stores/materialStore';
import { generateMaterialQRCode } from '@/utils/qrcode';

interface MaterialFormData {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  isAsset: boolean;
  imageUrl: string;
}

export default function MaterialFormModal({ onSave }: { onSave: () => void }) {
  const { isModalOpen, editingMaterial, closeModal } = useMaterialStore();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<MaterialFormData>({
    id: '',
    name: '',
    code: '',
    category: '',
    unit: '',
    minStock: 0,
    currentStock: 0,
    isAsset: false,
    imageUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        id: editingMaterial.id,
        name: editingMaterial.name,
        code: editingMaterial.code,
        category: editingMaterial.category,
        unit: editingMaterial.unit,
        minStock: editingMaterial.minStock,
        currentStock: editingMaterial.currentStock ?? 0,
        isAsset: editingMaterial.isAsset,
        imageUrl: editingMaterial.imageUrl ?? '',
      });
      setImagePreview(editingMaterial.imageUrl ?? '');
    } else {
      setFormData({
        id: '',
        name: '',
        code: '',
        category: '',
        unit: '',
        minStock: 0,
        currentStock: 0,
        isAsset: false,
        imageUrl: '',
      });
      setImagePreview('');
    }
    setSelectedFile(null);
  }, [editingMaterial]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // ถ้าเป็นการเปลี่ยน imageUrl ให้อัพเดต preview ด้วย
    if (name === 'imageUrl' && value) {
      setImagePreview(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // สร้าง preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        e.target.value = '';
      }
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleImageTypeChange = (type: 'file' | 'url') => {
    setImageInputType(type);
    setSelectedFile(null);
    setImagePreview('');
    setError(''); // ล้าง error เมื่อเปลี่ยนประเภท
    
    if (type === 'file') {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const method = editingMaterial ? 'PUT' : 'POST';
    const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : '/api/materials';

    try {
      const materialData: MaterialFormData = { ...formData };
      
      // จัดการรูปภาพ
      if (imageInputType === 'file' && selectedFile) {
        // อัปโหลดไฟล์รูปภาพ
        const formDataImage = new FormData();
        formDataImage.append('file', selectedFile);
        formDataImage.append('materialCode', formData.code);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataImage,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          materialData.imageUrl = uploadResult.url;
        } else {
          setError('ไม่สามารถอัปโหลดรูปภาพได้');
          setLoading(false);
          return;
        }
      } else if (imageInputType === 'url' && formData.imageUrl) {
        // ใช้ URL ที่ใส่มา
        materialData.imageUrl = formData.imageUrl;
      }

      // Generate QR Code for new materials
      if (!editingMaterial && formData.code) {
        try {
          const qrCode = await generateMaterialQRCode(formData.code);
          const materialDataWithQR = { ...materialData, qrCode };
          
          const res = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(materialDataWithQR),
          });
          
          if (res.ok) {
            closeModal();
            onSave(); // Call the onSave prop to refresh the list
          } else {
            console.error('Failed to save material');
          }
        } catch (error) {
          console.warn('QR Code generation failed, proceeding without it:', error);
          // Proceed without QR code
          const res = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(materialData),
          });
          
          if (res.ok) {
            closeModal();
            onSave(); // Call the onSave prop to refresh the list
          } else {
            console.error('Failed to save material');
          }
        }
      } else {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(materialData),
        });
        
        if (res.ok) {
          closeModal();
          onSave(); // Call the onSave prop to refresh the list
        } else {
          console.error('Failed to save material');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/80 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingMaterial ? 'แก้ไขรายการวัสดุ' : 'เพิ่มรายการวัสดุใหม่'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">ชื่อรายการ</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="เช่น ปากกาลูกลื่น สีน้ำเงิน"
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">รหัสสินค้า</label>
            <input 
              type="text" 
              name="code" 
              value={formData.code} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="เช่น MAT-001"
              required 
            />
          </div>

          {/* รูปภาพของวัสดุ */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">📸 รูปภาพของวัสดุ</label>
            
            {/* ตัวเลือกประเภทการใส่รูป */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => handleImageTypeChange('file')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  imageInputType === 'file'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📁 อัพโหลดไฟล์
              </button>
              <button
                type="button"
                onClick={() => handleImageTypeChange('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  imageInputType === 'url'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔗 ใส่ URL
              </button>
            </div>

            {/* แสดงพรีวิวรูปภาพ */}
            {imagePreview && (
              <div className="mb-4 relative">
                <div className="relative overflow-hidden rounded-lg border border-gray-300">
                  <SafeImage
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={160}
                    className="w-full h-40 object-cover"
                    onError={() => {
                      setImagePreview('');
                      setError('ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบ URL');
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {imageInputType === 'url' ? '🔗 URL รูปภาพ' : '📁 ไฟล์ที่อัพโหลด'}
                </p>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                {error}
              </div>
            )}
            
            {/* Input ตามประเภทที่เลือก */}
            {imageInputType === 'file' ? (
              <input
                key="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            ) : (
              <input
                key="url-input"
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
                />
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {imageInputType === 'file' 
                ? '📁 รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB'
                : '🔗 ใส่ลิงค์รูปภาพจากอินเทอร์เน็ต (เช่น Google Drive, Imgur, หรือเว็บไซต์อื่นๆ)'
              }
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">หมวดหมู่</label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">หน่วยนับ</label>
            <select 
              name="unit" 
              value={formData.unit} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required
            >
              <option value="">เลือกหน่วยนับ</option>
              <option value="ชิ้น">ชิ้น</option>
              <option value="กล่อง">กล่อง</option>
              <option value="แพ็ค">แพ็ค</option>
              <option value="ลัง">ลัง</option>
              <option value="เครื่อง">เครื่อง</option>
              <option value="ตัว">ตัว</option>
              <option value="อัน">อัน</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">จำนวนขั้นต่ำ</label>
            <input 
              type="number" 
              name="minStock" 
              value={formData.minStock} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              min="0"
              required 
            />
            <p className="text-sm text-gray-500 mt-1">จำนวนขั้นต่ำที่จะแจ้งเตือนเมื่อสต็อกเหลือน้อย</p>
          </div>
          
          <div className="mb-6 flex items-start">
            <input 
              type="checkbox" 
              id="isAsset" 
              name="isAsset" 
              checked={formData.isAsset} 
              onChange={handleChange} 
              className="mt-1 mr-2 focus:ring-2 focus:ring-blue-500" 
            />
            <div>
              <label htmlFor="isAsset" className="text-gray-700 font-medium">ครุภัณฑ์/ทรัพย์สิน</label>
              <p className="text-sm text-gray-500">
                เช่น คอมพิวเตอร์ โต๊ะ เก้าอี้ จอคอมพิวเตอร์ (ต้องการการติดตามเป็นรายชิ้น)
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : (editingMaterial ? 'อัพเดท' : 'บันทึก')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
