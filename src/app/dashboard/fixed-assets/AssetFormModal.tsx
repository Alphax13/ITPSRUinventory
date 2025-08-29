// src/app/dashboard/fixed-assets/AssetFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-orange-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingAsset ? '✏️ แก้ไขครุภัณฑ์' : '➕ เพิ่มครุภัณฑ์ใหม่'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* รูปภาพ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📸 รูปภาพครุภัณฑ์</label>
            
            {/* ตัวเลือกประเภทการใส่รูป */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => handleImageTypeChange('file')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  imageInputType === 'file'
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
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
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔗 ใส่ URL
              </button>
            </div>

            {/* แสดงพรีวิวรูปภาพ */}
            {imagePreview && (
              <div className="mb-4 relative">
                <div className="relative overflow-hidden rounded-xl border border-orange-200">
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
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {imageInputType === 'url' ? '🔗 URL รูปภาพ' : '📁 ไฟล์ที่อัพโหลด'}
                </p>
              </div>
            )}
            
            {/* Input ตามประเภทที่เลือก */}
            {imageInputType === 'file' ? (
              <input
                key="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            ) : (
              <input
                key="url-input"
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="https://example.com/image.jpg"
              />
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              {imageInputType === 'file' 
                ? '📁 เลือกไฟล์รูปภาพจากเครื่องคอมพิวเตอร์'
                : '🔗 ใส่ลิงค์รูปภาพจากอินเทอร์เน็ต (เช่น Google Drive, Imgur, หรือเว็บไซต์อื่นๆ)'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* เลขกำกับ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ เลขกำกับครุภัณฑ์</label>
              <input 
                type="text" 
                name="assetNumber" 
                value={formData.assetNumber} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50" 
                placeholder="AST-123456"
                required
                readOnly={!!editingAsset}
              />
            </div>

            {/* ชื่อครุภัณฑ์ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📝 ชื่อครุภัณฑ์</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
                placeholder="เช่น เครื่องคอมพิวเตอร์"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* หมวดหมู่ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ หมวดหมู่</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏭 ยี่ห้อ</label>
              <input 
                type="text" 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
                placeholder="เช่น Dell, HP, Canon"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* รุ่น */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔧 รุ่น</label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
                placeholder="เช่น OptiPlex 3070"
              />
            </div>

            {/* เลขซีเรียล */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔢 เลขซีเรียล</label>
              <input 
                type="text" 
                name="serialNumber" 
                value={formData.serialNumber} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
                placeholder="เลขซีเรียลของครุภัณฑ์"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* วันที่ซื้อ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 วันที่ซื้อ</label>
              <input 
                type="date" 
                name="purchaseDate" 
                value={formData.purchaseDate} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
              />
            </div>

            {/* ราคาซื้อ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 ราคาซื้อ (บาท)</label>
              <input 
                type="number" 
                name="purchasePrice" 
                value={formData.purchasePrice} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* สภาพ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ สภาพครุภัณฑ์</label>
              <select 
                name="condition" 
                value={formData.condition} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 ตำแหน่งจัดเก็บ</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
              placeholder="เช่น ห้อง 201 อาคาร A"
              required
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📄 รายละเอียดเพิ่มเติม</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" 
              placeholder="รายละเอียดเพิ่มเติม เช่น สี ขนาด คุณสมบัติ"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-orange-300 disabled:to-orange-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </div>
              ) : (
                editingAsset ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มครุภัณฑ์ใหม่'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
