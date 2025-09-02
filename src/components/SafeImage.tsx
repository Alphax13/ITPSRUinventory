'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string | undefined | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: () => void;
  onClick?: () => void;
}

export default function SafeImage({ src, alt, width, height, className, onError, onClick }: SafeImageProps) {
  const [error, setError] = useState(false);
  const [isExternal, setIsExternal] = useState(false);

  // ตรวจสอบว่าเป็น URL ภายนอกหรือไม่
  const checkIfExternal = (url: string) => {
    try {
      const urlObj = new URL(url);
      return !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1');
    } catch {
      return false;
    }
  };

  // ใช้ fallback image หาก src ไม่มีค่า
  const imageSrc = src || '/placeholder-material.svg';

  const handleError = () => {
    setError(true);
    if (onError) {
      onError();
    }
  };

  const handleLoad = () => {
    setIsExternal(checkIfExternal(imageSrc));
  };

  if (error) {
    return (
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🖼️</div>
          <p className="text-sm">ไม่สามารถโหลดรูปภาพได้</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={isExternal || checkIfExternal(imageSrc)}
      onError={handleError}
      onLoad={handleLoad}
      onClick={onClick}
      priority={false}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
