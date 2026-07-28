'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import * as faceapi from 'face-api.js';
import { employeeApi } from '@/lib/api';

const MODEL_URL = '/face-api-models';
const REQUIRED_STABLE_SECONDS = 3;
const MIN_FACE_AREA_RATIO = 0.12;

type CaptureStatus =
  | 'loading'
  | 'ready'
  | 'detecting'
  | 'countdown'
  | 'capturing'
  | 'uploading'
  | 'success'
  | 'error';

function FaceCaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const countdownStartedAtRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const employeeId = searchParams.get('employeeId');
  const employeeCode = searchParams.get('employeeCode') || '';
  const employeeName = searchParams.get('employeeName') || employeeCode || 'Employee';
  const branchCode = searchParams.get('branchCode') || '';

  const [status, setStatus] = useState<CaptureStatus>('loading');
  const [message, setMessage] = useState('Loading camera and face detector...');
  const [countdown, setCountdown] = useState(REQUIRED_STABLE_SECONDS);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isManualEnabled, setIsManualEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!employeeId || !branchCode) {
      router.replace('/branch/qr-scanner');
    }
  }, [employeeId, branchCode, router]);

  useEffect(() => {
    let active = true;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        if (!active) return;
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        setStatus('error');
        setMessage('Failed to load face detection models.');
      }
    };

    loadModels();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

    let mounted = true;
    const videoElement = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr?.name !== 'AbortError') {
            throw playErr;
          }
        }
        setCameraReady(true);
        setStatus('ready');
        setMessage('Position one face inside the frame.');
      } catch (error) {
        console.error('Camera access failed:', error);
        setStatus('error');
        setMessage('Camera access failed. Please allow camera permission and try again.');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      const stream = videoElement?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [modelsLoaded]);

  const captureAndUpload = useCallback(async () => {
    if (!videoRef.current || !captureCanvasRef.current || !employeeId || isCapturing) return;

    try {
      setIsCapturing(true);
      setStatus('capturing');
      setMessage('Capturing image...');

      const video = videoRef.current;
      const canvas = captureCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas is not available');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Failed to create image blob'));
        }, 'image/jpeg', 0.92);
      });

      const previewUrl = URL.createObjectURL(blob);
      setUploadPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return previewUrl;
      });

      setStatus('uploading');
      setMessage('Uploading face capture...');

      const file = new File([blob], `${employeeCode || employeeId}-face-capture.jpg`, {
        type: 'image/jpeg',
      });

      await employeeApi.uploadFaceCapture(Number(employeeId), file, branchCode);

      setStatus('success');
      setMessage('Face capture saved successfully.');
      redirectTimeoutRef.current = window.setTimeout(() => {
        router.push('/branch/qr-scanner');
      }, 2200);
    } catch (error) {
      console.error('Face capture upload failed:', error);
      countdownStartedAtRef.current = null;
      setCountdown(REQUIRED_STABLE_SECONDS);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to capture and upload face image.');
    } finally {
      setIsCapturing(false);
    }
  }, [branchCode, employeeCode, employeeId, isCapturing, router]);

  useEffect(() => {
    if (!modelsLoaded || !cameraReady || status === 'success' || status === 'uploading') return;

    let frameId = 0;

    const detectFace = async () => {
      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!video || !overlayCanvas || video.readyState < 2) {
        frameId = requestAnimationFrame(detectFace);
        return;
      }

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
        .withFaceLandmarks();

      const ctx = overlayCanvas.getContext('2d');
      if (ctx) {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }

      if (detections.length !== 1) {
        countdownStartedAtRef.current = null;
        setCountdown(REQUIRED_STABLE_SECONDS);
        setIsManualEnabled(false);
        setStatus('detecting');
        setMessage(detections.length > 1 ? 'Only one face must be visible.' : 'No face detected. Move into the frame.');
        frameId = requestAnimationFrame(detectFace);
        return;
      }

      const detection = detections[0];
      const box = detection.detection.box;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight);
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const centered =
        centerX > videoWidth * 0.35 &&
        centerX < videoWidth * 0.65 &&
        centerY > videoHeight * 0.3 &&
        centerY < videoHeight * 0.7;

      if (ctx) {
        ctx.strokeStyle = centered && faceAreaRatio >= MIN_FACE_AREA_RATIO ? '#22c55e' : '#facc15';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }

      if (!centered || faceAreaRatio < MIN_FACE_AREA_RATIO) {
        countdownStartedAtRef.current = null;
        setCountdown(REQUIRED_STABLE_SECONDS);
        setIsManualEnabled(false);
        setStatus('detecting');
        setMessage('Center your face and move a bit closer.');
        frameId = requestAnimationFrame(detectFace);
        return;
      }

      setIsManualEnabled(true);
      if (!countdownStartedAtRef.current) {
        countdownStartedAtRef.current = Date.now();
      }

      const elapsedSeconds = Math.floor((Date.now() - countdownStartedAtRef.current) / 1000);
      const remaining = Math.max(REQUIRED_STABLE_SECONDS - elapsedSeconds, 0);
      setCountdown(remaining);
      setStatus('countdown');
      setMessage('Hold still for automatic capture.');

      if (remaining === 0 && !isCapturing) {
        await captureAndUpload();
        return;
      }

      frameId = requestAnimationFrame(detectFace);
    };

    frameId = requestAnimationFrame(detectFace);

    return () => cancelAnimationFrame(frameId);
  }, [cameraReady, captureAndUpload, isCapturing, modelsLoaded, status]);

  const resetCapture = () => {
    countdownStartedAtRef.current = null;
    setCountdown(REQUIRED_STABLE_SECONDS);
    setStatus('ready');
    setMessage('Position one face inside the frame.');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Face Capture</p>
          <h1 className="text-lg font-semibold">{employeeName}</h1>
          <p className="text-sm text-gray-400">{employeeCode} · Branch {branchCode}</p>
        </div>
        <button
          onClick={() => router.push('/branch/qr-scanner')}
          className="rounded bg-gray-800 px-4 py-2 text-sm text-gray-200"
        >
          Back
        </button>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover sm:aspect-video" playsInline muted />
          <canvas ref={overlayCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
          <canvas ref={captureCanvasRef} className="hidden" />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute left-1/2 top-1/2 h-[62%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-4 border-yellow-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          {status === 'countdown' && (
            <div className="absolute inset-x-0 top-8 flex justify-center">
              <div className="rounded-full bg-yellow-400 px-6 py-3 text-4xl font-bold text-black shadow-lg">
                {countdown}
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-lg font-semibold">Capture Status</h2>
          <p className="mt-3 text-sm text-gray-300">{message}</p>

          <div className="mt-4 space-y-2 text-sm text-gray-400">
            <p>1. Keep exactly one face in the frame.</p>
            <p>2. Stay centered and hold still for 3 seconds.</p>
            <p>3. The page will auto-capture once alignment is stable.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={resetCapture}
              className="rounded bg-gray-800 px-4 py-2 text-sm text-white"
            >
              Retry
            </button>
            <button
              onClick={() => void captureAndUpload()}
              disabled={!isManualEnabled || isCapturing || status === 'uploading' || status === 'success'}
              className="rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Manual Capture
            </button>
          </div>

          {uploadPreview && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-gray-400">Latest preview</p>
              <div className="relative h-56 w-full overflow-hidden rounded-xl">
                <Image
                  src={uploadPreview}
                  alt="Face capture preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
              Saved. Returning to the scanner shortly.
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              Capture failed. Adjust the employee position or retry manually.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BranchFaceCapturePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6">Loading face capture...</div>}>
      <FaceCaptureContent />
    </Suspense>
  );
}
