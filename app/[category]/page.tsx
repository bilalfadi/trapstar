import { getAllProducts, getProductBySlug } from '@/lib/products'
import ProductGrid from '@/components/ProductGrid'
import ProductDetailTabs from '@/components/ProductDetailTabs'
import Pagination from '@/components/Pagination'
import PriceDisplay from '@/components/PriceDisplay'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

// Use ISR (Incremental Static Regeneration) - pages are cached and revalidated every hour
// This provides fast page loads while keeping data fresh
export const revalidate = 3600 // Revalidate every hour (3600 seconds)

interface CategoryPageProps {
  params: {
    category: string
  }
  searchParams: { page?: string }
}

const validCategories = ['hoodies', 't-shirts', 'tracksuits', 'sweatpants', 'shorts', 'jackets', 'jeans', 'beanies', 'hats', 'ski-masks', 'long-sleeves', 'sweaters', 'pants', 'bags', 'collaborations']

// Category-specific descriptions for Trapstar
const categoryDescriptions: Record<string, string> = {
  'hoodies': "The Trapstar hoodie's popularity comes from its blend of premium quality, striking graphics, and streetwear credibility. It is a badge of style for the brave, as celebrities, rappers, and influencers have been spotted wearing these distinctive pieces.",
  't-shirts': "Trapstar is not an established brand. The loudness of their T-shirts is not childish. The designs carry some real weight—metaphorically and physically. It is not thin cotton that deteriorates after two washes.",
  'tracksuits': "Trapstar tracksuits are popular because they are both fashion-forward and wearable because they combine premium comfort with bold streetwear design. The brand's edgy graphics, quality materials, and limited releases make them a must-have for streetwear.",
  'sweatpants': "Trapstar Sweatpants' Rebirth. Because they combine comfort, toughness, and edge in a way that fits today's culture, Trapstar sweatpants have become a must-have for streetwear. Consistent design, quality materials, and that signature Trapstar aesthetic make these sweatpants more than just loungewear—they're a statement piece.",
  'shorts': "Trapstar Shorts are athletic shorts of high quality made with streetwear culture in mind. They frequently have eye-catching graphic prints, high-quality materials, and a distinct relaxed fit that will make you stand out.",
  'jackets': "Trapstar jackets combine premium materials with bold streetwear designs. From leather jackets to track jackets, each piece features the brand's signature aesthetic and quality craftsmanship.",
  'jeans': "Trapstar jeans feature unique designs with raw edges and airbrushed details. Made with premium denim, these jeans offer both style and durability for the modern streetwear enthusiast.",
  'beanies': "Stay warm and stylish with Trapstar beanies. Featuring the brand's iconic logos and designs, these beanies are perfect for completing your streetwear look.",
  'hats': "From snapback hats to fitted caps, Trapstar offers a wide range of headwear. Each hat features unique designs, premium materials, and the brand's distinctive streetwear aesthetic.",
  'ski-masks': "Trapstar ski masks combine functionality with streetwear style. Perfect for cold weather and making a bold fashion statement.",
  'long-sleeves': "Trapstar long sleeve shirts offer comfort and style with the brand's signature designs. Perfect for layering or wearing on their own.",
  'sweaters': "Trapstar sweaters provide warmth and style with premium materials and distinctive designs. Perfect for the colder months.",
  'pants': "Trapstar pants combine comfort and style with the brand's signature aesthetic. From track pants to casual wear, each piece offers quality and design.",
  'bags': "Complete your streetwear look with Trapstar bags. From cross-body bags to backpacks, each piece features the brand's iconic logos and premium quality.",
  'collaborations': "Exclusive Trapstar collaborations featuring unique designs and limited edition pieces from special partnerships."
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const slug = params.category
  
  // Check if it's a valid category
  if (validCategories.includes(slug)) {
    const categoryName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // OPTIMIZED: Fetch only first page to get count (not all products)
    const { getPaginatedProducts } = await import('@/lib/products')
    const result = await getPaginatedProducts(1, 12, slug)
    const productCount = result.pagination.totalProducts
    const description = categoryDescriptions[slug] || `Shop premium ${categoryName.toLowerCase()} from Trapstar Official. Quality streetwear with bold designs.`

    return {
      title: `Trapstar ${categoryName} Collection | ${productCount} Products | trapstarofficial.store`,
      description: `${description} Browse ${productCount} premium ${categoryName.toLowerCase()} from Trapstar Official. Free shipping available.`,
      keywords: `Trapstar ${categoryName}, ${slug}, streetwear, ${categoryName.toLowerCase()}, trapstarofficial.store`,
      openGraph: {
        title: `Trapstar ${categoryName} Collection | ${productCount} Products`,
        description: description,
        url: `https://trapstarofficial.store/${slug}`,
        siteName: 'Trapstar Official',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Trapstar ${categoryName} Collection`,
        description: description,
      },
      alternates: {
        canonical: `https://trapstarofficial.store/${slug}`,
      },
    }
  }

  // Check if it's a product - fetch only this product (optimized)
  const { getProductBySlug } = await import('@/lib/products')
  const product = await getProductBySlug(slug)
  if (product) {
    const categoryName = product.category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return {
      title: `${product.title} | Trapstar Official ${categoryName} | trapstarofficial.store`,
      description: `Buy ${product.title} from Trapstar Official. Premium ${categoryName.toLowerCase()} with quality materials and bold streetwear design. ${product.description || `Shop now at trapstarofficial.store`}`,
      keywords: `${product.title}, Trapstar ${categoryName}, streetwear, ${product.category}, trapstarofficial.store`,
      openGraph: {
        title: `${product.title} | Trapstar Official`,
        description: product.description || `Premium ${categoryName.toLowerCase()} from Trapstar Official. Shop now at trapstarofficial.store`,
        url: `https://trapstarofficial.store/${product.slug}`,
        siteName: 'Trapstar Official',
        images: [
          {
            url: product.image.startsWith('http') ? product.image : `https://trapstarofficial.store${product.image}`,
            width: 1200,
            height: 1200,
            alt: product.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.title} | Trapstar Official`,
        description: product.description || `Premium ${categoryName.toLowerCase()} from Trapstar Official`,
        images: [product.image.startsWith('http') ? product.image : `https://trapstarofficial.store${product.image}`],
      },
      alternates: {
        canonical: `https://trapstarofficial.store/${product.slug}`,
      },
    }
  }

  return {
    title: 'Page Not Found | Trapstar Official',
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const slug = params.category
  const currentPage = parseInt(searchParams.page || '1')
  const perPage = 12

  // Check if it's a valid category
  if (validCategories.includes(slug)) {
    // OPTIMIZED: Fetch only this category's products (not all products)
    // This makes category pages load much faster
    const { getPaginatedProducts } = await import('@/lib/products')
    const result = await getPaginatedProducts(currentPage, perPage, slug)
    const categoryProducts = result.products
    const totalProducts = result.pagination.totalProducts
    const totalPages = result.pagination.totalPages
    
    // Products are already paginated from getPaginatedProducts
    const trapstarProducts = categoryProducts
    
    const pagination = {
      page: currentPage,
      perPage,
      totalProducts,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
    
    const categoryName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    const description = categoryDescriptions[slug] || ''

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">{categoryName}</h1>
          <p className="text-gray-400 mb-3 md:mb-6 text-sm md:text-base">
            {totalProducts > 0 ? `${totalProducts} products available` : 'No products available'}
          </p>
        </div>

        {/* Trapstar Products Section */}
        {trapstarProducts.length > 0 ? (
          <>
            <section className="mb-16 md:mb-20">
              <ProductGrid products={trapstarProducts} />
              {description && (
                <div className="mt-8">
                  <p className="text-gray-400 max-w-3xl text-sm md:text-base leading-relaxed">{description}</p>
                </div>
              )}
            </section>
            
            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              basePath={`/${slug}`}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found in this category.</p>
          </div>
        )}

        {/* Structured Data - CollectionPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `Trapstar ${categoryName} Collection`,
              description: description,
              url: `https://trapstarofficial.store/${slug}`,
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: totalProducts,
                itemListElement: trapstarProducts.slice(0, 10).map((product, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Product',
                    name: product.title,
                    url: `https://trapstarofficial.store/${product.slug}`,
                    image: product.image.startsWith('http') ? product.image : `https://trapstarofficial.store${product.image}`,
                  },
                })),
              },
            }),
          }}
        />
      </div>
    )
  }

  // Check if it's a product - fetch only this product (optimized)
  const { getProductBySlug, getProductsByCategory } = await import('@/lib/products')
  const product = await getProductBySlug(slug)
  if (product) {
    const discountPercent = product.discountPrice && product.price && product.price > 0
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null
    
    const displayPrice = product.price || 0
    const displayDiscountPrice = product.discountPrice || null
    const itemsSold = 5 + (product.id % 25)
    const peopleWatching = 3 + (product.id % 18)
    // Fetch only related products from same category (optimized)
    const categoryProducts = await getProductsByCategory(product.category)
    const relatedProducts = categoryProducts
      .filter(p => p.id !== product.id)
      .slice(0, 8)
    const categoryName = product.category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16">
          {/* Product Image */}
          <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
            <img
              src={product.image || ''}
              alt={product.title}
              className="w-full h-full object-cover cursor-pointer"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{product.title}</h1>
            
            {/* Price with Discount Badge */}
            <div className="mb-4">
              {displayDiscountPrice ? (
                <div className="flex items-center space-x-3 mb-2">
                  <PriceDisplay 
                    price={product.price} 
                    discountPrice={product.discountPrice}
                    className="text-2xl md:text-3xl font-bold text-white"
                    discountClassName="text-gray-500 text-sm"
                  />
                  {discountPercent && (
                    <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              ) : (
                <PriceDisplay 
                  price={product.price}
                  className="text-2xl md:text-3xl font-bold text-white"
                />
              )}
              {displayDiscountPrice && displayPrice > 0 && (
                <div className="text-gray-500 text-sm mt-2">
                  <PriceDisplay 
                    price={product.price} 
                    discountPrice={product.discountPrice}
                    className="text-white"
                    discountClassName="line-through text-gray-500"
                  />
                </div>
              )}
            </div>

            {/* Social Proof */}
            <div className="mb-6 text-sm text-gray-400">
              <p>{itemsSold} Items sold in last 3 minutes</p>
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Select Size <span className="text-red-500">*</span>
              </label>
              <select className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-white">
                <option>Select an option...</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>

            {/* Buy Now → yahi checkout (frontend); order yahan se, sirf payment backend/Ziina pe */}
            <Link
              href={`/checkout?product=${product.slug}`}
              className="bg-white text-black px-8 py-4 font-semibold hover:bg-gray-200 transition-colors duration-200 mb-4 w-full text-center block"
            >
              {product.buttonText || 'Buy Now'}
            </Link>

            {/* Social Proof */}
            <div className="mb-6 text-sm text-gray-400">
              <p>{peopleWatching} People watching this product now!</p>
            </div>

            {/* Share Section */}
            <div className="mb-6">
              <p className="text-white font-medium mb-2">Share:</p>
              <div className="flex space-x-3">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 3.305-2.143 4.348-1.247 1.043-2.777 1.565-4.59 1.565-.169 0-.358-.006-.565-.019a3.936 3.936 0 01-.565-.019c-.169 0-.358.006-.565.019-1.813 0-3.343-.522-4.59-1.565-1.247-1.043-1.974-2.49-2.143-4.348C1.896 6.302 1.896 5.698 2.143 4.348c.169-1.858.896-3.305 2.143-4.348C5.533-.043 7.063-.565 8.876-.565c.169 0 .358.006.565.019.169 0 .358-.006.565-.019 1.813 0 3.343.522 4.59 1.565 1.247 1.043 1.974 2.49 2.143 4.348.169 1.858.169 2.462 0 3.812z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <ProductDetailTabs product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Related products</h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}

        {/* Structured Data - Product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.title,
              description: product.description || product.title,
              image: product.image.startsWith('http') ? product.image : `https://trapstarofficial.store${product.image}`,
              brand: {
                '@type': 'Brand',
                name: 'Trapstar',
              },
              category: categoryName,
              offers: {
                '@type': 'Offer',
                url: `https://trapstarofficial.store/${product.slug}`,
                priceCurrency: 'USD',
                price: displayDiscountPrice || displayPrice,
                availability: 'https://schema.org/InStock',
                priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.5',
                reviewCount: '127',
              },
            }),
          }}
        />

        {/* Structured Data - BreadcrumbList */}
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
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: categoryName,
                  item: `https://trapstarofficial.store/${product.category}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: product.title,
                  item: `https://trapstarofficial.store/${product.slug}`,
                },
              ],
            }),
          }}
        />
      </div>
    )
  }

  // Not a category or product
  console.warn(`❌ Page not found - Slug: ${slug}, Valid categories: ${validCategories.join(', ')}`)
  notFound()
}

