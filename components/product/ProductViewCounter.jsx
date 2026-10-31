'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function ProductViewCounter({ slug, className = '' }) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/views?path=/product/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && typeof data.views === 'number') {
          setViews(data.views);
        }
      })
      .catch(() => {});
  }, [slug]);

  if (views === null) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f4f5] text-[#555555] text-[12px] sm:text-[12.5px] font-medium select-none ${className}`}>
      <Eye className="w-3.5 h-3.5 text-[#707072]" />
      <span>{views.toLocaleString('en-IN')} {views === 1 ? 'view' : 'views'}</span>
    </div>
  );
}

