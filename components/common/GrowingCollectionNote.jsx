import React from 'react';

export default function GrowingCollectionNote({ className = '' }) {
  return (
    <section
      aria-label="A Note on Our Growing Collection"
      className={`w-full  flex flex-col items-center justify-center select-none ${className}`}
    >
      <div className="w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] px-4 transition-transform duration-300 hover:scale-[1.02] hover:-rotate-0.5">
        <img
          src="/images/growing-collection-note.png"
          alt="A New Beginning. A Growing Collection. We're just getting started! Our collection may be small for now, but our ambition is big. Our team is constantly working to bring you more styles, more choices, and the quality you deserve. New products are on the way. Stay tuned!"
          className="w-full h-auto object-contain drop-shadow-sm filter"
          loading="lazy"
        />
      </div>
    </section>
  );
}

