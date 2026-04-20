'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import { AxiosError } from 'axios';
import jsQR from 'jsqr';

export default function QRScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [manualCode, setManualCode] = useState('');

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: attendanceApi.clockIn,
    onSuccess: () => {
      setScanResult({ success: true, message: `Clocked in at ${new Date().toLocaleTimeString()}` });
      setTimeout(() => setScanResult(null), 3000);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setScanResult({ success: false, message: error.response?.data?.message || 'Clock in failed' });
      setTimeout(() => setScanResult(null), 3000);
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: attendanceApi.clockOut,
    onSuccess: () => {
      setScanResult({ success: true, message: `Clocked out at ${new Date().toLocaleTimeString()}` });
      setTimeout(() => setScanResult(null), 3000);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setScanResult({ success: false, message: error.response?.data?.message || 'Clock out failed' });
      setTimeout(() => setScanResult(null), 3000);
    },
  });

  // Start camera scanning
  useEffect(() => {
    if (scanning && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            scanFrame();
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setScanResult({ success: false, message: 'Camera access denied. Please use manual entry.' });
        });
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [scanning]);

  // Scan video frame for QR codes
  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleScan(code.data);
        return;
      }
    }

    requestAnimationFrame(scanFrame);
  };

  // Parse QR code data format: JAJR-EMP:id|code|name
  const parseQRData = (qrData: string) => {
    const match = qrData.match(/^JAJR-EMP:(\d+)\|([^|]+)\|(.+)$/);
    if (!match) return null;
    return {
      employeeId: parseInt(match[1], 10),
      employeeCode: match[2],
      employeeName: match[3],
    };
  };

  // Handle scanned QR code
  const handleScan = (qrData: string) => {
    setScanning(false);
    
    const parsed = parseQRData(qrData);
    if (!parsed) {
      setScanResult({ success: false, message: 'Invalid QR code format. Expected: JAJR-EMP:id|code|name' });
      setTimeout(() => setScanResult(null), 3000);
      return;
    }

    const hour = new Date().getHours();
    const isClockOut = hour >= 17;

    if (isClockOut) {
      clockOutMutation.mutate({ qrCodeData: qrData });
    } else {
      clockInMutation.mutate({ qrCodeData: qrData });
    }
  };

  // Handle manual code entry
  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    
    const hour = new Date().getHours();
    const isClockOut = hour >= 17;
    const trimmedCode = manualCode.trim();

    const parsed = parseQRData(trimmedCode);
    
    if (!parsed) {
      setScanResult({ success: false, message: 'Invalid format. Expected: JAJR-EMP:id|code|name' });
      setTimeout(() => setScanResult(null), 3000);
      return;
    }
    
    if (isClockOut) {
      clockOutMutation.mutate({ qrCodeData: trimmedCode });
    } else {
      clockInMutation.mutate({ qrCodeData: trimmedCode });
    }
    
    setManualCode('');
  };
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>

      {/* Result Message */}
      {scanResult && (
        <div className={`p-4 rounded-lg text-center ${scanResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{scanResult.message}</p>
        </div>
      )}

      {/* Scanner Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Camera Scanner</h2>
        
        {scanning ? (
          <div className="relative">
            <video ref={videoRef} className="w-full rounded-lg" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={() => setScanning(false)}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop Scanning
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <button
              onClick={() => setScanning(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
