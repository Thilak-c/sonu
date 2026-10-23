'use client';

import React, { useState, useEffect, forwardRef } from 'react';

const FallbackImage = forwardRef(function FallbackImage({ 
  src, 
  alt, 
  className = '', 
  style, 
  hideText = false, 
  logoSize = 'w-6 h-6',
  onError: externalOnError,
  ...props 
}, ref) {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    if (externalOnError) externalOnError();
  };

  if (hasError) {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center gap-1 bg-zinc-50 select-none"
      >
        <img 
          src="/Logo/Logo_Full.png" 
          alt="Image not available" 
          className={`${logoSize} object-contain opacity-20`}
          style={{ filter: 'grayscale(1)' }}
        />
        {!hideText && (
          <span className="text-[6.5px] tracking-wider uppercase font-semibold text-zinc-300 text-center leading-tight px-1">
            Image not available
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      key={src}
      {...props}
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  );
});

export default FallbackImage;
