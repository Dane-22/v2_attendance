'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  selectedImage: File | null;
  previewUrl: string | null;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  dragDropEnabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  selectedImage,
  previewUrl,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  className = '',
  disabled = false,
  dragDropEnabled = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (disabled) return;

    if (validateFile(file)) {
      onImageSelect(file);
    }
  }, [disabled, onImageSelect, maxSize, acceptedTypes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragDropEnabled) {
      setIsDragging(true);
    }
  }, [disabled, dragDropEnabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || !dragDropEnabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, dragDropEnabled, handleFileSelect]);

  const handleRemoveImage = () => {
    if (disabled) return;
    onImageRemove();
    setError(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (selectedImage && previewUrl) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative overflow-hidden rounded-lg border-2 border-gray-200">
          <img
            src={previewUrl}
            alt="Selected image"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p className="truncate">{selectedImage.name}</p>
          <p className="text-xs text-gray-500">
            {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-[#facc15] bg-yellow-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gray-100 rounded-full">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {dragDropEnabled ? 'Drag and drop an image here, or click to select' : 'Click to select an image'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF, or WebP (max {maxSize}MB)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
