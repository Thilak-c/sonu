import Link from 'next/link';

export default function HeroSection() {
  return (
    <section aria-label="Hero Showcase" className="w-full bg-white pb-8 select-none font-['Helvetica_Now_Text',sans-serif]">
      {/* Edge-to-Edge Hero Media Banner */}
      <div className="w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[640px] overflow-hidden bg-neutral-100 relative">
        <img
          src="/images/hero-pool.webp"
          alt="Sonu Shoe - For the long way home"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
      </div>

      {/* Nike-Style Centered Editorial Headline & CTAs */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 text-center pt-8 sm:pt-10">
        <span className="inline-block text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.2em] text-[#707072] mb-2 font-['Helvetica_Now_Text',sans-serif]">
          Sonu Shoe / Signature Drop 01
        </span>
        <h1
          className="text-[36px] sm:text-[52px] md:text-[62px] font-extrabold tracking-tight uppercase leading-[0.98] text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          FOR THE LONG WAY HOME.
        </h1>
        <p className="text-[15px] sm:text-[16.5px] text-[#707072] mt-3 sm:mt-4 max-w-[580px] mx-auto leading-relaxed font-normal">
          Small-run handcrafted luxury footwear engineered with ergonomic gum rubber soles and pebble-grain leather, built for all-day city walking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6 sm:pt-7">
          <Link
            href="/product/drop-hybrid-men"
            className="bg-[#111111] hover:bg-black active:scale-[0.98] text-white px-7 py-3 rounded-full text-[14px] sm:text-[15px] font-medium transition-all shadow-sm font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Shop The 01
          </Link>
          <Link
            href="/#fresh-drops"
            className="bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] text-[#111111] px-7 py-3 rounded-full text-[14px] sm:text-[15px] font-medium transition-all font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Explore Fresh Drops
          </Link>
        </div>
      </div>
    </section>
  );
}
