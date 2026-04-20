'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useMutation } from '@tanstack/react-query';
import { ScanLine, Zap, AlertCircle, User, QrCode, Keyboard } from 'lucide-react';
import jsQR from 'jsqr';
import { useAppStore, useBranchCode } from '@/store/appStore';
import { attendanceApi } from '@/lib/api';

// QR Data Interface
interface ParsedQRData {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  format: 'JAJR-EMP' | 'V1-URL' | 'SIMPLE';
}

// Scan Result Interface
interface ScanResult {
  success: boolean;
  message: string;
  employee?: {
    id: number;
    code: string;
    name: string;
  };
  type?: 'clock-in' | 'clock-out';
}

/**
 * Hybrid QR Parser
 * Supports:
 * 1. JAJR-EMP Format: JAJR-EMP:{id}|{employee_code}|{employee_name}
 *    Regex: /JAJR-EMP:(\d+)\|([^|]+)\|(.+)/
 * 2. V1 URL Format: https://jajr.com/attendance/{employee_code}
 * 3. Simple Code: {employee_code} (E0001, W0001, etc.)
 */
const parseQRCode = (data: string): ParsedQRData | null => {
  // Try JAJR-EMP Format (Primary)
  const jajrMatch = data.match(/^JAJR-EMP:(\d+)\|([^|]+)\|(.+)$/);
  if (jajrMatch) {
    return {
      employeeId: parseInt(jajrMatch[1], 10),
      employeeCode: jajrMatch[2].trim(),
      employeeName: jajrMatch[3].trim(),
      format: 'JAJR-EMP',
    };
  }

  // Try V1 URL Format (Legacy Support)
  const urlMatch = data.match(/\/attendance\/([A-Z]\d{4,})/i);
  if (urlMatch) {
    return {
      employeeId: 0,
      employeeCode: urlMatch[1].toUpperCase(),
      employeeName: 'Unknown',
      format: 'V1-URL',
    };
  }

  // Try Simple Employee Code Format
  const simpleMatch = data.match(/^([A-Z]\d{4,})$/);
  if (simpleMatch) {
    return {
      employeeId: 0,
      employeeCode: simpleMatch[1].toUpperCase(),
      employeeName: 'Unknown',
      format: 'SIMPLE',
    };
  }

  return null;
};

