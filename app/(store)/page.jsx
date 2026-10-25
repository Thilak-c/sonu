import HeroSection from '@/components/home/HeroSection';
import FeaturedSection from '@/components/home/FeaturedSection';
import TrendingSection from '@/components/home/TrendingSection';
import FreshDropsSection from '@/components/home/FreshDropsSection';
import ShopBySportSection from '@/components/home/ShopBySportSection';
import SpotlightSection from '@/components/home/SpotlightSection';
import LastMinuteSection from '@/components/home/LastMinuteSection';

export const metadata = {
  title: 'SONU — For the Long Way Home | Handcrafted Footwear',
  description:
    'Small-run, handcrafted footwear designed with ergonomic gum rubber soles, full-grain leather, and all-day comfort. Explore the 01, runners, and fresh drops.',
  keywords: [
    'handcrafted footwear',
    'small-run sneakers',
    'ergonomic comfort',
    'premium soles',
    'minimalist luxury shoe',
    'for the long way home',
    'Sonu shoe',
    'city walking footwear',
  ],
  openGraph: {
    title: 'Sonu shoe — For the Long Way Home',
    description:
      'Discover handcrafted footwear engineered in limited runs for maximum walking comfort and timeless street minimalism.',
    url: 'https://sonushoe.in',
    images: ['/Logo/Logo_Full.png'],
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://sonushoe.in/#organization',
        name: 'Sonu shoe',
        url: 'https://sonushoe.in',
        logo: 'https://sonushoe.in/Logo/Logo_Full.png',
        slogan: 'For the long way home',
        description:
          'Small-run handcrafted luxury footwear engineered with ergonomic comfort and timeless minimalism.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://sonushoe.in/#website',
        url: 'https://sonushoe.in',
        name: 'Sonu shoe',
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
        {/* 1. Hero Section (40-50% VH) */}
        <HeroSection />

        {/* 2. Featured Section (40-50% VH) */}
        <FeaturedSection />

        {/* 3. Trending Section (40-50% VH) */}
        <TrendingSection />

        {/* 4. Fresh Drops Section (40-50% VH) */}
        <FreshDropsSection />

        {/* 5. Shop by Sport Section (40-50% VH) */}
        <ShopBySportSection />

        {/* 6. Spotlight Section */}
        <SpotlightSection />

        {/* 7. Last Minute Addition (copied from Bag page) */}
        <LastMinuteSection />
      </div>
    </>
  );
}
