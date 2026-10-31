import Link from 'next/link';
import { getDb } from '@/lib/mongodb';
import HeroMediaSlider from './HeroMediaSlider';

const DEFAULT_HOMEPAGE = {
  heroImage: '/images/hero-first-day-1000-orders.webp',
  heroImages: [
    '/images/hero-first-day-1000-orders.webp',
    '/images/hero-new-website-offers.webp',
  ],
  eyebrowTag: 'Sonu Shoe / Special Launch Drop',
  headline: 'FIRST DAY 1,000 ORDERS!',
  description:
    'Small-run handcrafted luxury footwear engineered with ergonomic gum rubber soles and pebble-grain leather, built for all-day city walking.',
  primaryBtnText: 'Shop The Drop',
  primaryBtnLink: '/#fresh-drops',
  secondaryBtnText: 'Explore Running',
  secondaryBtnLink: '/running',
};

export default async function HeroSection() {
  let homepage = DEFAULT_HOMEPAGE;
  try {
    const db = await getDb();
    const doc = await db.collection('settings').findOne({ _id: 'homepage_settings' });
    if (doc) {
      homepage = { ...DEFAULT_HOMEPAGE, ...doc };
    }
  } catch (err) {
    // fallback gracefully to default values
  }

  const images = Array.isArray(homepage.heroImages) && homepage.heroImages.length > 0
    ? homepage.heroImages
    : [homepage.heroImage || '/images/hero-first-day-1000-orders.webp'];

  return (
    <section aria-label="Hero Showcase" className="w-full bg-white pt-0 sm:pt-4 pb-8 select-none font-['Helvetica_Now_Text',sans-serif]">
      {/* Full-bleed on mobile, centered & contained on desktop */}
      <div className="w-full px-0 sm:px-6">
        <HeroMediaSlider images={images} alt={homepage.headline || 'Sonu Shoe'} />
      </div>

    
    </section>
  );
}
