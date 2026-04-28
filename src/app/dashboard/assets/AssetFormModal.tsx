// src/app/dashboard/assets/AssetFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

      const assetData: Record<string, unknown> = { ...formData };
      
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
      if (assetData.purchasePrice && typeof assetData.purchasePrice === 'string') {
        assetData.purchasePrice = parseFloat(assetData.purchasePrice);
      }
      if (assetData.purchaseDate && typeof assetData.purchaseDate === 'string') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800">
            {editingAsset ? 'แก้ไขครุภัณฑ์' : 'เพิ่มครุภัณฑ์ใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ข้อมูลพื้นฐาน */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ข้อมูลพื้นฐาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">เลขครุภัณฑ์ *</label>
                <input
                  type="text"
                  name="assetNumber"
                  value={formData.assetNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="เช่น ASSET-001"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อครุภัณฑ์ *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ชื่อครุภัณฑ์"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">หมวดหมู่ *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="หมวดหมู่"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ยี่ห้อ</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ยี่ห้อ"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">รุ่น/โมเดล</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="รุ่น/โมเดล"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเลขเครื่อง</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Serial Number"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* ข้อมูลการซื้อ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ข้อมูลการซื้อ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">วันที่ซื้อ</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

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
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* ตำแหน่งและสภาพ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ตำแหน่งและสภาพ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">สถานที่</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="เช่น ห้อง 101"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">สภาพ</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

          {/* รูปภาพครุภัณฑ์ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">รูปภาพครุภัณฑ์</h3>

            {/* Image Type Toggle */}
            <div className="flex gap-2 mb-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value="file"
                  checked={imageInputType === 'file'}
                  onChange={() => handleImageTypeChange('file')}
                  disabled={loading}
                />
                อัปโหลดไฟล์
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value="url"
                  checked={imageInputType === 'url'}
                  onChange={() => handleImageTypeChange('url')}
                  disabled={loading}
                />
                URL
              </label>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <div className="relative w-32 h-32 mx-auto">
                  <SafeImage
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-white/90 hover:bg-white text-slate-600 rounded-full w-6 h-6 flex items-center justify-center shadow border border-slate-200"
                    disabled={loading}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* File Upload */}
            {imageInputType === 'file' && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  disabled={loading}
                />
                <p className="text-xs text-slate-400 mt-1">รองรับ: JPG, PNG, GIF (ไม่เกิน 10MB)</p>
              </div>
            )}

            {/* URL Input */}
            {imageInputType === 'url' && (
              <div>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* รายละเอียด */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">รายละเอียดเพิ่มเติม</h3>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับครุภัณฑ์"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-xl transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingAsset ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}</span>
                </div>
              ) : (
                <span>{editingAsset ? 'บันทึกการแก้ไข' : 'เพิ่มครุภัณฑ์ใหม่'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
