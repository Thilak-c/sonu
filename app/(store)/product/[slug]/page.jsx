import { notFound } from 'next/navigation';
import { getProductById, getAllProducts } from '@/lib/products';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({
    slug: p.slug || p.id,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductById(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Sonu shoe',
      description: 'The requested handcrafted footwear model could not be found.',
    };
  }

  const imageUrl = product.image || product.mainImage;

  const title = product.seo?.metaTitle || `${product.name} — ${product.category} | Sonu shoe`;
  const description =
    product.seo?.metaDescription ||
    `${product.description || 'Handcrafted small-run footwear.'} Handcrafted in small runs with ergonomic comfort soles.`;
  const keywords =
    Array.isArray(product.seo?.keywords) && product.seo.keywords.length > 0
      ? product.seo.keywords
      : [
          product.name,
          product.category,
          'handcrafted footwear',
          'small-run sneakers',
          'ergonomic comfort',
          'premium soles',
          'minimalist luxury shoe',
          'for the long way home',
        ];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `https://sonushoe.in/product/${product.id || slug}`,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: product.alt || product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const [product, allCatalog] = await Promise.all([
    getProductById(slug),
    getAllProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const imageUrl = product.image || product.mainImage;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://sonushoe.in${imageUrl}`) : undefined,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'Sonu shoe',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.priceNumber || 13995,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://sonushoe.in/product/${product.id || slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Sonu shoe',
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
        item: 'https://sonushoe.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Fresh Drops',
        item: 'https://sonushoe.in/#fresh-drops',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://sonushoe.in/product/${product.id || slug}`,
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
      <ProductDetailClient product={product} initialCatalog={allCatalog} />
    </>
  );
}
