import HeroSection from '@/components/home/HeroSection';
import FeaturedSection from '@/components/home/FeaturedSection';
import TrendingSection from '@/components/home/TrendingSection';
import FreshDropsSection from '@/components/home/FreshDropsSection';
import ShopBySportSection from '@/components/home/ShopBySportSection';
import SpotlightSection from '@/components/home/SpotlightSection';
import LastMinuteSection from '@/components/home/LastMinuteSection';
import { getAllProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Sonu Shoe — For the Long Way Home',
  description:
    'Small-run, handcrafted shoes designed with ergonomic gum rubber soles, full-grain leather, and all-day comfort. Explore the 01, runners, and fresh drops.',
  keywords: [
    'handcrafted shoes',
    'small-run sneakers',
    'ergonomic comfort',
    'premium soles',
    'minimalist luxury shoe',
    'for the long way home',
    'Sonu Shoe',
    'city walking shoes',
  ],
  openGraph: {
    title: 'Sonu Shoe — For the Long Way Home',
    description:
      'Discover handcrafted shoes engineered in limited runs for maximum walking comfort and timeless street minimalism.',
    url: 'https://sonushoe.in',
    images: ['/Logo/Logo_Full.png'],
  },
};

export default async function HomePage() {
  const products = await getAllProducts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://sonushoe.in/#organization',
        name: 'Sonu Shoe',
        url: 'https://sonushoe.in',
        logo: 'https://sonushoe.in/Logo/Logo_Full.png',
        slogan: 'For the long way home',
        description:
          'Small-run handcrafted luxury shoes engineered with ergonomic comfort and timeless minimalism.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://sonushoe.in/#website',
        url: 'https://sonushoe.in',
        name: 'Sonu Shoe',
        publisher: {
          '@id': 'https://sonushoe.in/#organization',
        },
      },
    ],
  };

  return (
    <>
      {/* Schema.org SSR JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full bg-white flex flex-col font-['Helvetica_Now_Text',sans-serif]">
        {/* Empty state when no products in DB yet */}
        {products.length === 0 && (
          <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-20 text-center">
            <span className="text-[12px] tracking-[0.2em] uppercase font-medium text-[#707072] block mb-2 font-['Helvetica_Now_Text_Medium',sans-serif]">
              New Drop Coming Soon
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]">
              Crafted in Small Runs.
            </h1>
            <p className="text-[15px] sm:text-[16px] text-[#707072] mt-3 max-w-md mx-auto leading-relaxed">
              Our handcrafted shoes are currently in preparation. Add products through the admin panel to populate your store catalog.
            </p>
          </div>
        )}

        {/* 1. Hero Showcase (Editable via Admin Settings) */}
        <HeroSection />

        {/* 2. Featured Section (from DB) */}
        {products.length > 0 && <FeaturedSection products={products} />}

        {/* 4. Fresh Drops Section (from DB) */}
        {products.length > 0 && <FreshDropsSection products={products} />}

        {/* 5. Shop by Sport Section */}
        <ShopBySportSection />

        {/* 7. Last Minute Addition */}
        <LastMinuteSection />
      </div>
    </>
  );
}
