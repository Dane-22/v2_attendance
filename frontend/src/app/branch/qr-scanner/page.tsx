'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import { AxiosError } from 'axios';
import jsQR from 'jsqr';
import { useWebSocket } from '@/hooks/useWebSocket';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  branch_code?: string;
}

function getBranchName(code: string): string {
  const branches: Record<string, string> = {
    'A': 'Sto. Rosario',
    'B': 'BCDA',
    'C': 'Sundara',
    'D': 'Panicsican',
    'E': 'Main Office',
    'F': 'Capitol',
    'H': 'Testing Branch'
  };
  return branches[code] || code;
}

export default function BranchQRScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; show: boolean } | null>(null);
  const [lastQrData, setLastQrData] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showPresentList, setShowPresentList] = useState(false);
  const [presentEmployees, setPresentEmployees] = useState<string[]>([]);
  const { isConnected, joinBranch, emit } = useWebSocket();

  // Play success sound on scan
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Get user info on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Join branch room when user is loaded
  useEffect(() => {
    if (user && user.branch_code) {
      joinBranch(user.branch_code);
    }
  }, [user, joinBranch]);

  // Store parsed employee info for success messages
  const [lastEmployeeName, setLastEmployeeName] = useState('');
  const [lastEmployeeCode, setLastEmployeeCode] = useState('');
  const [hasActiveClockIn, setHasActiveClockIn] = useState(false);

  // Unified clock mutation - backend decides clock-in or clock-out
  const clockMutation = useMutation({
    mutationFn: attendanceApi.clock,
    onSuccess: (response: any) => {
      const action = response.data?.data?.action || response.data?.action || 'clock_in';
      const name = response.data?.data?.employeeName || response.data?.employeeName || lastEmployeeName || 'Employee';
      const label = action === 'clock_out' ? 'Clock Out' : 'Clock In';
      setScanResult({ success: true, message: `${label}: ${name}`, show: true });
      setCooldown(true);

      // Play success sound
      playSuccessSound();

      // Emit scan success event via WebSocket
      if (user?.branch_code && lastEmployeeName) {
        emit('scan:success', {
          employeeName: lastEmployeeName,
          employeeCode: lastEmployeeCode,
          action: action,
          branchCode: user.branch_code,
          timestamp: new Date().toISOString(),
        });
      }

      setTimeout(() => {
        setScanResult(null);
        setCooldown(false);
      }, 2000);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error.response?.data?.message || 'Scan Failed';
      setScanResult({ success: false, message: `${msg} (Code: ${lastQrData.substring(0, 30)}...)`, show: true });
      setCooldown(true);
      setTimeout(() => {
        setScanResult(null);
        setCooldown(false);
      }, 4000);
    },
  });

  // Start camera scanning
  useEffect(() => {
    if (scanning && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            scanFrame();
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setCameraError(true);
          setScanning(false);
          setScanResult({ success: false, message: 'Camera not available', show: true });
        });
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [scanning]);

  // Throttle scan to every 200ms for better performance (5fps instead of 60fps)
  const lastScanTimeRef = useRef<number>(0);

  // Scan video frame for QR codes
  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current || cooldown) {
      requestAnimationFrame(scanFrame);
      return;
    }

    // Throttle scanning to improve performance
    const now = Date.now();
    if (now - lastScanTimeRef.current < 200) {
      requestAnimationFrame(scanFrame);
      return;
    }
    lastScanTimeRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Use smaller canvas for better performance
      const scanWidth = Math.min(video.videoWidth, 640);
      const scanHeight = Math.min(video.videoHeight, 480);
      canvas.width = scanWidth;
      canvas.height = scanHeight;
      ctx.drawImage(video, 0, 0, scanWidth, scanHeight);

      const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data !== lastScan) {
        console.log('[QR SCAN] Found code:', code.data.substring(0, 50));
        setLastScan(code.data);
        handleScan(code.data);
      }
    }

    requestAnimationFrame(scanFrame);
  };

  // Parse QR code data - support multiple formats
  const parseQRData = (qrData: string) => {
    console.log('[QR SCAN] Raw data:', qrData);

    // Try JAJR-EMP format: JAJR-EMP:id|code|name
    const jajrMatch = qrData.match(/^JAJR-EMP:(\d+)\|([^|]+)\|(.+)$/i);
    if (jajrMatch) {
      return {
        employeeId: parseInt(jajrMatch[1], 10),
        employeeCode: jajrMatch[2].trim(),
        employeeName: jajrMatch[3].trim(),
        format: 'JAJR-EMP'
      };
    }

    // Try simple employee code format (E0001, W0001, etc.) - case insensitive
    const simpleMatch = qrData.match(/^([A-Za-z]\d{4,})$/);
    if (simpleMatch) {
      return {
        employeeId: 0,
        employeeCode: simpleMatch[1].toUpperCase(),
        employeeName: '',
        format: 'SIMPLE'
      };
    }

    // Try URL format: https://jajr.com/attendance/E0001
    const urlMatch = qrData.match(/\/attendance\/([A-Za-z]\d{4,})/i);
    if (urlMatch) {
      return {
        employeeId: 0,
        employeeCode: urlMatch[1].toUpperCase(),
        employeeName: '',
        format: 'URL'
      };
    }

    // Try old jajr.xandree.com format with emp_code query param
    // Format: .../employee/select_employee.php?auto_timein=1&select_branch=1&emp_id=42&emp_code=E0001
    const empCodeMatch = qrData.match(/[?&]emp_code=([^&\s]+)/i);
    if (empCodeMatch) {
      const decodedCode = decodeURIComponent(empCodeMatch[1]);
      const idMatch = qrData.match(/[?&]emp_id=(\d+)/i);
      return {
        employeeId: idMatch ? parseInt(idMatch[1], 10) : 0,
        employeeCode: decodedCode.toUpperCase(),
        employeeName: '',
        format: 'LEGACY-URL'
      };
    }

    // Try any URL with emp= or code= parameter
    const altCodeMatch = qrData.match(/[?&](?:emp|code|id)=([^&\s]+)/i);
    if (altCodeMatch) {
      return {
        employeeId: 0,
        employeeCode: decodeURIComponent(altCodeMatch[1]).toUpperCase(),
        employeeName: '',
        format: 'GENERIC-URL'
      };
    }

    console.log('[QR SCAN] No matching format found');
    return null;
  };

  // Handle scanned QR code
  const handleScan = (qrData: string) => {
    if (!cameraError) setScanning(false);

    const parsed = parseQRData(qrData);
    if (parsed) {
      setLastEmployeeName(parsed.employeeName || parsed.employeeCode);
      setLastEmployeeCode(parsed.employeeCode);
    }
    if (!parsed) {
      // Show actual scanned data for debugging
      const preview = qrData.length > 40 ? qrData.substring(0, 40) + '...' : qrData;
      setLastQrData(qrData); // Store full data for debug display
      setScanResult({ success: false, message: `Invalid: ${preview}`, show: true });
      setTimeout(() => {
        setScanResult(null);
        if (!cameraError) {
          setScanning(true);
          setLastScan(null);
        }
      }, 5000);
      return;
    }

    // Send to unified clock endpoint - backend decides clock-in or clock-out
    performClockAction(qrData);
    
    if (!cameraError) {
      setTimeout(() => {
        setScanning(true);
        setLastScan(null);
      }, 2000);
    }
  };

  // Unified clock action - backend decides clock-in or clock-out
  const performClockAction = (qrData: string) => {
    console.log('[CLOCK] Sending to unified clock endpoint:', qrData);
    clockMutation.mutate({ qrCodeData: qrData });
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isBranchUser = user?.username?.match(/^branch-[a-h]$/i);
  const branchCode = user?.branch_code || user?.username?.split('-')[1]?.toUpperCase() || 'A';
  const branchName = getBranchName(branchCode);

  // Full screen mobile interface for branch devices
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
              <path fillRule="evenodd" d="M10 9a2 2 0 100-4 2 2 0 000 4zm-4 5a4 4 0 118 0H6z" clipRule="evenodd"/>
            </svg>
            {branchCode}
          </div>
          <span className="text-white font-medium text-sm">{branchName}</span>
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm bg-gray-800 px-3 py-1.5 rounded"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {/* Currently Present Button */}
      <div className="px-4 py-2 bg-gray-900">
        <button
          onClick={() => setShowPresentList(!showPresentList)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm bg-gray-800 px-3 py-1.5 rounded"
        >
          <span>View Present ({presentEmployees.length})</span>
          <svg className={`w-4 h-4 transition-transform ${showPresentList ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Currently Present List */}
      {showPresentList && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          {presentEmployees.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">No employees currently present</p>
          ) : (
            <ul className="space-y-1">
              {presentEmployees.map((name, index) => (
                <li key={index} className="text-gray-300 text-sm py-1 px-2 bg-gray-700 rounded">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Camera Feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Dark overlay outside scan frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
            <div className="w-full h-full bg-transparent" />
          </div>
        </div>
        
        {/* Scan Frame Overlay */}
        <div className="relative z-10">
          <div className="w-64 h-64 relative">
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-yellow-400 rounded-tl-lg" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-yellow-400 rounded-tr-lg" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-yellow-400 rounded-bl-lg" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-yellow-400 rounded-br-lg" />
            
            {/* Laser Line Animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 animate-scan shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          </div>
        </div>

        {/* Scanning Text */}
        <div className="absolute bottom-32 left-0 right-0 text-center z-20">
          <p className="text-white/90 text-base font-medium drop-shadow-lg">Align QR code within frame</p>
          <button
            onClick={() => setShowManualEntry(true)}
            className="mt-4 text-yellow-400 text-sm underline"
          >
            Tap to enter code manually
          </button>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-medium mb-4">Enter Employee Code</h3>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="E0001 or JAJR-EMP:..."
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowManualEntry(false)}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={clockMutation.isPending}
                className="flex-1 py-3 bg-yellow-500 text-black font-medium rounded-lg disabled:opacity-50"
              >
                {clockMutation.isPending ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error / Fallback */}
      {cameraError && !showManualEntry && (
        <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center p-6">
          <svg className="w-16 h-16 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-white text-lg mb-2">Camera not available</p>
          <p className="text-gray-400 text-sm mb-6 text-center">Please ensure camera permissions are granted</p>
          <button
            onClick={() => {
              setCameraError(false);
              setScanning(true);
            }}
            className="px-6 py-3 bg-yellow-500 text-black font-medium rounded-lg mb-3"
          >
            Retry Camera
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className="text-yellow-400 text-sm underline"
          >
            Enter code manually
          </button>
        </div>
      )}

      {/* Debug Info - Shows raw QR data */}
      {lastQrData && !scanResult?.show && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-black/90 border border-yellow-500/50 rounded-lg p-3">
          <p className="text-yellow-400 text-xs font-mono break-all">{lastQrData}</p>
          <button
            onClick={() => setLastQrData('')}
            className="mt-2 text-xs text-gray-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Result Toast */}
      {scanResult?.show && (
        <div className={`absolute bottom-0 left-0 right-0 p-4 z-30 ${scanResult.success ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scanResult.success ? 'bg-green-500' : 'bg-red-500'}`}>
              {scanResult.success ? (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="text-white font-medium">{scanResult.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
