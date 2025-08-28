// src/components/QRScanner.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
  const [hasCamera, setHasCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 300 },
          height: { ideal: 300 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasCamera(true);
        setScanning(true);
      }
    } catch {
      console.error('Camera access denied');
      setHasCamera(false);
      onError?.('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  const handleManualInput = () => {
    const input = prompt('กรอกรหัสวัสดุ หรือ เลขครุภัณฑ์:');
    if (input) {
      onScan(input.trim());
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">สแกน QR Code</h3>
          <p className="text-gray-600">วางกล้องให้ตรงกับ QR Code หรือรหัสวัสดุ</p>
        </div>

        {hasCamera ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-gray-100 rounded-lg object-cover"
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
            </div>
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 animate-pulse"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-600">กล้องไม่พร้อมใช้งาน</p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <button
            onClick={handleManualInput}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
          >
            📝 กรอกรหัสด้วยตนเอง
          </button>
          
          <button
            onClick={() => onScan('')}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
          >
            ❌ ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
