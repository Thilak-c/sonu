import Link from 'next/link';

export default function HeroSection() {
  return (
    <section
      aria-label="Hero Showcase"
      className="relative w-full h-[48vh] min-h-[380px] max-h-[520px] overflow-hidden bg-neutral-900 select-none flex items-end"
    >
      {/* Background Hero Image */}
      <img
        src="/images/hero-pool.webp"
        alt="SONU handcrafted footwear - The 01 Pool with ergonomic gum rubber soles"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.78] transition-transform duration-700 ease-out hover:scale-105"
        loading="eager"
      />

      {/* Subtle Gradient Overlays for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 pb-8 sm:pb-12 text-white">
        <span className="inline-block text-[11px] sm:text-[12px] uppercase tracking-[0.25em] font-medium text-neutral-300 mb-2">
          Handcrafted Footwear / Drop 01
        </span>
        <h1 className="text-[28px] sm:text-[40px] md:text-[48px] font-bold tracking-tight leading-[1.05] max-w-[680px]">
          FOR THE LONG WAY HOME.
        </h1>
        <p className="text-[14px] sm:text-[16px] text-neutral-300 mt-2 mb-5 max-w-[480px] leading-relaxed">
          Small-run sneakers with dual-density ergonomic soles and pebble-grain leather, built for all-day comfort.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/#featured"
            className="bg-white text-[#111111] hover:bg-neutral-100 active:scale-[0.98] px-6 py-3 rounded-full text-[14px] sm:text-[15px] font-medium transition-all shadow-md"
          >
            Shop The 01
          </Link>
          <Link
            href="/#fresh-drops"
            className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 active:scale-[0.98] px-6 py-3 rounded-full text-[14px] sm:text-[15px] font-medium transition-all"
          >
            Explore Drops
          </Link>
        </div>
      </div>
    </section>
  );
}
