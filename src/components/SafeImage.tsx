'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: () => void;
}

export default function SafeImage({ src, alt, width, height, className, onError }: SafeImageProps) {
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

  const handleError = () => {
    setError(true);
    if (onError) {
      onError();
    }
  };

  const handleLoad = () => {
    setIsExternal(checkIfExternal(src));
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
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={isExternal || checkIfExternal(src)}
      onError={handleError}
      onLoad={handleLoad}
      priority={false}
    />
  );
}
