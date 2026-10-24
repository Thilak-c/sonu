import React from 'react';
import FavouritesClient from '@/components/favourites/FavouritesClient';

export const metadata = {
  title: 'Favourites & Wishlist | SONU Shoes',
  description:
    'Review and manage your saved SONU handcrafted luxury running shoes, court sneakers, and ergonomic sole trainers. Move your saved pairs to bag with one click.',
  keywords: [
    'SONU favourites',
    'shoes wishlist',
    'handcrafted sneakers saved',
    'luxury footwear wishlist',
    'ergonomic running shoes wishlist',
  ],
  alternates: {
    canonical: 'https://sonu.shoes/favourites',
  },
  openGraph: {
    title: 'Favourites & Wishlist | SONU Shoes',
    description: 'Review and manage your saved handcrafted sneakers and luxury footwear pairs.',
    url: 'https://sonu.shoes/favourites',
    siteName: 'SONU Shoes',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Favourites & Wishlist | SONU Shoes',
    description: 'Review and manage your saved handcrafted footwear pairs.',
  },
  robots: {
    index: false, // User private wishlist should not clutter search indexes
    follow: true,
  },
};

export default function FavouritesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Favourites | SONU Shoes',
    url: 'https://sonu.shoes/favourites',
    description: 'Saved shoes and wishlist pairs.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'SONU Shoes',
      url: 'https://sonu.shoes',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FavouritesClient />
    </>
  );
}
