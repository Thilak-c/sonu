import React from 'react';
import FavouritesClient from '@/components/favourites/FavouritesClient';
import { getAllProducts } from '@/lib/products';

export const metadata = {
  title: 'Favourites & Wishlist | Sonu shoe',
  description:
    'Review and manage your saved Sonu shoe handcrafted luxury running shoes, court sneakers, and ergonomic sole trainers. Move your saved pairs to bag with one click.',
  keywords: [
    'Sonu shoe favourites',
    'shoes wishlist',
    'handcrafted sneakers saved',
    'luxury footwear wishlist',
    'ergonomic running shoes wishlist',
  ],
  alternates: {
    canonical: 'https://sonushoe.in/favourites',
  },
  openGraph: {
    title: 'Favourites & Wishlist | Sonu shoe',
    description: 'Review and manage your saved handcrafted sneakers and luxury footwear pairs.',
    url: 'https://sonushoe.in/favourites',
    siteName: 'Sonu shoe',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Favourites & Wishlist | Sonu shoe',
    description: 'Review and manage your saved handcrafted footwear pairs.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function FavouritesPage() {
  const products = await getAllProducts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Favourites | Sonu shoe',
    url: 'https://sonushoe.in/favourites',
    description: 'Saved shoes and wishlist pairs.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Sonu shoe',
      url: 'https://sonushoe.in',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FavouritesClient initialProducts={products} />
    </>
  );
}
