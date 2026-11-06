import '@/app/globals.css';

export const metadata = {
  metadataBase: new URL('https://sonushoe.in'),
  title: {
    default: 'Sonu Shoe | Best Shoe Band In Patna,Bihar',
    template: '%s | Sonu Shoe',
  },
  description:
    'Sonu Shoe is a footwear brand that makes comfortable and stylish shoes for men and women. We use high-quality materials and construction techniques to create shoes that are built to last. Our shoes are perfect for everyday wear, and they come in a variety of styles and colors to suit any taste.',
  keywords: [
    'Sonu Shoe',
    'premium footwear',
    'small-run sneakers',
    'handcrafted shoes',
    'minimalist luxury sneakers',
    'ergonomic sole comfort',
    'everyday walking shoes',
    'designer footwear',
  ],
  authors: [{ name: 'Sonu Shoe' }],
  creator: 'Sonu Shoe',
  publisher: 'Sonu Shoe',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Sonu Shoe | Best Shoe Band In Patna,Bihar',
    description:
      'Sonu Shoe is a footwear brand that makes comfortable and stylish shoes for men and women. We use high-quality materials and construction techniques to create shoes that are built to last. Our shoes are perfect for everyday wear, and they come in a variety of styles and colors to suit any taste.',
    url: 'https://sonushoe.in',
    siteName: 'Sonu Shoe',
    images: [
      {
        url: '/Logo/Logo_Full.png',
        width: 1200,
        height: 630,
        alt: 'Sonu Shoe Brand Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sonu Shoe — Premium Footwear | For the Long Way Home',
    description:
      'Small-run, precision-engineered footwear built for timeless street style and ergonomic comfort.',
    images: ['/Logo/Logo_Full.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#9fd6c8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="preload"
          href="/Logo/Logo_Full.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/Font/HelveticaNowText.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/Font/HelveticaNowTextMedium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
