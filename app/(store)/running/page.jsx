import React from 'react';
import { getAllProducts } from '@/lib/products';
import RunningCollectionClient from '@/components/running/RunningCollectionClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.in';
  const canonicalUrl = `${siteUrl}/running`;

  return {
    title: 'Sonu Shoe — Sport Shoe & Running Collection',
    description:
      'Explore the official Sonu Shoe collection. Handcrafted small-run sneakers engineered with ergonomic comfort soles, high-rebound cushioning, and breathable lightweight uppers for the long way home.',
    keywords: [
      'Sonu Shoe',
      'sport shoes',
      'running shoes',
      'handcrafted footwear',
      'small-run sneakers',
      'ergonomic comfort',
      'premium soles',
      'road running shoes',
      'for the long way home',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Sonu Shoe — Sport Shoe & Running Collection',
      description:
        'Explore the official Sonu Shoe collection. Engineered with ergonomic comfort soles, high-rebound cushioning, and lightweight breathability.',
      url: canonicalUrl,
      siteName: 'SONU',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/asset/Urban%20Sprint%20on%20Blue%20Concrete.webp`,
          width: 1200,
          height: 630,
          alt: 'Sonu Shoe Collection',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sonu Shoe — Sport Shoe & Running Collection',
      description:
        'Explore the official Sonu Shoe collection. Handcrafted small-run sneakers engineered with ergonomic comfort soles and high-rebound cushioning.',
      images: [`${siteUrl}/asset/Urban%20Sprint%20on%20Blue%20Concrete.webp`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RunningPage() {
  const dbProducts = await getAllProducts();

  // Load purely from the live MongoDB database
  const allRunningProducts = (dbProducts || [])
    .filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sport = (p.sport || '').toLowerCase();
      return (
        cat.includes('sport') ||
        cat.includes('run') ||
        sport.includes('run') ||
        sport.includes('road')
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
        category: p.category || 'Sport shoe',
        gender: p.gender || 'unisex',
        colorDots: dots,
      };
    });

  // Schema.org Structured Data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.in';
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
        name: 'Sport Shoes',
        item: `${siteUrl}/running`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Sonu Shoe - Sport Shoe Collection',
    description: 'High-performance road and sport shoes engineered for ergonomic comfort and endurance.',
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
