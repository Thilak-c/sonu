import Link from 'next/link';

const FEATURED_ITEMS = [
  {
    id: 'sonu-hybrid-women',
    name: 'SONU Hybrid RN',
    subtitle: 'Road Running Shoe',
    colorway: 'Vivid Purple',
    price: '₹13,995',
    tag: 'Signature Run',
    image: '/images/ad22b92Nike-HQ2593-502_1.avif',
    alt: 'SONU Hybrid RN road running shoe in vivid purple',
    link: '/product/drop-hybrid-women',
  },
  {
    id: 'sonu-stealth-rn',
    name: 'SONU Stealth RN',
    subtitle: 'High-Tempo Runner',
    colorway: 'Black / Chrome',
    price: '₹13,995',
    tag: 'Trending',
    image: '/images/ad22b92Nike-HJ1101-003_1.avif',
    alt: 'SONU Stealth RN road running shoe in black and smoke grey',
    link: '/product/drop-hybrid-men',
  },
  {
    id: 'sonu-pure-low',
    name: 'SONU Pure Low',
    subtitle: 'Everyday Court Shoe',
    colorway: 'Pure White',
    price: '₹11,495',
    tag: 'Essentials',
    image: '/images/1e462d9Nike-IO3815-102_1.avif',
    alt: 'SONU Pure Low minimalist white leather shoe',
    link: '/product/drop-court-studio',
  },
  {
    id: 'sonu-offpath-trail',
    name: 'SONU Off-Path Trail',
    subtitle: 'All-Terrain Traction',
    colorway: 'Earth Brown',
    price: '₹14,995',
    tag: 'New Drop',
    image: '/images/ad22b92Nike-IQ3439-211_1.avif',
    alt: 'SONU Off-Path Trail outdoor sneaker in earth brown',
    link: '/product/drop-offpath-trail',
  },
];

export default function FeaturedSection() {
  return (
    <section
      id="featured"
      aria-label="Featured Footwear"
      className="w-full h-[48vh] min-h-[380px] max-h-[500px] bg-white border-b border-neutral-100 flex flex-col justify-between py-6 select-none"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#111111] tracking-tight">
            Featured
          </h2>
          <p className="text-[13px] text-[#707072] mt-0.5">
            Signature silhouettes crafted in small batches.
          </p>
        </div>
        <Link
          href="/#trending"
          className="text-[13px] sm:text-[14px] font-medium text-[#111111] hover:text-[#707072] transition-colors"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Horizontal Carousel */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 flex-1 overflow-x-auto no-scrollbar flex items-stretch gap-4 sm:gap-6 pb-2">
        {FEATURED_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.link || '/checkout'}
            className="group flex-shrink-0 w-[240px] sm:w-[280px] bg-[#f7f7f7] rounded-2xl p-4 flex flex-col justify-between hover:bg-[#f1f1f1] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white text-[#111111] px-2.5 py-1 rounded-full shadow-xs">
                {item.tag}
              </span>
              <span className="text-[13px] font-medium text-[#111111]">
                {item.price}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-28 sm:h-36 object-contain transform group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            <div className="pt-2 border-t border-neutral-200/50 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-[#111111] leading-none">
                  {item.name}
                </p>
                <p className="text-[12px] text-[#707072] mt-0.5">
                  {item.colorway} • {item.subtitle}
                </p>
              </div>
              <span className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                +
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
