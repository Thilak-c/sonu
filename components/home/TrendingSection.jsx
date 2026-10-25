import Link from 'next/link';

const TRENDING_STORIES = [
  {
    id: 'trending-1',
    eyebrow: 'Most Wanted',
    title: 'Speed & Kinetic Return',
    description: 'Propulsive speed tuned for interval training with responsive bounce cushioning.',
    image: '/images/ad22b92Nike-HQ3049-502_1.avif',
    cta: 'Shop Stride Tempo',
    link: '/product/drop-hybrid-women',
    alt: 'SONU Stride Tempo running shoes in aster pink and violet',
  },
  {
    id: 'trending-2',
    eyebrow: 'All-Day Commute',
    title: 'Adaptive AeroFlex Comfort',
    description: 'Zero break-in period. Cushioned dual-density foam built for 15,000 daily steps.',
    image: '/images/1e462d9Nike-IO3815-500_1.avif',
    cta: 'Shop AeroFlex',
    link: '/product/drop-court-studio',
    alt: 'SONU AeroFlex lightweight training shoes in lilac bloom',
  },
  {
    id: 'trending-3',
    eyebrow: 'Urban Durability',
    title: 'Stealth Tarmac Traction',
    description: 'Multi-surface wet pavement grip with hand-finished calfskin leather trim.',
    image: '/images/ad22b92Nike-HJ1101-003_1.avif',
    cta: 'Shop Stealth RN',
    link: '/product/drop-hybrid-men',
    alt: 'SONU Stealth RN black and metallic silver running sneaker',
  },
];

export default function TrendingSection() {
  return (
    <section
      id="trending"
      aria-label="Trending Footwear"
      className="w-full bg-white py-6 sm:py-8 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      {/* Section Header */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-3 sm:mb-4 flex items-center justify-between">
        <h2
          className="text-[26px] sm:text-[30px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Trending Now
        </h2>
      </div>

      {/* Horizontal Carousel */}
      <div
        className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 overflow-x-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-start gap-4 sm:gap-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TRENDING_STORIES.map((story) => (
          <Link
            key={story.id}
            href={story.link}
            className="group flex-shrink-0 w-[80vw] sm:w-[420px] md:w-[460px] flex flex-col cursor-pointer"
          >
            {/* Visual Box */}
            <div className="w-full aspect-[4/3] bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
              <img
                src={story.image}
                alt={story.alt}
                className="w-full h-auto object-contain p-6 transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Story Details */}
            <div className="pt-3.5 flex flex-col text-left">
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#707072]">
                {story.eyebrow}
              </span>
              <h3
                className="text-[19px] sm:text-[21px] font-bold text-[#111111] mt-1 leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {story.title}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 leading-relaxed">
                {story.description}
              </p>
              <div className="pt-3">
                <span className="inline-block text-[14px] font-medium text-[#111111] underline underline-offset-4 group-hover:text-[#707072] transition-colors">
                  {story.cta} &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
