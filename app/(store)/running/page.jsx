import React from 'react';
import { getAllProducts } from '@/lib/products';
import RunningCollectionClient from '@/components/running/RunningCollectionClient';

export const revalidate = 60;

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.com';
  const canonicalUrl = `${siteUrl}/running`;

  return {
    title: 'Sonu Shoe-Running | Handcrafted Road & Trail Running Shoes',
    description:
      'Explore the official Sonu Shoe-Running collection. Handcrafted small-run sneakers engineered with ergonomic comfort soles, high-rebound cushioning, and breathable lightweight uppers for the long way home.',
    keywords: [
      'Sonu Shoe-Running',
      'running shoes',
      'handcrafted footwear',
      'small-run sneakers',
      'ergonomic comfort',
      'premium soles',
      'road running shoes',
      'trail running footwear',
      'for the long way home',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Sonu Shoe-Running | Handcrafted Road & Trail Running Shoes',
      description:
        'Explore the official Sonu Shoe-Running collection. Engineered with ergonomic comfort soles, high-rebound cushioning, and lightweight breathability.',
      url: canonicalUrl,
      siteName: 'SONU',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/asset/Urban%20Sprint%20on%20Blue%20Concrete.webp`,
          width: 1200,
          height: 630,
          alt: 'Sonu Shoe-Running Collection',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sonu Shoe-Running | Handcrafted Road & Trail Running Shoes',
      description:
        'Explore the official Sonu Shoe-Running collection. Handcrafted small-run sneakers engineered with ergonomic comfort soles and high-rebound cushioning.',
      images: [`${siteUrl}/asset/Urban%20Sprint%20on%20Blue%20Concrete.webp`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Curated Running Catalog matching user's reference design
const CURATED_RUNNING_SHOES = [
  {
    id: 'nike-pegasus-42-white-green',
    slug: 'nike-pegasus-42-white-green',
    name: 'Nike Pegasus 42',
    category: "Men's Road-Running Shoes",
    gender: 'men',
    price: '₹10,396',
    priceNumber: 10396,
    originalPrice: 12995,
    discountPercent: 20,
    image: '/images/ad22b92Nike-HJ1101-003_1.avif',
    alt: 'Nike Pegasus 42 Road-Running Shoes White and Green',
    color: 'White',
    colorHex: '#ffffff',
    colorways: ['nike-pegasus-42-black-red'],
    colorDots: [
      { name: 'White', hex: '#ffffff', border: true },
      { name: 'Black', hex: '#111111' },
    ],
  },
  {
    id: 'nike-pegasus-42-black-red',
    slug: 'nike-pegasus-42-black-red',
    name: 'Nike Pegasus 42',
    category: "Men's Road-Running Shoes",
    gender: 'men',
    price: '₹12,995',
    priceNumber: 12995,
    originalPrice: null,
    discountPercent: 0,
    image: '/images/1e462d9Nike-IO3815-102_1.avif',
    alt: 'Nike Pegasus 42 Road-Running Shoes Black and Red',
    color: 'Black',
    colorHex: '#111111',
    colorways: ['nike-pegasus-42-white-green'],
    colorDots: [
      { name: 'Black', hex: '#111111' },
      { name: 'White', hex: '#ffffff', border: true },
    ],
  },
  {
    id: 'nike-structure-26-white-blue',
    slug: 'nike-structure-26-white-blue',
    name: 'Nike Structure 26',
    category: "Men's Road Running Shoes",
    gender: 'men',
    price: '₹11,895',
    priceNumber: 11895,
    originalPrice: 13995,
    discountPercent: 15,
    image: '/images/ad22b92Nike-HQ2593-502_1.avif',
    alt: 'Nike Structure 26 Road Running Shoes White and Blue Gradient',
    color: 'White',
    colorHex: '#ffffff',
    colorDots: [
      { name: 'White', hex: '#ffffff', border: true },
      { name: 'Grey', hex: '#6f7276' },
    ],
  },
  {
    id: 'nike-pegasus-42-women-black',
    slug: 'nike-pegasus-42-women-black',
    name: 'Nike Pegasus 42',
    category: "Women's Road-Running Shoes",
    gender: 'women',
    price: '₹12,995',
    priceNumber: 12995,
    originalPrice: null,
    discountPercent: 0,
    image: '/images/ad22b92Nike-HQ3049-502_1.avif',
    alt: 'Nike Pegasus 42 Women Road-Running Shoes Black and White',
    color: 'Black',
    colorHex: '#111111',
    colorDots: [
      { name: 'Black', hex: '#111111' },
      { name: 'White', hex: '#ffffff', border: true },
      { name: 'Grey', hex: '#6f7276' },
    ],
  },
  {
    id: 'nike-vomero-17-women',
    slug: 'nike-vomero-17-women',
    name: 'Nike Vomero 17',
    category: "Women's Road-Running Shoes",
    gender: 'women',
    price: '₹13,295',
    priceNumber: 13295,
    originalPrice: 15995,
    discountPercent: 17,
    image: '/images/1e462d9Nike-IO3815-500_1.avif',
    alt: 'Nike Vomero 17 Women Road-Running Shoes Lavender White',
    color: 'Purple',
    colorHex: '#7c3aed',
    colorDots: [
      { name: 'White', hex: '#ffffff', border: true },
      { name: 'Grey', hex: '#6f7276' },
    ],
  },
  {
    id: 'nike-star-runner-4-kids',
    slug: 'nike-star-runner-4-kids',
    name: 'Nike Star Runner 4',
    category: "Kids' Road Running Shoes",
    gender: 'kids',
    price: '₹3,995',
    priceNumber: 3995,
    originalPrice: 4995,
    discountPercent: 20,
    image: '/images/ad22b92Nike-IQ3439-211_1.avif',
    alt: 'Nike Star Runner 4 Kids Running Shoes',
    color: 'Black',
    colorHex: '#111111',
    colorDots: [
      { name: 'Black', hex: '#111111' },
      { name: 'White', hex: '#ffffff', border: true },
    ],
  },
  {
    id: 'nike-infinityrn-4-men',
    slug: 'nike-infinityrn-4-men',
    name: 'Nike InfinityRN 4',
    category: "Men's Road-Running Shoes",
    gender: 'men',
    price: '₹14,995',
    priceNumber: 14995,
    originalPrice: null,
    discountPercent: 0,
    image: '/images/model-02-runner.webp',
    alt: 'Nike InfinityRN 4 Men Road-Running Shoes',
    color: 'White',
    colorHex: '#ffffff',
    colorDots: [
      { name: 'White', hex: '#ffffff', border: true },
      { name: 'Green', hex: '#00c853' },
      { name: 'Black', hex: '#111111' },
    ],
  },
  {
    id: 'nike-revolution-7-kids',
    slug: 'nike-revolution-7-kids',
    name: 'Nike Revolution 7',
    category: "Kids' Running Shoes",
    gender: 'kids',
    price: '₹3,495',
    priceNumber: 3495,
    originalPrice: 3995,
    discountPercent: 13,
    image: '/images/products/hybrid-purple-thumb.png',
    alt: 'Nike Revolution 7 Kids Running Shoes Purple',
    color: 'Purple',
    colorHex: '#7c3aed',
    colorDots: [
      { name: 'Purple', hex: '#7c3aed' },
      { name: 'White', hex: '#ffffff', border: true },
    ],
  },
];

export default async function RunningPage() {
  const dbProducts = await getAllProducts();

  // Map any running-related or live DB products
  const formattedDbRunning = (dbProducts || [])
    .filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sport = (p.sport || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        cat.includes('run') ||
        sport.includes('run') ||
        name.includes('run') ||
        cat.includes('road')
      );
    })
    .map((p) => {
      // Determine color dots
      let dots = [];
      if (Array.isArray(p.colorDots) && p.colorDots.length > 0) {
        dots = p.colorDots;
      } else if (p.colorHex) {
        dots = [{ name: p.color || 'Tone', hex: p.colorHex, border: p.colorHex.toLowerCase() === '#ffffff' }];
      } else {
        dots = [
          { name: 'White', hex: '#ffffff', border: true },
          { name: 'Black', hex: '#111111' },
          { name: 'Grey', hex: '#6f7276' },
        ];
      }

      return {
        ...p,
        category: p.category || "Men's Road-Running Shoes",
        gender: p.gender || 'men',
        colorDots: dots,
      };
    });

  // Combine DB products with curated catalog (prioritizing DB products if slugs match)
  const dbSlugs = new Set(formattedDbRunning.map((p) => p.slug || p.id));
  const fallbackCurated = CURATED_RUNNING_SHOES.filter(
    (c) => !dbSlugs.has(c.slug) && !dbSlugs.has(c.id)
  );

  const allRunningProducts = [...formattedDbRunning, ...fallbackCurated];

  // Schema.org Structured Data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.com';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Running',
        item: `${siteUrl}/running`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Sonu Shoe-Running Footwear Collection',
    description: 'High-performance road and trail running shoes engineered for ergonomic comfort and endurance.',
    itemListElement: allRunningProducts.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        image: p.image?.startsWith('http') ? p.image : `${siteUrl}${p.image}`,
        description: p.description || `${p.name} - ${p.category}`,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: p.priceNumber,
          availability: 'https://schema.org/InStock',
          url: `${siteUrl}/product/${p.slug || p.id}`,
        },
      },
    })),
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <RunningCollectionClient initialProducts={allRunningProducts} />
    </main>
  );
}
