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
