import Link from 'next/link';

const TRENDING_STORIES = [
  {
    id: 'trending-1',
    eyebrow: 'Most Wanted',
    title: 'Speed & Kinetic Return',
    description: 'Propulsive speed tuned for interval training with responsive bounce cushioning.',
    image: '/images/ad22b92Nike-HQ3049-502_1.avif',
    cta: 'Shop Stride Tempo',
    link: '/product/drop-stride-tempo',
    alt: 'SONU Stride Tempo running shoes in aster pink and violet',
  },
  {
    id: 'trending-2',
    eyebrow: 'All-Day Commute',
    title: 'Adaptive AeroFlex Comfort',
    description: 'Zero break-in period. Cushioned dual-density foam built for 15,000 daily steps.',
    image: '/images/1e462d9Nike-IO3815-500_1.avif',
    cta: 'Shop AeroFlex',
    link: '/product/drop-aeroflex-violet',
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
      className="w-full h-[48vh] min-h-[380px] max-h-[500px] bg-white border-b border-neutral-100 flex flex-col justify-between py-6 select-none"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#111111] tracking-tight">
            Trending Now
          </h2>
          <p className="text-[13px] text-[#707072] mt-0.5">
            What the city is walking in this week.
          </p>
        </div>
        <span className="text-[12px] uppercase font-bold tracking-widest text-[#707072]">
          Trending 2026
        </span>
      </div>

      {/* Cards row */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 flex-1 overflow-x-auto no-scrollbar flex items-stretch gap-4 sm:gap-6 pb-2">
        {TRENDING_STORIES.map((story) => (
          <div
            key={story.id}
            className="group relative flex-shrink-0 w-[280px] sm:w-[360px] md:w-[380px] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-end p-5 bg-neutral-900"
          >
            <img
              src={story.image}
              alt={story.alt}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.75] group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

            <div className="relative z-10 text-white">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-neutral-300">
                {story.eyebrow}
              </span>
              <h3 className="text-[18px] sm:text-[20px] font-bold leading-tight mt-1 mb-1.5">
                {story.title}
              </h3>
              <p className="text-[12px] sm:text-[13px] text-neutral-300 line-clamp-2 mb-4 leading-snug">
                {story.description}
              </p>
              <Link
                href={story.link}
                className="inline-block bg-white text-[#111111] hover:bg-neutral-100 active:scale-[0.98] text-[13px] font-medium px-4 py-2 rounded-full transition-all"
              >
                {story.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
