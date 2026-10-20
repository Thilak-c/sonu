import Link from 'next/link';

const SPOTLIGHT_ITEMS = [
  {
    id: 'air-jordan-1',
    name: 'Air Jordan 1',
    image: '/images/spotlight/air-jordan-1.png',
  },
  {
    id: 'air-force-1',
    name: 'Air Force 1',
    image: '/images/spotlight/air-force-1.png',
  },
  {
    id: 'graphic-tees',
    name: 'Graphic Tees',
    image: '/images/spotlight/graphic-tees.png',
  },
  {
    id: 'pegasus-premium',
    name: 'Pegasus Premium',
    image: '/images/spotlight/pegasus-premium.png',
  },
  {
    id: 'vomero-18',
    name: 'Vomero 18',
    image: '/images/spotlight/vomero-18.png',
  },
  {
    id: 'pegasus-42',
    name: 'Pegasus 42',
    image: '/images/spotlight/pegasus-42.png',
  },
  {
    id: 'slides',
    name: 'Slides',
    image: '/images/spotlight/slides.png',
  },
  {
    id: 'dunk',
    name: 'Dunk',
    image: '/images/spotlight/dunk.png',
  },
  {
    id: 'bottoms',
    name: 'Bottoms',
    image: '/images/spotlight/bottoms.png',
  },
  {
    id: 'tiempo-elite',
    name: 'Tiempo Elite',
    image: '/images/spotlight/tiempo-elite.png',
  },
  {
    id: 'caps',
    name: 'Caps',
    image: '/images/spotlight/caps.png',
  },
  {
    id: 'air-max',
    name: 'Air Max',
    image: '/images/spotlight/air-max.png',
  },
];

export default function SpotlightSection() {
  return (
    <section
      id="spotlight"
      aria-label="Spotlight"
      className="w-full bg-white pt-[80px] sm:pt-14 pb-14 sm:pb-20 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      {/* Centered Header matching screenshot */}
      <div className="w-full max-w-[1440px] mx-auto px-6 text-center">
        <h2
          className="text-[40px] sm:text-[52px] md:text-[60px] font-bold text-[#111111] tracking-tight leading-none uppercase font-['Bold',sans-serif]"
          style={{ fontFamily: "'Bold', 'Helvetica Now Text Bold', sans-serif" }}
        >
          SPOTLIGHT
        </h2>
        <p className="text-[16px] font-medium sm:text-[16px] text-[#000000] mt-2.5 sm:mt-3 max-w-[280px] sm:max-w-[420px] mx-auto leading-snug">
          Classic silhouettes and cutting-edge innovation to build your game from the ground up.
        </p>
      </div>

      {/* 3-Column Spotlight Grid strictly matching screenshot */}
      <div className="w-full max-w-[680px] sm:max-w-[780px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="grid grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-9 sm:gap-y-12">
          {SPOTLIGHT_ITEMS.map((item) => (
            <Link
              key={item.id}
              href="/checkout"
              className="group flex flex-col items-center text-center cursor-pointer select-none"
            >
              {/* Product Image Area */}
              <div className="w-full h-[95px] sm:h-[120px] md:h-[130px] flex items-center justify-center p-0.5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-full max-w-full w-auto object-contain transform scale-110 sm:scale-115 group-hover:scale-125 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Product Label in Helvetica Now Text */}
              <p
                className="text-[13px] sm:text-[14px] font-medium text-[#111111] mt-2.5 leading-tight font-['Helvetica_Now_Text',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                {item.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
