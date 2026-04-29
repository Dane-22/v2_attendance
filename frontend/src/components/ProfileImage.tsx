'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/imageUtils';

interface ProfileImageProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  lazy?: boolean;
  fallback?: 'initials' | 'placeholder';
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt = 'Profile',
  name = '',
  size = 'md',
  className = '',
  showBorder = true,
  lazy = true,
  fallback = 'initials'
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const borderClasses = showBorder ? 'ring-2 ring-[#facc15]/30' : '';

  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0] ? names[0][0] : '';
  };

  const getPlaceholderIcon = (): string => {
    return '👤';
  };

  const handleImageLoad = (): void => {
    setIsLoading(false);
    setImgError(false);
  };

  const handleImageError = (): void => {
    setImgError(true);
    setIsLoading(false);
    setImgSrc(null);
  };

  useEffect(() => {
    // Use the image utility to get the correct URL
    const correctUrl = getImageUrl(src);
    setImgSrc(correctUrl);
    setImgError(false);
    setIsLoading(true);
  }, [src]);

  const renderFallback = (): React.ReactNode => {
    if (fallback === 'initials' && name) {
      return (
        <div 
          className={`w-full h-full rounded-full bg-[#facc15] flex items-center justify-center text-black font-bold overflow-hidden ${sizeClasses[size]}`}
        >
          <span>{getInitials(name)}</span>
        </div>
      );
    }

    return (
      <div 
        className={`w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-gray-600 ${sizeClasses[size]}`}
      >
        <span>{getPlaceholderIcon()}</span>
      </div>
    );
  };

  if (!imgSrc || imgError) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {renderFallback()}
      </div>
    );
  }

  // Validate URL before passing to Image component
  const isValidUrl = imgSrc.startsWith('http') || imgSrc.startsWith('/') || imgSrc.startsWith('data:');
  
  if (!isValidUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {renderFallback()}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-full ${sizeClasses[size]} ${borderClasses} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={!lazy}
      />
    </div>
  );
};

export default ProfileImage;
