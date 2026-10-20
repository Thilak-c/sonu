import Link from 'next/link';

const FEATURED_ITEMS = [
  {
    id: 'sonu-01-pool',
    name: 'The 01',
    subtitle: 'Low Profile Classic',
    colorway: 'Pool',
    price: '₹8,900',
    tag: 'Signature Run',
    image: '/images/model-01-low.webp',
    alt: 'The 01 Pool handcrafted teal leather sneaker',
  },
  {
    id: 'sonu-02-clay',
    name: 'The 02',
    subtitle: 'Lightweight City Runner',
    colorway: 'Clay',
    price: '₹9,400',
    tag: 'Trending',
    image: '/images/model-02-runner.webp',
    alt: 'The 02 Clay orange suede and breathable mesh trainer',
  },
  {
    id: 'sonu-03-court',
    name: 'The 03',
    subtitle: 'Vulcanized Court Shoe',
    colorway: 'White Court',
    price: '₹8,200',
    tag: 'Essentials',
    image: '/images/model-03-court.webp',
    alt: 'The 03 Court white canvas sneaker with vulcanized gum sole',
  },
  {
    id: 'sonu-04-trail',
    name: 'The 04',
    subtitle: 'All-Terrain Comfort',
    colorway: 'Forest Gum',
    price: '₹9,800',
    tag: 'New Drop',
    image: '/images/model-04-trail.webp',
    alt: 'The 04 Trail off-path ergonomic outdoor footwear',
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
            href="/checkout"
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
