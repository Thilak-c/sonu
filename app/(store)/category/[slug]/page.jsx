import React from 'react';
import { getAllProducts } from '@/lib/products';
import RunningCollectionClient from '@/components/running/RunningCollectionClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTitle(slug = '') {
  return decodeURIComponent(slug)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const displayName = formatTitle(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonushoe.in';

  return {
    title: `Sonu Shoe — ${displayName} Collection`,
    description: `Explore the official Sonu Shoe ${displayName} collection. Handcrafted small-run footwear engineered with ergonomic comfort soles for the long way home.`,
    alternates: {
      canonical: `${siteUrl}/category/${slug}`,
    },
    openGraph: {
      title: `Sonu Shoe — ${displayName} Collection`,
      description: `Explore handcrafted ${displayName} footwear built for timeless street minimalism and all-day walking comfort.`,
      url: `${siteUrl}/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).toLowerCase().replace(/[-_]/g, ' ').trim();
  const displayName = formatTitle(slug);

  const dbProducts = await getAllProducts();

  // Match category, sport, or tags
  const matchedProducts = (dbProducts || [])
    .filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sport = (p.sport || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';

      return (
        cat.includes(decoded) ||
        sport.includes(decoded) ||
        decoded.includes(cat) ||
        decoded.includes(sport) ||
        name.includes(decoded) ||
        tags.includes(decoded)
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
        category: p.category || displayName,
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
        name: displayName,
        item: `${siteUrl}/category/${slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <RunningCollectionClient
        initialProducts={matchedProducts}
        title={`Sonu Shoe — ${displayName}`}
      />
    </main>
  );
}

