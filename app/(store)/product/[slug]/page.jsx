import { notFound } from 'next/navigation';
import { FRESH_DROPS } from '@/components/home/freshDropsData';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export async function generateStaticParams() {
  return FRESH_DROPS.map((drop) => ({
    slug: drop.id,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = FRESH_DROPS.find((p) => p.id === slug) || FRESH_DROPS[0];

  return {
    title: `${product.name} — ${product.category} | SONU Footwear`,
    description: `${product.description} Handcrafted in small runs with ergonomic comfort soles.`,
    keywords: [
      product.name,
      product.category,
      'handcrafted footwear',
      'small-run sneakers',
      'ergonomic comfort',
      'premium soles',
      'minimalist luxury shoe',
      'for the long way home',
    ],
    openGraph: {
      title: `${product.name} | ${product.category} — SONU`,
      description: product.description,
      url: `https://sonu.shoes/product/${product.id}`,
      images: [
        {
          url: product.image,
          alt: product.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — SONU Footwear`,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = FRESH_DROPS.find((p) => p.id === slug);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: `https://sonu.shoes${product.image}`,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'SONU',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.priceNumber || 13995,
      availability: 'https://schema.org/InStock',
      url: `https://sonu.shoes/product/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: 'SONU Footwear',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://sonu.shoes',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Fresh Drops',
        item: 'https://sonu.shoes/#fresh-drops',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://sonu.shoes/product/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
