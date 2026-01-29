import ProductGrid from '@/components/ProductGrid'
import Link from 'next/link'
import type { Metadata } from 'next'

// Use ISR (Incremental Static Regeneration) - pages are cached and revalidated every hour
// This provides fast page loads while keeping data fresh
export const revalidate = 3600 // Revalidate every hour (3600 seconds)

export const metadata: Metadata = {
  title: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
  description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
  keywords: 'Trapstar, Trapstar Official, streetwear, tracksuits, jackets, hoodies, t-shirts, bags, premium streetwear, trapstarofficial.store',
  openGraph: {
    title: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
    description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
    url: 'https://trapstarofficial.store',
    siteName: 'Trapstar Official',
    images: [
      {
        url: 'https://trapstarofficial.store/trapstar.webp',
        width: 1200,
        height: 630,
        alt: 'Trapstar Official Store',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
    description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
    images: ['https://trapstarofficial.store/trapstar.webp'],
  },
  alternates: {
    canonical: 'https://trapstarofficial.store',
  },
}

export default async function Home() {
  // FAST: Fetch only 8 products per category (not all products)
  // Each category fetches only what's needed from cache or API
  // Total: 6 categories × 8 products = 48 products (not 212!)
  
  async function fetchCategoryProducts(category: string, limit: number = 8) {
    try {
      // ALWAYS use cache first - NO DIRECT FETCH
      // Cache will be populated by getAllProducts() on first request
      const { getAllProducts } = await import('@/lib/products')
      const allProducts = await getAllProducts()
      
      if (allProducts && allProducts.length > 0) {
        const filtered = allProducts.filter(p => p.category === category).slice(0, limit)
        console.log(`✅ Homepage ${category}: Found ${filtered.length} products from cache`)
        return filtered
      }
      
      // If cache is empty, getAllProducts() will fetch all products in background
      // Return empty for now, cache will be ready on next request
      console.log(`⚠️  Homepage ${category}: Cache is being populated, returning empty for now`)
      return []
    } catch (error) {
      console.error(`Error fetching ${category}:`, error)
      return []
    }
  }
  
  // Fetch all categories in parallel (but only 8 products each)
  const [tracksuits, jackets, shorts, tshirts, bags, hoodies] = await Promise.all([
    fetchCategoryProducts('tracksuits', 8),
    fetchCategoryProducts('jackets', 8),
    fetchCategoryProducts('shorts', 8),
    fetchCategoryProducts('t-shirts', 8),
    fetchCategoryProducts('bags', 8),
    fetchCategoryProducts('hoodies', 8),
  ])
  
  console.log(`✅ Homepage: Fetched ${tracksuits.length + jackets.length + shorts.length + tshirts.length + bags.length + hoodies.length} products (8 per category, NOT all 212)`)

  return (
    <>
      {/* Hero Section - Promotional Banner */}
      <h1 className="sr-only">Trapstar Official Store - Premium Streetwear Collection</h1>
      <section className="relative w-full bg-black border-b border-gray-900">
        <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
          <img
            src="/trapstar.webp"
            alt="Trapstar Official Hero"
            className="w-full h-full object-contain"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* Category Sections - Only Trapstar Categories */}
      <div id="collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Tracksuits - 31 products */}
        {tracksuits.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar Tracksuits</h2>
              <div className="w-full">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  Trapstar tracksuits are popular because they are both fashion-forward and wearable because they combine premium comfort with bold streetwear design. The brand's edgy graphics, quality materials, and limited releases make them a must-have for streetwear.
                </p>
              </div>
            </div>
            <ProductGrid products={tracksuits} />
          </section>
        )}

        {/* Jackets - 27 products */}
        {jackets.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar Jackets</h2>
              <div className="w-full">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  Trapstar jackets combine premium materials with bold streetwear designs. From leather jackets to track jackets, each piece features the brand's signature aesthetic and quality craftsmanship.
                </p>
              </div>
            </div>
            <ProductGrid products={jackets} />
          </section>
        )}

        {/* Shorts - 21 products */}
        {shorts.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar Shorts</h2>
              <div className="w-full">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  Trapstar Shorts are athletic shorts of high quality made with streetwear culture in mind. They frequently have eye-catching graphic prints, high-quality materials, and a distinct relaxed fit that will make you stand out.
                </p>
              </div>
            </div>
            <ProductGrid products={shorts} />
          </section>
        )}

        {/* T-Shirts - 9 products */}
        {tshirts.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar T-Shirts</h2>
              <div className="w-full">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  Trapstar is not an established brand. The loudness of their T-shirts is not childish. The designs carry some real weight—metaphorically and physically. It is not thin cotton that deteriorates after two washes.
                </p>
              </div>
            </div>
            <ProductGrid products={tshirts} />
          </section>
        )}

        {/* Bags - 7 products */}
        {bags.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar Bags</h2>
              <div className="w-full">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  Complete your streetwear look with Trapstar bags. From cross-body bags to backpacks, each piece features the brand's iconic logos and premium quality.
                </p>
              </div>
            </div>
            <ProductGrid products={bags} />
          </section>
        )}

        {/* Hoodies - 2 products */}
        {hoodies.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-center">Trapstar Hoodies</h2>
              <div className="w-full space-y-4">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">
                  The Trapstar hoodie's popularity comes from its blend of premium quality, striking graphics, and streetwear credibility. It is a badge of style for the brave, as celebrities, rappers, and influencers have been spotted wearing these distinctive pieces.
                </p>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed text-center">
                  When you're hunting for a hoodie, quality is king. Trapstar hoodies have been making waves, but are they really worth the hype? I've taken a deep dive into what makes these hoodies tick. They cost more than your average hoodie, but the craftsmanship and design speak for themselves.
                </p>
              </div>
            </div>
            <ProductGrid products={hoodies} />
          </section>
        )}
      </div>

      {/* Trapstar Overview Section - After Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <section id="overview" className="mb-12 md:mb-16 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8 text-center">Trapstar Overview</h2>
          <div className="text-gray-300 space-y-5 md:space-y-6 w-full text-base md:text-lg leading-relaxed">
            <p>
              The streetwear brand taking over your wardrobe is <strong>Trapstar</strong>. Trapstar is probably showing up everywhere if you've been browsing fashion websites or Instagram in recent times. The company does not dominate the streetwear scene by accident—it's built on a foundation of bold design, premium quality, and a unique aesthetic that speaks to a generation looking for something different.
            </p>
            <p>
              Trapstar is an alternative streetwear brand mixing dark, rebellious cyberpunk and Christian-inspired themes. Founded in 2020 by Sean Holland and Joseph Pendleton, it's about "finding stars in hell".
            </p>
          </div>
        </section>

        {/* Shipping at a Glance (Table) */}
        <section id="shipping-at-a-glance" className="mb-12 md:mb-16 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">Shipping & Returns at a Glance</h2>
          <div className="w-full text-gray-300 text-sm md:text-base leading-relaxed">
            <p className="mb-6 text-gray-400 text-center">
              Quick overview for common delivery and returns questions. For full details, see the{' '}
              <Link href="/shipping-policy" className="text-white underline underline-offset-4 hover:text-gray-200">
                Shipping Policy
              </Link>
              .
            </p>

            <div className="overflow-x-auto rounded-lg border border-gray-900 w-full">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Shipping and returns overview</caption>
                <thead className="bg-gray-950">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-white font-semibold">Topic</th>
                    <th scope="col" className="px-4 py-3 text-white font-semibold">Typical timeframe</th>
                    <th scope="col" className="px-4 py-3 text-white font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-black">
                  <tr className="border-t border-gray-900">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-200">Order processing</th>
                    <td className="px-4 py-3 text-gray-300">1–2 business days</td>
                    <td className="px-4 py-3 text-gray-400">We prepare and dispatch your order.</td>
                  </tr>
                  <tr className="border-t border-gray-900">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-200">Standard shipping</th>
                    <td className="px-4 py-3 text-gray-300">5–7 business days</td>
                    <td className="px-4 py-3 text-gray-400">Tracking provided.</td>
                  </tr>
                  <tr className="border-t border-gray-900">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-200">Express shipping</th>
                    <td className="px-4 py-3 text-gray-300">2–3 business days</td>
                    <td className="px-4 py-3 text-gray-400">Available at checkout where supported.</td>
                  </tr>
                  <tr className="border-t border-gray-900">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-200">International shipping</th>
                    <td className="px-4 py-3 text-gray-300">7–14 business days</td>
                    <td className="px-4 py-3 text-gray-400">Times vary by destination and customs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs (Section + Schema below) */}
        <section id="faqs" className="mb-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-center gap-2 sm:gap-4 mb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Trapstar FAQs</h2>
            <Link
              href="/faqs"
              className="text-sm md:text-base text-gray-300 hover:text-white underline underline-offset-4"
            >
              View full FAQs
            </Link>
          </div>

          <div className="w-full">
            <div className="divide-y divide-gray-800 rounded-xl border border-gray-900 overflow-hidden bg-gray-950/30">
              <details className="group p-5 md:p-6" open>
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="text-lg md:text-xl font-semibold text-white">What is Trapstar?</span>
                  <span className="mt-1 text-gray-400 group-open:text-white transition-colors">
                    <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 text-gray-400 text-base md:text-lg leading-relaxed">
                  Trapstar is a streetwear brand known for bold graphics, premium materials, and limited drops across tracksuits, jackets, hoodies, tees, and accessories.
                </div>
              </details>

              <details className="group p-5 md:p-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="text-lg md:text-xl font-semibold text-white">Do you ship worldwide?</span>
                  <span className="mt-1 text-gray-400 group-open:text-white transition-colors">
                    <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 text-gray-400 text-base md:text-lg leading-relaxed">
                  Yes, we offer worldwide shipping. Delivery times vary by destination and shipping method.
                </div>
              </details>

              <details className="group p-5 md:p-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="text-lg md:text-xl font-semibold text-white">How do I track my order?</span>
                  <span className="mt-1 text-gray-400 group-open:text-white transition-colors">
                    <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 text-gray-400 text-base md:text-lg leading-relaxed">
                  Once your order ships, you’ll receive a tracking number by email so you can follow your package in transit.
                </div>
              </details>

              <details className="group p-5 md:p-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="text-lg md:text-xl font-semibold text-white">Which sizes should I choose?</span>
                  <span className="mt-1 text-gray-400 group-open:text-white transition-colors">
                    <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 text-gray-400 text-base md:text-lg leading-relaxed">
                  <p>
                    Use our size recommendations and measurements on the Size Guides page before purchasing, especially for a relaxed or oversized fit.
                  </p>
                  <p className="mt-3">
                    <Link href="/size-guides" className="text-white underline underline-offset-4 hover:text-gray-200">
                      View size guides
                    </Link>
                    .
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>

      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Trapstar Official',
            url: 'https://trapstarofficial.store',
            logo: 'https://trapstarofficial.store/trapstar.webp',
            description: 'Official Trapstar streetwear store featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies.',
            sameAs: [],
          }),
        }}
      />

      {/* Structured Data - WebSite with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Trapstar Official',
            url: 'https://trapstarofficial.store',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://trapstarofficial.store/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* Structured Data - BreadcrumbList (Home) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://trapstarofficial.store',
              },
            ],
          }),
        }}
      />

      {/* Structured Data - FAQPage (Homepage FAQs) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is Trapstar?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Trapstar is a streetwear brand known for bold graphics, premium materials, and limited drops across tracksuits, jackets, hoodies, tees, and accessories.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you ship worldwide?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, we offer worldwide shipping. Delivery times vary by destination and shipping method.',
                },
              },
              {
                '@type': 'Question',
                name: 'How do I track my order?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Once your order ships, you’ll receive a tracking number by email so you can follow your package in transit.',
                },
              },
              {
                '@type': 'Question',
                name: 'Which sizes should I choose?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Use our size recommendations and measurements on the Size Guides page before purchasing, especially for a relaxed or oversized fit.',
                },
              },
            ],
          }),
        }}
      />
    </>
  )
}
