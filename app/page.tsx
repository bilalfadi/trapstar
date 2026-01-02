import { getProductsByCategoryAndBrand } from '@/lib/products'
import ProductGrid from '@/components/ProductGrid'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trapstar Official Store - Premium Streetwear Collection | trapstarofficial.store',
  description: 'Shop the latest Trapstar collection featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies. Official Trapstar streetwear with bold designs and quality materials. Free shipping available.',
  keywords: 'Trapstar, Trapstar Official, streetwear, tracksuits, jackets, hoodies, t-shirts, bags, premium streetwear, trapstarofficial.store',
  openGraph: {
    title: 'Trapstar Official Store - Premium Streetwear Collection',
    description: 'Shop the latest Trapstar collection featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies.',
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
    title: 'Trapstar Official Store - Premium Streetwear Collection',
    description: 'Shop the latest Trapstar collection featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies.',
    images: ['https://trapstarofficial.store/trapstar.webp'],
  },
  alternates: {
    canonical: 'https://trapstarofficial.store',
  },
}

export default function Home() {
  // Get Trapstar products by category for homepage sections (only categories with Trapstar products)
  // Order: Tracksuits (31), Jackets (27), Shorts (21), T-Shirts (9), Bags (7), Hoodies (2)
  const tracksuits = getProductsByCategoryAndBrand('tracksuits', 'trapstar').slice(0, 8)
  const jackets = getProductsByCategoryAndBrand('jackets', 'trapstar').slice(0, 8)
  const shorts = getProductsByCategoryAndBrand('shorts', 'trapstar').slice(0, 8)
  const tshirts = getProductsByCategoryAndBrand('t-shirts', 'trapstar').slice(0, 8)
  const bags = getProductsByCategoryAndBrand('bags', 'trapstar').slice(0, 8)
  const hoodies = getProductsByCategoryAndBrand('hoodies', 'trapstar').slice(0, 8)

  return (
    <>
      {/* Hero Section - Promotional Banner */}
      <section className="relative w-full bg-black border-b border-gray-900">
        <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
          <Image
            src="/trapstar.webp"
            alt="Trapstar Official Hero"
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>
      </section>

      {/* Category Sections - Only Trapstar Categories */}
      <div id="collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Tracksuits - 31 products */}
        {tracksuits.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar Tracksuits</h2>
              <div className="max-w-4xl">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar Jackets</h2>
              <div className="max-w-4xl">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar Shorts</h2>
              <div className="max-w-4xl">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar T-Shirts</h2>
              <div className="max-w-4xl">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar Bags</h2>
              <div className="max-w-4xl">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Trapstar Hoodies</h2>
              <div className="max-w-4xl space-y-4">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                  The Trapstar hoodie's popularity comes from its blend of premium quality, striking graphics, and streetwear credibility. It is a badge of style for the brave, as celebrities, rappers, and influencers have been spotted wearing these distinctive pieces.
                </p>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed">
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
        <section className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8">Trapstar Overview</h2>
          <div className="text-gray-300 space-y-5 md:space-y-6 max-w-4xl text-base md:text-lg leading-relaxed">
            <p>
              The Streetwear Brand Taking Over Your Wardrobe Is Trapstar. Trapstar is probably showing up everywhere if you've been browsing fashion websites or Instagram in recent times. The company does not dominate the streetwear scene by accident—it's built on a foundation of bold design, premium quality, and a unique aesthetic that speaks to a generation looking for something different.
            </p>
            <p>
              Trapstar is an alternative streetwear brand mixing dark, rebellious cyberpunk and Christian-inspired themes. Founded in 2020 by Sean Holland and Joseph Pendleton, it's about "finding stars in hell".
            </p>
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
    </>
  )
}
