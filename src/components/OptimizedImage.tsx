// src/components/OptimizedImage.tsx

import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loadingClass?: string;
  errorClass?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  loadingClass = 'bg-gray-100 animate-pulse',
  errorClass = 'bg-gray-200',
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    
    // Don't try to load empty or placeholder URLs
    if (!src || src === 'No Image' || src === fallbackSrc) {
      setImgSrc(fallbackSrc);
      setLoading(false);
      setError(true);
      return;
    }
    
    // Create new image object to preload
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setImgSrc(fallbackSrc);
      setLoading(false);
      setError(true);
    };
    
    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);
  
  const getClassName = () => {
    if (loading) return `${className} ${loadingClass}`;
    if (error) return `${className} ${errorClass}`;
    return className;
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={getClassName()}
      loading="lazy"
    />
  );
};

export default OptimizedImage;