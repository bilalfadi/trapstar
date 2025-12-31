import { getProductBySlug, getProductsByCategory, getAllProducts } from '@/lib/products'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import ProductDetailTabs from '@/components/ProductDetailTabs'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug)

  if (!product) {
    notFound()
  }

  // Calculate discount percentage
  const discountPercent = product.discountPrice && product.price && product.price > 0
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null
  
  // Ensure prices are valid numbers
  const displayPrice = product.price || 0
  const displayDiscountPrice = product.discountPrice || null

  // Generate random social proof numbers based on product ID for consistency
  const itemsSold = 5 + (product.id % 25) // Random between 5-29
  const peopleWatching = 3 + (product.id % 18) // Random between 3-20

  // Get related products (same category, exclude current product)
  const relatedProducts = getProductsByCategory(product.category)
    .filter(p => p.id !== product.id)
    .slice(0, 8)

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
                <span className="text-2xl md:text-3xl font-bold text-white">${displayDiscountPrice.toFixed(2)}</span>
                {discountPercent && (
                  <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-2xl md:text-3xl font-bold text-white">${displayPrice.toFixed(2)}</span>
            )}
            {displayDiscountPrice && displayPrice > 0 && (
              <div className="text-gray-500 text-sm">
                <span className="line-through">${displayPrice.toFixed(2)}</span>
                <span className="ml-2">Original price was: ${displayPrice.toFixed(2)}.</span>
                <span className="text-white ml-1">${displayDiscountPrice.toFixed(2)} Current price is: ${displayDiscountPrice.toFixed(2)}.</span>
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

          {/* Buy Now Button */}
          <button className="bg-white text-black px-8 py-4 font-semibold hover:bg-gray-200 transition-colors duration-200 mb-4 w-full">
            Buy Now
          </button>

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
    </div>
  )
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = getAllProducts()
  return products.map((product) => ({
    slug: product.slug,
  }))
}
