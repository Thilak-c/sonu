import Link from 'next/link';

const SPOTLIGHT_ITEMS = [
  {
    id: 'hybrid-rn',
    name: 'Hybrid RN',
    image: '/images/ad22b92Nike-HQ2593-502_1.avif',
    link: '/product/drop-hybrid-women',
  },
  {
    id: 'stealth-rn',
    name: 'Stealth RN',
    image: '/images/ad22b92Nike-HJ1101-003_1.avif',
    link: '/product/drop-hybrid-men',
  },
  {
    id: 'pure-court',
    name: 'Pure Court',
    image: '/images/1e462d9Nike-IO3815-102_1.avif',
    link: '/product/drop-court-studio',
  },
  {
    id: 'offpath-trail',
    name: 'Off-Path Trail',
    image: '/images/ad22b92Nike-IQ3439-211_1.avif',
    link: '/product/drop-offpath-trail',
  },
  {
    id: 'stride-tempo',
    name: 'Stride Tempo',
    image: '/images/ad22b92Nike-HQ3049-502_1.avif',
    link: '/product/drop-hybrid-women',
  },
  {
    id: 'aeroflex-low',
    name: 'AeroFlex Low',
    image: '/images/1e462d9Nike-IO3815-500_1.avif',
    link: '/product/drop-court-studio',
  },
  {
    id: 'refuel-bottle',
    name: 'Refuel Grip 18oz',
    image: '/images/addons/bottle.jpg',
    link: '/checkout',
  },
  {
    id: 'heritage-duffel',
    name: 'Training Duffel',
    image: '/images/addons/duffel.jpg',
    link: '/checkout',
  },
  {
    id: 'heritage-backpack',
    name: 'Heritage Pack',
    image: '/images/addons/backpack.jpg',
    link: '/checkout',
  },
];

export default function SpotlightSection() {
  return (
    <section
      id="spotlight"
      aria-label="Spotlight"
      className="w-full bg-white pt-12 sm:pt-16 pb-16 sm:pb-20 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      {/* Centered Header */}
      <div className="w-full max-w-[1440px] mx-auto px-6 text-center">
        <h2
          className="text-[34px] sm:text-[46px] md:text-[52px] font-bold text-[#111111] tracking-tight leading-none uppercase font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          SPOTLIGHT
        </h2>
        <p className="text-[15px] sm:text-[16px] text-[#707072] mt-2.5 sm:mt-3 max-w-[420px] mx-auto leading-snug font-normal">
          Signature footwear and everyday gear engineered for the long way home.
        </p>
      </div>

      {/* 3-Column Spotlight Grid with #f5f5f5 tiles */}
      <div className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
        <div className="grid grid-cols-3 gap-x-3.5 sm:gap-x-6 gap-y-7 sm:gap-y-10">
          {SPOTLIGHT_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="group flex flex-col items-center text-center cursor-pointer select-none"
            >
              {/* Product Image Area in clean #f5f5f5 box */}
              <div className="w-full aspect-square bg-[#f5f5f5] rounded-[16px] sm:rounded-[20px] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain transform group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Product Label in Helvetica Now Text */}
              <p
                className="text-[13px] sm:text-[14px] font-medium text-[#111111] mt-2.5 leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
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
