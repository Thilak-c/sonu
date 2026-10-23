import Link from 'next/link';

const SPORTS_CATEGORIES = [
  {
    id: 'running',
    name: 'Running',
    image: '/asset/Urban Sprint on Blue Concrete.webp',
    alt: 'SONU Running Footwear',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    image: '/asset/Intense Indoor Basketball Drive.webp',
    alt: 'SONU Basketball Footwear',
  },
  {
    id: 'sportswear',
    name: 'Sportswear',
    image: '/asset/Cinematic Streetwear on Concrete Steps.webp',
    alt: 'SONU Sportswear Footwear',
  },
  {
    id: 'training',
    name: 'Training',
    image: '/asset/Industrial Overpass Barbell Split Squat.webp',
    alt: 'SONU Training Footwear',
  },
];

export default function ShopBySportSection() {
  return (
    <section
      id="shop-by-sport"
      aria-label="Shop by Sport"
      className="w-full bg-white pt-[80px] py-6 sm:py-8 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      {/* Section Header */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-3 sm:mb-4">
        <h2
          className="text-[26px] sm:text-[30px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Shop by Sport
        </h2>
      </div>

      {/* Horizontal Carousel */}
      <div
        className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 overflow-x-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-start gap-3 sm:gap-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {SPORTS_CATEGORIES.map((sport) => (
          <Link
            key={sport.id}
            href="/checkout"
            className="group flex-shrink-0 w-[78vw] sm:w-[320px] md:w-[360px] flex flex-col cursor-pointer"
          >
            {/* Grey Product Square Box - exact match to fresh drops */}
            <div className="w-full aspect-square bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
              <img
                src={sport.image}
                alt={sport.alt}
                className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Single line sport name below image */}
            <div className="pt-3 text-left">
              <p
                className="text-[20px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {sport.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