export default function HybridScannerPage() {
  const branchCode = useBranchCode();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  
  // State
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // GSAP Animation - Laser Line
  useEffect(() => {
    if (laserRef.current && scanning) {
      gsap.to(laserRef.current, {
        y: 256,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    } else if (laserRef.current) {
      gsap.killTweensOf(laserRef.current);
      gsap.set(laserRef.current, { y: 0 });
    }
  }, [scanning]);

  // GSAP Animation - Frame Pulse
  useEffect(() => {
    if (frameRef.current && scanning) {
      gsap.to(frameRef.current, {
        boxShadow: '0 0 30px rgba(250, 204, 21, 0.5), 0 0 60px rgba(250, 204, 21, 0.3)',
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    } else if (frameRef.current) {
      gsap.killTweensOf(frameRef.current);
      gsap.set(frameRef.current, { boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' });
    }
  }, [scanning]);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        setCameraError(false);
        scanFrame();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      setScanning(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  }, []);

  // Scan Frame
  const scanFrame = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current || cooldown) {
      if (scanning) {
        requestAnimationFrame(scanFrame);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data !== lastScan) {
        setLastScan(code.data);
        handleScan(code.data);
        return;
      }
    }

    if (scanning) {
      requestAnimationFrame(scanFrame);
    }
  }, [scanning, cooldown, lastScan]);

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: attendanceApi.clockIn,
    onSuccess: (_, variables) => {
      const parsed = parseQRCode(variables.qrCodeData);
      showSuccessResult(parsed, 'clock-in');
    },
    onError: (error: any) => {
      showErrorResult(error.response?.data?.message || 'Clock in failed');
    },
  });

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: attendanceApi.clockOut,
    onSuccess: (_, variables) => {
      const parsed = parseQRCode(variables.qrCodeData);
      showSuccessResult(parsed, 'clock-out');
    },
    onError: (error: any) => {
      showErrorResult(error.response?.data?.message || 'Clock out failed');
    },
  });

  // Show Success Result with GSAP
  const showSuccessResult = (parsed: ParsedQRData | null, type: 'clock-in' | 'clock-out') => {
    setCooldown(true);
    setScanResult({
      success: true,
      message: type === 'clock-in' ? 'Clock In Successful' : 'Clock Out Successful',
      employee: parsed ? { id: parsed.employeeId, code: parsed.employeeCode, name: parsed.employeeName } : undefined,
      type,
    });

    // GSAP Success Animation - Green Glow
    if (glowRef.current) {
      gsap.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.to(glowRef.current, {
        opacity: 0,
        scale: 1.2,
        duration: 0.5,
        delay: 0.3,
        ease: 'power2.in',
      });
    }

    // GSAP Result Card Animation
    if (resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }

    setTimeout(() => {
      setScanResult(null);
      setCooldown(false);
      setLastScan(null);
    }, 3000);
  };

  // Show Error Result with GSAP
  const showErrorResult = (message: string) => {
    setCooldown(true);
    setScanResult({ success: false, message });

    // GSAP Error Animation - Red Shake
    if (resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { x: 0 },
        { x: 10, duration: 0.1, repeat: 5, yoyo: true, ease: 'power1.inOut' }
      );
      gsap.fromTo(
        resultRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }

    setTimeout(() => {
      setScanResult(null);
      setCooldown(false);
      setLastScan(null);
    }, 3000);
  };

  // Handle Scan
  const handleScan = useCallback((data: string) => {
    const parsed = parseQRCode(data);
    
    if (!parsed) {
      showErrorResult('Invalid QR Code Format');
      return;
    }

    // Determine clock in/out based on time (after 5 PM = clock out)
    const hour = new Date().getHours();
    const isClockOut = hour >= 17;

    if (isClockOut) {
      clockOutMutation.mutate({ qrCodeData: data });
    } else {
      clockInMutation.mutate({ qrCodeData: data });
    }
  }, [clockInMutation, clockOutMutation]);

  // Handle Manual Submit
  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode('');
    setShowManual(false);
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0a0a0a] transition-colors duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#facc15] flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Hybrid QR Scanner</h1>
            <p className="text-sm text-gray-400">Supports JAJR-EMP, V1 URL, and Simple Code formats</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="relative bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-2xl">
          {/* Success/Error Glow Overlay */}
          <div
            ref={glowRef}
            className={`absolute inset-0 z-30 pointer-events-none opacity-0 ${
              scanResult?.success ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          />

          {/* Camera Feed */}
          <div className="relative aspect-square bg-black">
            {scanning && !cameraError ? (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* High-Tech Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner Markers */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cornerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    {/* Top Left */}
                    <path d="M0,15 L0,0 L15,0" fill="none" stroke="url(#cornerGradient)" strokeWidth="0.5" />
                    {/* Top Right */}
                    <path d="M85,0 L100,0 L100,15" fill="none" stroke="url(#cornerGradient)" strokeWidth="0.5" />
                    {/* Bottom Left */}
                    <path d="M0,85 L0,100 L15,100" fill="none" stroke="url(#cornerGradient)" strokeWidth="0.5" />
                    {/* Bottom Right */}
                    <path d="M85,100 L100,100 L100,85" fill="none" stroke="url(#cornerGradient)" strokeWidth="0.5" />
                  </svg>

                  {/* Scan Frame */}
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div
                      ref={frameRef}
                      className="relative w-64 h-64 border-2 border-[#facc15]/50 rounded-xl"
                      style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}
                    >
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-[#facc15] rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-[#facc15] rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-[#facc15] rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-[#facc15] rounded-br-lg" />

                      {/* Laser Line */}
                      <div
                        ref={laserRef}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent"
                        style={{ boxShadow: '0 0 10px rgba(250, 204, 21, 0.8), 0 0 20px rgba(250, 204, 21, 0.4)' }}
                      />
                    </div>
                  </div>

                  {/* Scanning Text */}
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-white/80 text-sm font-medium tracking-wider uppercase animate-pulse">
                      Align QR Code Within Frame
                    </p>
                  </div>
                </div>
              </>
            ) : cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141414] p-6">
                <AlertCircle className="w-16 h-16 text-[#facc15] mb-4" />
                <p className="text-white text-lg font-medium mb-2">Camera Not Available</p>
                <p className="text-gray-400 text-sm text-center mb-6">
                  Please ensure camera permissions are granted or use manual entry
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-[#facc15] text-black font-medium rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141414]">
                <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                  <ScanLine className="w-12 h-12 text-[#facc15]" />
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-[#facc15] text-black font-medium rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                >
                  Start Scanner
                </button>
              </div>
            )}
          </div>

          {/* Manual Entry Button */}
          <button
            onClick={() => setShowManual(true)}
            className="absolute bottom-4 right-4 p-3 bg-[#141414]/90 backdrop-blur border border-[#262626] rounded-xl text-[#facc15] hover:bg-[#1a1a1a] transition-colors z-20"
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Results Section */}
        <div className="space-y-4">
          {/* Scan Result Card */}
          {scanResult && (
            <div
              ref={resultRef}
              className={`p-6 rounded-2xl border-2 ${
                scanResult.success
                  ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
                  : 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    scanResult.success ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {scanResult.success ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold ${
                      scanResult.success ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {scanResult.message}
                  </h3>
                  {scanResult.employee && (
                    <div className="mt-3 p-4 bg-[#1a1a1a] rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-[#facc15]" />
                        <span className="text-white font-medium">{scanResult.employee.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <QrCode className="w-4 h-4 text-gray-400" />
                        <span className="text-[#facc15] font-mono">{scanResult.employee.code}</span>
                        {scanResult.type && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              scanResult.type === 'clock-in'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {scanResult.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Format Info Card */}
          <div className="p-6 rounded-2xl border border-[#262626] bg-[#141414]">
            <h3 className="text-lg font-semibold text-white mb-4">Supported QR Formats</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#facc15]/10 rounded-xl border border-[#facc15]/30">
                <div className="w-8 h-8 rounded-lg bg-[#facc15] flex items-center justify-center shrink-0">
                  <span className="text-black text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-[#facc15] font-medium text-sm">JAJR-EMP Format (Primary)</p>
                  <p className="text-gray-400 text-xs font-mono mt-1">JAJR-EMP:id|code|name</p>
                  <p className="text-gray-500 text-xs mt-1">Example: JAJR-EMP:123|E0001|John Doe</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#262626]">
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-gray-300 font-medium text-sm">V1 URL Format (Legacy)</p>
                  <p className="text-gray-400 text-xs font-mono mt-1">https://jajr.com/attendance/code</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#262626]">
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-gray-300 font-medium text-sm">Simple Code</p>
                  <p className="text-gray-400 text-xs font-mono mt-1">E0001, W0001, etc.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Info */}
          <div className="p-4 rounded-xl border border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#facc15] flex items-center justify-center font-bold text-black">
                {branchCode}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Current Branch</p>
                <p className="text-[#facc15] text-sm">Branch {branchCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-[#262626] bg-[#141414] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Manual Entry</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter employee code or full JAJR-EMP format
            </p>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="E0001 or JAJR-EMP:123|E0001|John Doe"
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowManual(false)}
                className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 font-medium rounded-xl hover:bg-[#262626] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={clockInMutation.isPending || clockOutMutation.isPending}
                className="flex-1 py-3 bg-[#facc15] text-black font-medium rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50"
              >
                {clockInMutation.isPending || clockOutMutation.isPending ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
