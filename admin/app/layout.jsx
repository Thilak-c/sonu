import './globals.css';

export const metadata = {
  title: 'SONU Admin — Footwear Operations & Control Plane',
  description: 'Enterprise administration panel for SONU footwear, orders, catalog and inventory management.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfbfb] text-[#111111] antialiased selection:bg-[#111111] selection:text-white font-['Helvetica_Now_Text',sans-serif]">
        {children}
      </body>
    </html>
  );
}
