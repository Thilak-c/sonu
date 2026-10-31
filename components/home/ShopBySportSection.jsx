import Link from 'next/link';

const SPORTS_CATEGORIES = [
  {
    id: 'running',
    name: 'Sport shoe',
    image: '/asset/Urban Sprint on Blue Concrete.webp',
    alt: 'SONU Sport shoe Footwear',
    link: '/running',
  },
  {
    id: 'sportswear',
    name: 'Sneaker',
    image: '/asset/Cinematic Streetwear on Concrete Steps.webp',
    alt: 'SONU Sneaker Footwear',
    link: '/sneakers',
  },
  {
    id: 'more-shoes',
    name: '',
    image: null,
    link: null,
  },
];

export default function ShopBySportSection() {
  return (
    <section
      id="shop-by-sport"
      aria-label="Shop by Sport"
      className="w-full bg-white pt-[60px] sm:pt-[80px] py-6 sm:py-8 select-none font-['Helvetica_Now_Text',sans-serif]"
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
        {SPORTS_CATEGORIES.map((sport) => {
          const CardTag = sport.link ? Link : 'div';
          return (
            <CardTag
              key={sport.id}
              {...(sport.link ? { href: sport.link } : {})}
              className="group flex-shrink-0 w-[78vw] sm:w-[320px] md:w-[360px] flex flex-col select-none cursor-pointer"
            >
              {/* Grey Product Square Box - exact match to fresh drops */}
              <div className="w-full aspect-square bg-[#f6f6f6] flex items-center justify-center overflow-hidden">
                {sport.image ? (
                  <img
                    src={sport.image}
                    alt={sport.alt}
                    className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <p
                      className="text-[20px] sm:text-[22px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      More shoes on the way
                    </p>
                  </div>
                )}
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
            </CardTag>
          );
        })}
      </div>
    </section>
  );
}
