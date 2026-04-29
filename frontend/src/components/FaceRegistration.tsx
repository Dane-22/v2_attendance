'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, Camera, CheckCircle, XCircle, User } from 'lucide-react';

interface FaceRegistrationProps {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  onRegistrationComplete?: () => void;
  onCancel?: () => void;
}

const MODEL_URL = '/face-api-models';
const REQUIRED_SAMPLES = 5;
const SIMILARITY_THRESHOLD = 0.6;

export default function FaceRegistration({
  employeeId,
  employeeName,
  employeeCode,
  onRegistrationComplete,
  onCancel,
}: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState<Float32Array[]>([]);
  const [currentDescriptor, setCurrentDescriptor] = useState<Float32Array | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load face recognition models. Please try again.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Cannot access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  // Detect face in real-time
  useEffect(() => {
    if (!cameraActive || !modelsLoaded || !videoRef.current) return;

    let animationFrameId: number;

    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState === 4) {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setFaceDetected(true);
          setCurrentDescriptor(detection.descriptor);

          // Calculate quality score based on face position and size
          const box = detection.detection.box;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const faceSize = (box.width * box.height) / (videoWidth * videoHeight);
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          const isCentered =
            centerX > videoWidth * 0.3 &&
            centerX < videoWidth * 0.7 &&
            centerY > videoHeight * 0.3 &&
            centerY < videoHeight * 0.7;

          let score = Math.min(faceSize * 3, 1) * 100;
          if (isCentered) score += 20;
          score = Math.min(score, 100);
          setQualityScore(score);

          // Draw detection box
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = score > 70 ? '#22c55e' : '#eab308';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }
        } else {
          setFaceDetected(false);
          setCurrentDescriptor(null);
          setQualityScore(0);

          // Clear canvas
          const ctx = canvas.getContext('2d');
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cameraActive, modelsLoaded]);

  // Check similarity with existing samples
  const checkSimilarity = (newDescriptor: Float32Array): boolean => {
    if (capturedSamples.length === 0) return true;

    for (const sample of capturedSamples) {
      const distance = faceapi.euclideanDistance(newDescriptor, sample);
      if (distance < SIMILARITY_THRESHOLD) {
        return false; // Too similar to existing sample
      }
    }
    return true;
  };

  // Capture sample
  const captureSample = () => {
    if (!currentDescriptor || !faceDetected) {
      setError('No face detected. Please position your face in the frame.');
      return;
    }

    if (qualityScore < 60) {
      setError('Face quality too low. Please ensure good lighting and face the camera directly.');
      return;
    }

    if (!checkSimilarity(currentDescriptor)) {
      setError('Sample too similar to previous capture. Please change your angle slightly.');
      return;
    }

    setCapturedSamples((prev) => [...prev, currentDescriptor]);
    setError(null);
  };

  // Clear all samples
  const clearSamples = () => {
    setCapturedSamples([]);
    setError(null);
  };

  // Register face
  const registerFace = async () => {
    if (capturedSamples.length < REQUIRED_SAMPLES) {
      setError(`Please capture at least ${REQUIRED_SAMPLES} samples. Currently: ${capturedSamples.length}`);
      return;
    }

    if (!consentGiven) {
      setError('Please confirm consent to proceed with facial registration.');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Calculate average descriptor from all samples
      const avgDescriptor = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        let sum = 0;
        for (const sample of capturedSamples) {
          sum += sample[i];
        }
        avgDescriptor[i] = sum / capturedSamples.length;
      }

      // Convert to array for API
      const embedding = Array.from(avgDescriptor);

      // Call API to register face
      const response = await fetch(`/api/face-recognition/register/${employeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          embedding,
          consentGiven,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register face');
      }

      setSuccess(true);
      stopCamera();
      onRegistrationComplete?.();
    } catch (err) {
      console.error('Error registering face:', err);
      setError(err instanceof Error ? err.message : 'Failed to register face. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Cancel registration
  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md border">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <User className="w-6 h-6" />
          Face Registration
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Employee: {employeeName} ({employeeCode})
        </p>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading face recognition models...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm text-green-800">Face registered successfully!</p>
              </div>
            ) : (
              <>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={startCamera}
                        className="bg-white text-black px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-gray-100"
                      >
                        <Camera className="w-4 h-4" />
                        Start Camera
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {faceDetected ? (
                        <span className={qualityScore > 70 ? 'text-green-400' : 'text-yellow-400'}>
                          Quality: {Math.round(qualityScore)}%
                        </span>
                      ) : (
                        <span className="text-red-400">No face detected</span>
                      )}
                    </div>
                  )}
                </div>

                {cameraActive && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(capturedSamples.length / REQUIRED_SAMPLES) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm whitespace-nowrap">
                      {capturedSamples.length} / {REQUIRED_SAMPLES} samples
                    </span>
                  </div>
                )}

                {cameraActive && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={captureSample}
                      disabled={!faceDetected || qualityScore < 60 || capturedSamples.length >= REQUIRED_SAMPLES}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Sample
                    </button>

                    <button
                      onClick={clearSamples}
                      disabled={capturedSamples.length === 0}
                      className="border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Clear All
                    </button>

                    <button
                      onClick={stopCamera}
                      className="border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50"
                    >
                      Stop Camera
                    </button>
                  </div>
                )}

                {capturedSamples.length >= REQUIRED_SAMPLES && (
                  <div className="flex items-start space-x-2 pt-4 border-t">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="consent" className="text-sm font-medium">
                        I consent to the collection and storage of my facial recognition data
                      </label>
                      <p className="text-xs text-gray-500">
                        This data will be used solely for attendance verification purposes.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={registerFace}
                    disabled={capturedSamples.length < REQUIRED_SAMPLES || !consentGiven || isRegistering}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Register Face
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancel}
                    className="border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
