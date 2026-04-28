// src/app/dashboard/fixed-assets/AssetFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AssetFormModalProps {
  onClose: () => void;
  onSave: () => void;
}

interface AssetFormData {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  location: string;
  condition: string;
  imageUrl?: string;
  description?: string;
}

interface AssetFormModalProps {
  onClose: () => void;
  onSave: () => void;
  editingAsset?: AssetFormData;
}

export default function AssetFormModal({ onClose, onSave, editingAsset }: AssetFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');

  const [formData, setFormData] = useState({
    id: '',
    assetNumber: '',
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    location: 'Unassigned',
    condition: 'GOOD',
    imageUrl: '',
    description: '',
  });

  useEffect(() => {
    if (editingAsset) {
      setFormData({
        id: editingAsset.id,
        assetNumber: editingAsset.assetNumber,
        name: editingAsset.name,
        category: editingAsset.category,
        brand: editingAsset.brand || '',
        model: editingAsset.model || '',
        serialNumber: editingAsset.serialNumber || '',
        purchaseDate: editingAsset.purchaseDate ? new Date(editingAsset.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: editingAsset.purchasePrice ? editingAsset.purchasePrice.toString() : '',
        location: editingAsset.location || 'Unassigned',
        condition: editingAsset.condition || 'GOOD',
        imageUrl: editingAsset.imageUrl ?? '',
        description: editingAsset.description ?? '',
      });
      setImagePreview(editingAsset.imageUrl ?? '');
    } else {
      // Generate new asset number
      const newAssetNumber = `AST-${Date.now().toString().slice(-6)}`;
      setFormData({
        id: '',
        assetNumber: newAssetNumber,
        name: '',
        category: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        location: 'Unassigned',
        condition: 'GOOD',
        imageUrl: '',
        description: '',
      });
      setImagePreview('');
    }
    setSelectedFile(null);
  }, [editingAsset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // ถ้าเป็นการเปลี่ยน imageUrl ให้อัพเดต preview ด้วย
    if (name === 'imageUrl' && value) {
      setImagePreview(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
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
    setError('');
    
    try {
      // Validation
      if (!formData.assetNumber.trim()) {
        setError('กรุณากรอกเลขครุภัณฑ์');
        setLoading(false);
        return;
      }
      if (!formData.name.trim()) {
        setError('กรุณากรอกชื่อครุภัณฑ์');
        setLoading(false);
        return;
      }
      if (!formData.category.trim()) {
        setError('กรุณากรอกหมวดหมู่');
        setLoading(false);
        return;
      }

  const assetData: AssetFormData = { ...formData };
      
      // จัดการรูปภาพ
      if (imageInputType === 'file' && selectedFile) {
        // อัปโหลดไฟล์รูปภาพ
        const formDataImage = new FormData();
        formDataImage.append('file', selectedFile);
        formDataImage.append('materialCode', formData.assetNumber);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataImage,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          assetData.imageUrl = uploadResult.url;
        } else {
          setError('ไม่สามารถอัปโหลดรูปภาพได้');
          setLoading(false);
          return;
        }
      } else if (imageInputType === 'url' && formData.imageUrl) {
        // ใช้ URL ที่ใส่มา
        assetData.imageUrl = formData.imageUrl;
      }

      const method = editingAsset ? 'PUT' : 'POST';
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
      });

      if (response.ok) {
        onSave();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.error || 'เกิดข้อผิดพลาดในการบันทึก');
          console.error('API Error:', errorData);
        } else {
          const errorText = await response.text();
          setError(`เกิดข้อผิดพลาด (${response.status}): ${errorText}`);
          console.error('API Error (non-JSON):', errorText);
        }
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800">
            {editingAsset ? 'แก้ไขครุภัณฑ์' : 'เพิ่มครุภัณฑ์ใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* รูปภาพ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปภาพครุภัณฑ์</label>
            
            {/* ตัวเลือกประเภทการใส่รูป */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleImageTypeChange('file')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  imageInputType === 'file'
                    ? 'bg-orange-50 text-orange-700 border border-orange-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                อัพโหลดไฟล์
              </button>
              <button
                type="button"
                onClick={() => handleImageTypeChange('url')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  imageInputType === 'url'
                    ? 'bg-orange-50 text-orange-700 border border-orange-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                URL
              </button>
            </div>

            {/* แสดงพรีวิวรูปภาพ */}
            {imagePreview && (
              <div className="mb-3 relative">
                <div className="relative overflow-hidden rounded-xl border border-slate-200">
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
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-600 rounded-full w-7 h-7 flex items-center justify-center shadow"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Input ตามประเภทที่เลือก */}
            {imageInputType === 'file' ? (
              <input
                key="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            ) : (
              <input
                key="url-input"
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            )}
            <p className="text-xs text-slate-400 mt-1.5">
              {imageInputType === 'file'
                ? 'เลือกไฟล์รูปภาพจากเครื่องคอมพิวเตอร์'
                : 'ใส่ลิงค์รูปภาพจากอินเทอร์เน็ต (เช่น Google Drive, Imgur)'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* เลขกำกับ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">เลขกำกับครุภัณฑ์</label>
              <input 
                type="text" 
                name="assetNumber" 
                value={formData.assetNumber} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400" 
                placeholder="AST-123456"
                required
                readOnly={!!editingAsset}
              />
            </div>

            {/* ชื่อครุภัณฑ์ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อครุภัณฑ์</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="เช่น เครื่องคอมพิวเตอร์"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* หมวดหมู่ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">หมวดหมู่</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                <option value="คอมพิวเตอร์">คอมพิวเตอร์</option>
                <option value="เครื่องใช้ไฟฟ้า">เครื่องใช้ไฟฟ้า</option>
                <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
                <option value="เครื่องมือ">เครื่องมือ</option>
                <option value="ยานพาหนะ">ยานพาหนะ</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            {/* ยี่ห้อ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ยี่ห้อ</label>
              <input 
                type="text" 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="เช่น Dell, HP, Canon"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* รุ่น */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">รุ่น</label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="เช่น OptiPlex 3070"
              />
            </div>

            {/* เลขซีเรียล */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">เลขซีเรียล</label>
              <input 
                type="text" 
                name="serialNumber" 
                value={formData.serialNumber} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="เลขซีเรียลของครุภัณฑ์"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* วันที่ซื้อ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">วันที่ซื้อ</label>
              <input 
                type="date" 
                name="purchaseDate" 
                value={formData.purchaseDate} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
              />
            </div>

            {/* ราคาซื้อ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ราคาซื้อ (บาท)</label>
              <input 
                type="number" 
                name="purchasePrice" 
                value={formData.purchasePrice} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* สภาพ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">สภาพครุภัณฑ์</label>
              <select 
                name="condition" 
                value={formData.condition} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                required
              >
                <option value="GOOD">ดี</option>
                <option value="NEEDS_REPAIR">ต้องซ่อม</option>
                <option value="DAMAGED">เสียหาย</option>
                <option value="DISPOSED">จำหน่าย</option>
              </select>
            </div>
          </div>

          {/* ตำแหน่งจัดเก็บ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ตำแหน่งจัดเก็บ</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
              placeholder="เช่น ห้อง 201 อาคาร A"
              required
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
              placeholder="รายละเอียดเพิ่มเติม เช่น สี ขนาด คุณสมบัติ"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </div>
              ) : (
                editingAsset ? 'บันทึกการแก้ไข' : 'เพิ่มครุภัณฑ์ใหม่'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
