'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crop, RotateCw, Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
  className?: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  onCrop,
  onCancel,
  aspectRatio = 1, // Square by default
  className = ''
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const image = imageRef.current;
      const container = containerRef.current;
      
      // Wait for image to load
      const handleImageLoad = () => {
        const containerRect = container.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        
        // Calculate initial crop area (centered, 80% of container)
        const size = Math.min(containerRect.width, containerRect.height) * 0.8;
        const x = (containerRect.width - size) / 2;
        const y = (containerRect.height - size) / 2;
        
        setCropArea({ x, y, width: size, height: size });
      };
      
      image.addEventListener('load', handleImageLoad);
      
      return () => {
        image.removeEventListener('load', handleImageLoad);
      };
    }
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragStart({
          x: e.clientX - cropArea.x,
          y: e.clientY - cropArea.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep crop area within bounds
      const maxX = rect.width - cropArea.width;
      const maxY = rect.height - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } else if (isResizing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;
      
      switch (resizeHandle) {
        case 'nw':
          newWidth = cropArea.x + cropArea.width - mouseX;
          newHeight = newWidth / aspectRatio;
          newX = mouseX;
          newY = cropArea.y + cropArea.height - newHeight;
          break;
        case 'ne':
          newWidth = mouseX - cropArea.x;
          newHeight = newWidth / aspectRatio;
          newY = cropArea.y + cropArea.height - newHeight;
          break;
        case 'sw':
          newWidth = cropArea.x + cropArea.width - mouseX;
          newHeight = newWidth / aspectRatio;
          newX = mouseX;
          break;
        case 'se':
          newWidth = mouseX - cropArea.x;
          newHeight = newWidth / aspectRatio;
          break;
      }
      
      // Minimum size
      const minSize = 50;
      if (newWidth >= minSize && newHeight >= minSize) {
        setCropArea({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to crop area size
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    // Calculate the actual image dimensions and position
    const imageRect = image.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;
    
    const scaleX = image.naturalWidth / imageRect.width;
    const scaleY = image.naturalHeight / imageRect.height;
    
    const sourceX = (cropArea.x - imageRect.left + containerRect.left) * scaleX;
    const sourceY = (cropArea.y - imageRect.top + containerRect.top) * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;
    
    // Draw cropped image
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, cropArea.width, cropArea.height);
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: imageFile.type,
          lastModified: Date.now()
        });
        onCrop(croppedFile);
      }
    }, imageFile.type, 0.9);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Crop Image</h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cropper Area */}
        <div className="p-6">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ height: '400px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop target"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}
            
            {/* Crop Area Overlay */}
            <div
              className="absolute border-2 border-[#facc15] cursor-move"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Dark overlay outside crop area */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50" />
              </div>
              
              {/* Resize handles */}
              <div
                className="absolute w-3 h-3 bg-[#facc15] border-2 border-white cursor-nw-resize"
                style={{ top: '-6px', left: '-6px' }}
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute w-3 h-3 bg-[#facc15] border-2 border-white cursor-ne-resize"
                style={{ top: '-6px', right: '-6px' }}
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute w-3 h-3 bg-[#facc15] border-2 border-white cursor-sw-resize"
                style={{ bottom: '-6px', left: '-6px' }}
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                className="absolute w-3 h-3 bg-[#facc15] border-2 border-white cursor-se-resize"
                style={{ bottom: '-6px', right: '-6px' }}
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Drag to move, drag corners to resize
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <Crop className="w-4 h-4" />
            Crop
          </button>
        </div>
      </div>
      
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageCropper;
