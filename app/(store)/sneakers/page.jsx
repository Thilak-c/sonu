import React from 'react';
import { getAllProducts } from '@/lib/products';
import RunningCollectionClient from '@/components/running/RunningCollectionClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.in';
  const canonicalUrl = `${siteUrl}/sneakers`;

  return {
    title: 'Sonu Shoe — Handcrafted Sneaker Collection',
    description:
      'Explore the official Sonu Shoe Sneaker collection. Handcrafted minimalist sneakers engineered with premium soles, durable leather, and street-ready comfort for the long way home.',
    keywords: [
      'Sonu Shoe',
      'sneakers',
      'handcrafted sneakers',
      'lifestyle shoes',
      'minimalist sneakers',
      'for the long way home',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Sonu Shoe — Handcrafted Sneaker Collection',
      description:
        'Explore the official Sonu Shoe Sneaker collection. Timeless street silhouettes engineered for all-day comfort.',
      url: canonicalUrl,
      siteName: 'SONU',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/asset/Cinematic%20Streetwear%20on%20Concrete%20Steps.webp`,
          width: 1200,
          height: 630,
          alt: 'Sonu Shoe Sneaker Collection',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sonu Shoe — Handcrafted Sneaker Collection',
      description:
        'Explore the official Sonu Shoe Sneaker collection. Handcrafted minimalist sneakers engineered for all-day comfort.',
      images: [`${siteUrl}/asset/Cinematic%20Streetwear%20on%20Concrete%20Steps.webp`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SneakerPage() {
  const dbProducts = await getAllProducts();

  // Load purely from the live MongoDB database
  const allSneakers = (dbProducts || [])
    .filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sport = (p.sport || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        cat.includes('sneaker') ||
        cat.includes('lifestyle') ||
        sport.includes('sneaker') ||
        sport.includes('lifestyle') ||
        sport.includes('court') ||
        name.includes('sneaker')
      );
    })
    .map((p) => {
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
        category: p.category || 'Sneaker',
        gender: p.gender || 'unisex',
        colorDots: dots,
      };
    });

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
        name: 'Sneakers',
        item: `${siteUrl}/sneakers`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Sonu Shoe - Sneaker Collection',
    description: 'Timeless handcrafted sneakers engineered for daily city walking and street minimalism.',
    itemListElement: allSneakers.map((p, idx) => ({
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

      <RunningCollectionClient
        initialProducts={allSneakers}
        title="Sonu Shoe-Sneaker"
      />
    </main>
  );
}

