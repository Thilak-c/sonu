import Link from 'next/link';
import { FRESH_DROPS } from './freshDropsData';

const FEATURED_ITEMS = [...FRESH_DROPS].reverse();

export default function FeaturedSection() {
  return (
    <section
      id="featured"
      aria-label="Featured Footwear"
      className="w-full bg-white py-6 sm:py-8 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      {/* Section Header */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-3 sm:mb-4 flex items-center justify-between">
        <h2
          className="text-[26px] sm:text-[30px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Featured
        </h2>
      </div>

      {/* Horizontal Carousel (loaded in reversed 5-4-3-2-1 order) */}
      <div
        className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 overflow-x-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-start gap-3 sm:gap-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FEATURED_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="group flex-shrink-0 w-[78vw] sm:w-[320px] md:w-[360px] flex flex-col cursor-pointer"
          >
            {/* Grey Product Square Box */}
            <div className="w-full aspect-square bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Product Details Block */}
            <div className="pt-3 flex flex-col text-left">
              <h3
                className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {item.name}
              </h3>
              <p className="text-[15px] sm:text-[16px] text-[#707072] mt-0.5 leading-tight">
                {item.category}
              </p>
              <p
                className="text-[17px] sm:text-[18px] font-medium text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {item.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

