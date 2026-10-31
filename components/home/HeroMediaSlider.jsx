'use client';

import { useState, useEffect, useRef } from 'react';

export default function HeroMediaSlider({ images = [], alt = 'Sonu Shoe' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const validImages = Array.isArray(images) && images.length > 0
    ? images
    : ['/images/hero-first-day-1000-orders.webp'];

  // Auto-slide every 10 seconds if multiple images
  useEffect(() => {
    if (validImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [validImages.length]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  return (
    <div
      className="w-full sm:max-w-[620px] sm:mx-auto relative overflow-hidden select-none sm:rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div
        className="w-full flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {validImages.map((src, idx) => (
          <div key={idx} className="w-full flex-shrink-0">
            <img
              src={src}
              alt={`${alt} - Slide ${idx + 1}`}
              className="w-full h-auto block"
              loading={idx === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

    </div>
  );
}

