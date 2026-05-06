'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  showDownload?: boolean;
  showRotate?: boolean;
  onDownload?: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Image preview',
  isOpen,
  onClose,
  className = '',
  showDownload = true,
  showRotate = false,
  onDownload
}) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = src;
      link.download = alt.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg';
      link.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
      case '_':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotate();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm ${className}`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg ring-1 ring-white/20 transition-colors hover:bg-black/85 sm:right-4 sm:top-4"
          title="Close (Esc)"
          aria-label="Close image preview"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-3 bg-black/50 p-3 pr-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 sm:pr-20">
          <div className="min-w-0 flex items-center gap-2">
            <h3 className="truncate pr-2 text-sm font-medium text-white sm:text-base">{alt}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="min-w-[3rem] px-2 text-center text-sm text-white">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            {/* Rotate Button */}
            {showRotate && (
              <button
                onClick={handleRotate}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
                title="Rotate (R)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            
            {/* Download Button */}
            {showDownload && (
              <button
                onClick={handleDownload}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="relative flex-1 overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`
            }}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/50 px-3 py-3 text-center sm:px-4 sm:py-4">
          <div className="space-y-1 text-xs text-white sm:text-sm">
            <p>Drag to pan • Scroll to zoom • ESC to close</p>
            <p className="text-[11px] text-gray-400 sm:text-xs">
              {showRotate && 'R to rotate • '}
              +/- to zoom • Double-click to reset
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
