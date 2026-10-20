# SONU Project Rules & Guidelines

## 1. Styling & Design
- **Tailwind CSS Only**: All UI styling must strictly use Tailwind CSS utility classes in JSX. Never introduce separate CSS folders or standalone stylesheet files.
- **Single Typography**: Use exclusively `Helvetica Now Text` font (`/Font/HelveticaNowText.woff2`).
- **Brand Aesthetic**: Clean, modern, premium footwear subbrand aesthetic inspired by industry leaders (e.g., Nike clean mobile UX).

## 2. Super-Optimized SEO & Server-Side Rendering (SSR)
- **SSR by Default**: All new routes and major components must maximize Next.js Server-Side Rendering (Server Components) so pages are fully populated in initial HTML for search crawlers.
- **Rich Metadata on Every Page**:
  - Distinct, keyword-rich `<title>` and `<meta name="description">`.
  - Comprehensive OpenGraph and Twitter card metadata with fallback images.
  - Canonical URLs and proper robots directives (`index, follow`).
- **Keyword Integration**:
  - Contextual footwear terms: "handcrafted footwear", "small-run sneakers", "ergonomic comfort", "premium soles", "minimalist luxury shoe", "for the long way home".
  - Strategic distribution across single `<h1>`, subheadings `<h2>`, `<h3>`, lead paragraphs, and descriptive image `alt` texts.
- **Structured Data (Schema.org JSON-LD)**:
  - Embed `Product`, `Organization`, `WebSite`, and `BreadcrumbList` schemas directly into SSR page outputs.
