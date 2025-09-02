// src/app/dashboard/assets/AssetFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';

interface AssetFormModalProps {
  onClose: () => void;
  onSave: () => void;
  editingAsset?: import("./page").Asset;
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
    location: '',
    condition: 'GOOD' as import("./page").Asset['condition'],
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
        purchaseDate: editingAsset.purchaseDate ? editingAsset.purchaseDate.split('T')[0] : '',
        purchasePrice: editingAsset.purchasePrice ? editingAsset.purchasePrice.toString() : '',
        location: editingAsset.location,
        condition: editingAsset.condition,
        imageUrl: editingAsset.imageUrl || '',
        description: editingAsset.description || '',
      });
      setImagePreview(editingAsset.imageUrl || '');
    } else {
      setFormData({
        id: '',
        assetNumber: '',
        name: '',
        category: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        location: '',
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
    // รีเซ็ต file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleImageTypeChange = (type: 'file' | 'url') => {
    setImageInputType(type);
    // ล้างข้อมูลเก่าเมื่อเปลี่ยนประเภท
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

      const assetData: any = { ...formData };
      
      // จัดการรูปภาพ
      if (imageInputType === 'file' && selectedFile) {
        // อัปโหลดไฟล์รูปภาพ
        const formDataImage = new FormData();
        formDataImage.append('file', selectedFile);
        formDataImage.append('materialCode', formData.assetNumber || `ASSET-${Date.now()}`);
        formDataImage.append('folder', 'it-stock/uploads/assets');
        
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

      // แปลงข้อมูลตัวเลข
      if (assetData.purchasePrice) {
        assetData.purchasePrice = parseFloat(assetData.purchasePrice);
      }
      if (assetData.purchaseDate) {
        assetData.purchaseDate = new Date(assetData.purchaseDate).toISOString();
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
          // ถ้าไม่ใช่ JSON response
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
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-orange-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            {editingAsset ? (
              <>
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>แก้ไขครุภัณฑ์</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>เพิ่มครุภัณฑ์ใหม่</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>ข้อมูลพื้นฐาน</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลขครุภัณฑ์ *
                </label>
                <input
                  type="text"
                  name="assetNumber"
                  value={formData.assetNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="เช่น ASSET-001"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อครุภัณฑ์ *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ชื่อครุภัณฑ์"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่ *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="หมวดหมู่"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยี่ห้อ
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ยี่ห้อ"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รุ่น/โมเดล
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="รุ่น/โมเดล"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเลขเครื่อง
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Serial Number"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>ข้อมูลการซื้อ</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่ซื้อ
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาซื้อ (บาท)
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Location & Condition */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>ตำแหน่งและสภาพ</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานที่
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="เช่น ห้อง 101"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สภาพ
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  <option value="GOOD">ดี</option>
                  <option value="DAMAGED">เสียหาย</option>
                  <option value="NEEDS_REPAIR">ต้องซ่อม</option>
                  <option value="DISPOSED">จำหน่ายแล้ว</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>รูปภาพครุภัณฑ์</span>
            </h3>

            {/* Image Type Toggle */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={imageInputType === 'file'}
                    onChange={() => handleImageTypeChange('file')}
                    className="mr-2"
                    disabled={loading}
                  />
                  อัปโหลดไฟล์
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="url"
                    checked={imageInputType === 'url'}
                    onChange={() => handleImageTypeChange('url')}
                    className="mr-2"
                    disabled={loading}
                  />
                  ใส่ URL
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <div className="relative w-32 h-32 mx-auto">
                  <SafeImage
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* File Upload */}
            {imageInputType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกไฟล์รูปภาพ
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">รองรับ: JPG, PNG, GIF (ไม่เกิน 10MB)</p>
              </div>
            )}

            {/* URL Input */}
            {imageInputType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL รูปภาพ
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>รายละเอียดเพิ่มเติม</span>
            </h3>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับครุภัณฑ์"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>ยกเลิก</span>
            </button>
            <button
              type="submit"
              className={`inline-flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingAsset ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}</span>
                </>
              ) : (
                <>
                  {editingAsset ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  )}
                  <span>{editingAsset ? 'อัปเดต' : 'บันทึก'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
