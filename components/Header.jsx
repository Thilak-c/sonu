'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getCartItems, preloadCartImages, preloadPaymentImages } from './cart/cartStore';
import LoginModal from './auth/LoginModal';
import { FRESH_DROPS } from './home/freshDropsData';

// Helper to highlight matching substrings in bold dark black, keeping other text in gray
function renderHighlightedText(text, query) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <span>{text}</span>;

  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <span key={index} className="text-[#111111] font-semibold">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Built-in curated suggestions matching the exact Nike design reference and footwear collection
const CURATED_SUGGESTIONS = [
  { id: 'cs-1', title: "Jordan Flight Fleece Women's Pullover", slug: 'drop-aeroflex-violet', category: 'Fleece' },
  { id: 'cs-2', title: "Nike Sportswear Women's Oversized Fleece Top", slug: 'drop-hybrid-women', category: 'Fleece' },
  { id: 'cs-3', title: "Nike Club Men's French Terry Crew", slug: 'drop-hybrid-men', category: 'French Terry' },
  { id: 'cs-4', title: "Nike Sportswear Club Men's Fleece Crew", slug: 'drop-hybrid-men', category: 'Fleece' },
  { id: 'cs-5', title: "Nike Club Fleece Older Kids' Pullover Hoodie", slug: 'drop-hybrid-women', category: 'Fleece' },
  { id: 'cs-6', title: "Nike Studio Fleece Lightweight Warmup Top", slug: 'drop-stride-tempo', category: 'Fleece' },
  { id: 'cs-7', title: "Nike Miler Men's Dri-FIT French Terry Top", slug: 'drop-offpath-trail', category: 'French Terry' },
  { id: 'cs-8', title: "Nike Sportswear Chill Terry Relaxed Hoodie", slug: 'drop-hybrid-women', category: 'Chill Terry' },
  { id: 'cs-9', title: "SONU Hybrid RN Women's Road Running Shoes", slug: 'drop-hybrid-women', category: 'Running' },
  { id: 'cs-10', title: "SONU Stealth RN Men's Road Running Shoes", slug: 'drop-hybrid-men', category: 'Running' },
  { id: 'cs-11', title: "SONU Pure Low Minimalist Court Sneakers", slug: 'drop-court-studio', category: 'Sneaker' },
  { id: 'cs-12', title: "SONU Off-Path Trail Running Shoes", slug: 'drop-offpath-trail', category: 'Trail Running' },
];

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbProducts, setDbProducts] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [loginModalStep, setLoginModalStep] = useState('mobile');

  // Smart Sticky Navbar State (Universal hide on scroll down, reveal on scroll up)
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          const prevScrollY = lastScrollYRef.current;
          const diff = currentScrollY - prevScrollY;

          // Track whether page has scrolled away from top
          setIsScrolled(currentScrollY > 15);

          // Always show at top of page or rubber-band bounce
          if (currentScrollY <= 15) {
            setIsVisible(true);
          } else if (searchOpen || menuOpen) {
            // Keep visible if search or menu drawer is open
            setIsVisible(true);
          } else if (diff > 6) {
            // Scrolling down -> slide out with page
            setIsVisible(false);
          } else if (diff < -6) {
            // Scrolling up -> pop up / slide down
            setIsVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchOpen, menuOpen]);

  // Listen for global open-login-modal events
  useEffect(() => {
    const handleOpenLogin = (e) => {
      setLoginModalStep(e?.detail?.step || 'mobile');
      setIsLoginOpen(true);
    };
    window.addEventListener('open-login-modal', handleOpenLogin);
    return () => window.removeEventListener('open-login-modal', handleOpenLogin);
  }, []);

  // Sync cart count reactively and preload images simultaneously
  useEffect(() => {
    const updateCount = () => {
      const items = getCartItems();
      const count = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      setCartCount(count);
      if (items.length > 0) {
        preloadCartImages();
        preloadPaymentImages();
      }
    };
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (menuOpen) setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, menuOpen]);

  // Lock body scroll and immediately focus input so mobile keyboard opens on search click
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
      searchInputRef.current?.focus();
    } else if (!menuOpen) {
      document.body.style.overflow = '';
      searchInputRef.current?.blur();
    }
  }, [searchOpen, menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!searchOpen) {
      document.body.style.overflow = '';
    }
  }, [menuOpen, searchOpen]);

  // Load products from DB for real-time search
  useEffect(() => {
    let isMounted = true;
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.products)) {
          setDbProducts(data.products);
        }
      })
      .catch((err) => {
        console.error('Error loading products for search:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute all searchable suggestions
  const allSuggestions = useMemo(() => {
    const list = [];
    const seenTitles = new Set();

    // 1. Add DB products
    if (Array.isArray(dbProducts)) {
      dbProducts.forEach((p) => {
        const slug = p.slug || p.itemId || String(p._id || '');
        let title = (p.name || '').trim();
        if (!title) return;
        if (p.brand && !title.toLowerCase().includes(p.brand.toLowerCase()) && title.length < 15) {
          title = `${p.brand} ${title}`;
        }
        if (p.category && !title.toLowerCase().includes(p.category.toLowerCase())) {
          title = `${title} ${p.category}`;
        }
        if (!seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          list.push({
            id: `db-${slug}`,
            slug,
            title,
            category: p.category || '',
            sport: p.sport || '',
            brand: p.brand || '',
          });
        }
      });
    }

    // 2. Add Curated reference suggestions
    CURATED_SUGGESTIONS.forEach((item) => {
      if (!seenTitles.has(item.title.toLowerCase())) {
        seenTitles.add(item.title.toLowerCase());
        list.push({
          id: item.id,
          slug: item.slug,
          title: item.title,
          category: item.category || '',
          sport: '',
          brand: 'Nike',
        });
      }
    });

    // 3. Add Fresh Drops showcase items
    if (Array.isArray(FRESH_DROPS)) {
      FRESH_DROPS.forEach((p) => {
        const title = `${p.name} ${p.category || ''}`.trim();
        if (!seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          list.push({
            id: `fd-${p.slug}`,
            slug: p.slug,
            title,
            category: p.category || '',
            sport: '',
            brand: 'SONU',
          });
        }
      });
    }

    return list;
  }, [dbProducts]);

  // Dynamically filter suggestions against search query
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return allSuggestions.slice(0, 8);
    }

    const words = q.split(/\s+/).filter(Boolean);

    const matches = allSuggestions.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const sportLower = (item.sport || '').toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();

      return words.every(
        (word) =>
          titleLower.includes(word) ||
          catLower.includes(word) ||
          sportLower.includes(word) ||
          brandLower.includes(word)
      );
    });

    // Score & sort: items with direct title match come first
    matches.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(q);
      const bTitleMatch = b.title.toLowerCase().includes(q);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });

    return matches.slice(0, 10);
  }, [allSuggestions, searchQuery]);

  function handleSuggestionClick(item) {
    if (item.slug) {
      router.push(`/product/${item.slug}`);
    } else {
      router.push(`/#shop?q=${encodeURIComponent(item.title)}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (filteredSuggestions.length > 0 && filteredSuggestions[0].slug) {
      router.push(`/product/${filteredSuggestions[0].slug}`);
    } else {
      router.push(`/#shop?q=${encodeURIComponent(query)}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  }

  const primaryMenuItems = [
    { label: 'New & Featured', href: '/#collection', hasArrow: true },
    { label: 'Men', href: '/#collection', hasArrow: true },
    { label: 'Women', href: '/#collection', hasArrow: true },
    { label: 'Kids', href: '/#collection', hasArrow: true },
 
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          {/* Left section: Logo only */}
          <div className="flex items-center">
            <Link href="/" className="inline-block transition-opacity hover:opacity-85" aria-label="Home">
              <img
                src="/Logo/Logo_Full_orig.png"
                alt="Sonu shoe"
                className="h-7 sm:h-9 w-auto object-contain"
                loading="eager"
                fetchPriority="high"
                width={180}
                height={40}
              />
            </Link>
          </div>

          {/* Right section */}
          {/* Desktop: Search Pill, Heart (Favourites), Bag (Cart) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Pill */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                searchInputRef.current?.focus();
              }}
              className="group w-[170px] lg:w-[180px] h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] px-3.5 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              aria-label="Search"
            >
              <svg  focusable="false" viewBox="0 0 24 24" role="img" width="22px" height="22px" fill="none" className="shrink-0">
                <path stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.962 16.296a6.716 6.716 0 01-3.462.954 6.728 6.728 0 01-4.773-1.977A6.728 6.728 0 013.75 10.5c0-1.864.755-3.551 1.977-4.773A6.728 6.728 0 0110.5 3.75c1.864 0 3.551.755 4.773 1.977A6.728 6.728 0 0117.25 10.5a6.726 6.726 0 01-.921 3.407c-.517.882-.434 1.988.289 2.711l3.853 3.853" />
              </svg>
              <span className="text-[15px] text-[#707072] font-normal group-hover:text-[#111111] transition-colors leading-none">
                Search
              </span>
            </button>

            {/* Favourites Heart Button */}
            <Link
              href="/favourites"
              className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
              aria-label="Favourites"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="22px" height="22px" fill="none">
                <path
                  stroke="#111111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.794 3.75c1.324 0 2.568.516 3.504 1.451a4.96 4.96 0 010 7.008L12 20.5l-8.298-8.291a4.96 4.96 0 010-7.008 4.934 4.934 0 013.504-1.451c1.324 0 2.569.515 3.504 1.45L12 6.49l1.29-1.29a4.934 4.934 0 013.504-1.45z"
                />
              </svg>
            </Link>

            {/* Bag Button with Item Count inside bag */}
            <Link
              href="/checkout"
              onMouseEnter={() => {
                preloadCartImages();
                preloadPaymentImages();
              }}
              onTouchStart={() => {
                preloadCartImages();
                preloadPaymentImages();
              }}
              className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#111111] transition-colors relative cursor-pointer"
              aria-label={`Open Bag (${cartCount})`}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="22px" height="22px" fill="none">
                <path
                  stroke="#111111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v2.25M3.75 8.25h16.5v10.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V8.25z"
                />
                {cartCount > 0 && (
                  <text
                    x="12"
                    y="14.8"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#111111"
                    fontSize="9"
                    fontWeight="700"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {cartCount}
                  </text>
                )}
              </svg>
            </Link>
          </div>

          {/* Mobile Right Section: Search Icon, Bag, Hamburger */}
          <div className="flex md:hidden items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                searchInputRef.current?.focus();
              }}
              className="transition-colors flex items-center justify-center text-[#111111]"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path stroke="#111111" strokeWidth="1.5" d="M13.962 16.296a6.716 6.716 0 01-3.462.954 6.728 6.728 0 01-4.773-1.977A6.728 6.728 0 013.75 10.5c0-1.864.755-3.551 1.977-4.773A6.728 6.728 0 0110.5 3.75c1.864 0 3.551.755 4.773 1.977A6.728 6.728 0 0117.25 10.5a6.726 6.726 0 01-.921 3.407c-.517.882-.434 1.988.289 2.711l3.853 3.853" />
              </svg>
            </button>

            <Link
              href="/checkout"
              onMouseEnter={() => {
                preloadCartImages();
                preloadPaymentImages();
              }}
              onTouchStart={() => {
                preloadCartImages();
                preloadPaymentImages();
              }}
              className="relative transition-colors flex items-center justify-center text-[#111111] w-6 h-6"
              aria-label={`Open Bag (${cartCount})`}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path
                  stroke="#111111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v2.25M3.75 8.25h16.5v10.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V8.25z"
                />
                {cartCount > 0 && (
                  <text
                    x="12"
                    y="14.8"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#111111"
                    fontSize="9"
                    fontWeight="700"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {cartCount}
                  </text>
                )}
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="transition-colors flex items-center justify-center text-[#111111]"
              aria-label="Open Navigation Menu"
              aria-expanded={menuOpen}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path stroke="#111111" strokeWidth="1.5" d="M21 5.25H3M21 12H3m18 6.75H3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[320px] sm:w-[360px] bg-white z-50 shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-out font-['Helvetica_Now_Text_Medium',sans-serif] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="p-6 sm:p-8 flex flex-col">
          {/* Close / Cross Icon Button */}
          <div className="flex justify-end pb-4">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-full hover:bg-neutral-100 text-[#111111] transition-colors"
              aria-label="Close Navigation Menu"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path stroke="#111111" strokeWidth="1.5" d="M18.973 5.027L5.028 18.972m0-13.945l13.944 13.945" />
              </svg>
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="flex flex-col gap-1 pt-2">
            {primaryMenuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-2.5 text-[22px] sm:text-[24px] font-bold text-[#111111] hover:text-[#707072] transition-colors"
              >
                <span>{item.label}</span>
                {item.hasArrow && (
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                    <path stroke="#111111" strokeWidth="1.5" d="M8.474 18.966L15.44 12 8.474 5.033" />
                  </svg>
                )}
              </Link>
            ))}
          </nav>

          {/* Personalised Picks Prompt */}
          <div className="mt-8 mb-6">
            <p className="text-[17px] text-[#707072] font-medium leading-snug max-w-[240px]">
              Get personalised picks & faster checkout
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="bg-[#111111] text-white text-[15px] font-semibold px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="bg-white text-[#111111] border border-[#e5e5e5] text-[15px] font-semibold px-5 py-2.5 rounded-full hover:border-[#111111] transition-colors cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>

          {/* Secondary List with exact icons provided */}
          <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
            {/* Help */}
            <Link
              href="/checkout"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3.5 py-1.5 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path stroke="#111111" strokeMiterlimit="10" strokeWidth="1.5" d="M11.99 18v-1.5M9 9.75a3 3 0 114.29 2.71c-.78.37-1.29 1.16-1.29 2.03V15m9.75-3c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75z" />
              </svg>
              <p>Help</p>
            </Link>

            {/* Bag */}
            <Link
              href="/checkout"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3.5 py-1.5 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors text-left"
              aria-label="Bag Items"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                  <path stroke="#111111" strokeWidth="1.5" d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 110 4.5H3.75v8.25a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75V8.25H17.5" />
                  {cartCount > 0 && (
                    <text
                      x="12"
                      y="14.8"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#111111"
                      fontSize="9"
                      fontWeight="700"
                      style={{ fontFamily: "'Helvetica Now Text Medium', 'Helvetica Now Text', sans-serif" }}
                    >
                      {cartCount}
                    </text>
                  )}
                </svg>
              </div>
              <p>Bag</p>
            </Link>

            {/* Favourites */}
            <Link
              href="/favourites"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3.5 py-1.5 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors"
              aria-label="Wishlist"
            >
              <svg viewBox="0 0 24 24" width="24px" height="24px">
                <path d="M17.3062 5.00888C18.1009 5.00888 18.7963 5.31065 19.3923 5.71302C20.8824 6.92012 21.0811 9.13314 19.7897 10.5414C19.6904 10.642 19.6904 10.7426 19.591 10.7426L12.0412 18.4882L4.49139 10.8432C3.19998 9.5355 3.19998 7.32249 4.49139 5.9142C4.59073 5.81361 4.59073 5.81361 4.69007 5.71302C5.28611 5.31065 6.08083 5.00888 6.77621 5.00888C7.7696 5.00888 8.763 5.41124 9.45837 6.11538L10.9485 7.62426L12.0412 8.73077L13.1339 7.62426L14.624 6.11538C15.3194 5.41124 16.3128 5.00888 17.3062 5.00888ZM17.3062 3.5C15.9154 3.5 14.5247 4.10355 13.5313 5.10947L12.0412 6.61834L10.5511 5.10947C9.55771 4.10355 8.16696 3.5 6.77621 3.5C5.68347 3.5 4.59073 3.90237 3.69668 4.60651C1.70989 6.31657 1.41187 9.43491 3.10064 11.5473C3.19998 11.6479 3.29932 11.7485 3.39866 11.8491L12.0412 20.5L20.5844 11.8491C22.4719 9.93787 22.4719 6.81953 20.5844 4.80769C20.4851 4.7071 20.3857 4.60651 20.2864 4.50592C19.4917 3.90237 18.3989 3.5 17.3062 3.5Z" fill="#111111" />
              </svg>
              <p>Favourites</p>
            </Link>

            {/* Orders */}
            <Link
              href="/orders"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3.5 py-1.5 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
                <path stroke="#111111" strokeMiterlimit="10" strokeWidth="1.5" d="M12 13.5v-7c0-1.74 1.01-2.75 2.25-2.75h4.39l1.61 6m0 0H3.75m16.5 0v10.5H3.75V9.75m0 0l1.61-6h5.14" />
              </svg>
              <p>Orders </p>
            </Link>

            {/* Saved Payments */}
            <div className="flex items-center gap-3.5 py-1.5 text-[15px] font-medium text-[#111111] cursor-pointer hover:text-[#707072] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24">
                <path fill="#111111" d="M18 16.25h-3a.75.75 0 1 1 0-1.5h3a.75.75 0 1 1 0 1.5Z" />
                <path fill="#111111" d="M21 5H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Zm-.5 12.5h-17v-6.1h17v6.1Zm-17-7.6V6.5h17v3.4h-17Z" />
              </svg>
              <p>Saved Payments</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Full-screen Search Window sliding in from the right with opacity transition */}
      <div
        className={`fixed inset-0 z-50 bg-white flex flex-col transition-all duration-300 ease-out font-['Helvetica_Now_Text',sans-serif] ${
          searchOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        role="dialog"
        aria-modal="true"
        aria-label="Search shoes"
      >
        {/* Top Search Bar */}
        <div className="w-full px-4 pt-3 pb-3 sm:px-8 sm:pt-4 flex items-center gap-3">
          {/* Pill Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center bg-[#f5f5f5] rounded-full px-4 py-2 sm:py-2.5 gap-2.5"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              role="img"
              width="18px"
              height="18px"
              fill="none"
              className="shrink-0 text-[#111111]"
            >
              <path
                stroke="currentColor"
                strokeWidth="1.75"
                d="M13.962 16.296a6.716 6.716 0 01-3.462.954 6.728 6.728 0 01-4.773-1.977A6.728 6.728 0 013.75 10.5c0-1.864.755-3.551 1.977-4.773A6.728 6.728 0 0110.5 3.75c1.864 0 3.551.755 4.773 1.977A6.728 6.728 0 0117.25 10.5a6.726 6.726 0 01-.921 3.407c-.517.882-.434 1.988.289 2.711l3.853 3.853"
              />
            </svg>
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              inputMode="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[16px] text-[#111111] placeholder-[#757575] outline-none font-normal [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-cancel-button]:hidden"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="w-5 h-5 flex items-center justify-center shrink-0 transition-colors"
                aria-label="Clear search input"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="16px"
                  height="16px"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </form>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className="text-[15px] sm:text-[16px] font-medium text-[#111111] hover:text-[#707072] transition-colors whitespace-nowrap pl-1 pr-1"
          >
            Cancel
          </button>
        </div>

        {/* Suggestions Canvas Body strictly matching user design */}
        <div className="flex-1 w-full overflow-y-auto px-6 sm:px-8 pt-4 sm:pt-6 pb-12 select-none">
          <div className="w-full max-w-2xl">
            {/* Header: Top Suggestions */}
            <h3 className="text-[13px] sm:text-[14px] text-[#707072] font-normal mb-2 sm:mb-3">
              Top Suggestions
            </h3>

            {/* Suggestions List */}
            <ul className="flex flex-col w-full divide-y-0">
              {filteredSuggestions.map((item) => (
                <li key={item.id} className="w-full">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left py-2.5 sm:py-3 text-[17px] sm:text-[18px] text-[#707072] hover:text-[#111111] transition-colors truncate block focus:outline-none focus:text-[#111111]"
                    title={item.title}
                  >
                    {renderHighlightedText(item.title, searchQuery)}
                  </button>
                </li>
              ))}
              {filteredSuggestions.length === 0 && (
                <li className="py-4 text-[#707072] text-[15px] sm:text-[16px]">
                  No suggestions found for &ldquo;{searchQuery}&rdquo;
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Global Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} initialStep={loginModalStep} />
    </>
  );
}
