import Link from 'next/link';
import { getAllProducts } from '@/lib/products';

export default async function FeaturedSection({ products: passedProducts }) {
  const allProducts = passedProducts !== undefined ? passedProducts : await getAllProducts();
  const featured = allProducts.filter((p) => p.featured === true);
  const items = featured.length > 0 ? featured : allProducts;

  if (!items || items.length === 0) {
    return null;
  }

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

      {/* Horizontal Carousel */}
      <div
        className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 overflow-x-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-start gap-3 sm:gap-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const id = item.slug || item.id;
          const imgUrl = item.image || item.mainImage || (item.gallery && item.gallery[0]);

          return (
            <Link
              key={id}
              href={`/product/${id}`}
              className="group flex-shrink-0 w-[78vw] sm:w-[320px] md:w-[360px] flex flex-col cursor-pointer"
            >
              {/* Grey Product Square Box */}
              <div className="w-full aspect-square  flex items-center justify-center overflow-hidden">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.alt || item.name}
                    className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#a1a1aa] text-sm">
                    No image
                  </div>
                )}
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
                <div className="flex items-center gap-2 mt-0.5">
                  <p
                    className="text-[17px] sm:text-[18px] font-medium text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {item.price}
                  </p>
                  {item.originalPrice && item.originalPrice > item.priceNumber && (
                    <span className="text-[14px] text-[#707072] line-through">
                      ₹{item.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
