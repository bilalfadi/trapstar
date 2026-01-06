'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { convertPrice, formatPrice, getCurrencyInfo } from '@/lib/currency'

interface Product {
  id: number
  title: string
  slug: string
  category: string
  price: number | null
  discountPrice: number | null
  image: string
  description: string
  brand?: string
}

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [currency, setCurrency] = useState('USD')
  const [countryCode, setCountryCode] = useState('US')

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrency(e.detail.currency)
      setCountryCode(e.detail.countryCode)
    }

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener)
  }, [])

  // Ensure prices are valid numbers
  const basePrice = product.price || 0
  const baseDiscountPrice = product.discountPrice || null
  
  // Convert prices to selected currency
  const currencyInfo = getCurrencyInfo(countryCode)
  const displayPrice = convertPrice(basePrice, 'USD', currencyInfo.code)
  const displayDiscountPrice = baseDiscountPrice ? convertPrice(baseDiscountPrice, 'USD', currencyInfo.code) : null
  
  // Calculate discount percentage
  const discountPercent = displayDiscountPrice && basePrice > 0
    ? Math.round(((basePrice - (baseDiscountPrice || 0)) / basePrice) * 100)
    : null

  return (
    <Link href={`/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-gray-900 rounded-lg">
        {/* Discount Badge */}
        {discountPercent && (
          <div className="absolute top-2 left-2 z-10 bg-black text-white px-2 py-1 text-xs font-bold">
            {discountPercent}%
          </div>
        )}

        {/* Product Image - Using regular img tag to avoid Next.js optimization timeout */}
        <div className="relative w-full aspect-square bg-gray-800 overflow-hidden">
          {product.image && product.image.trim() !== '' ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              onError={(e) => {
                console.warn('Local image failed to load:', product.image, 'for product:', product.title)
                // Try to load original WooCommerce image as fallback
                const target = e.target as HTMLImageElement
                // If local image fails, try to get original URL from product data
                // For now, just show placeholder
                target.style.display = 'none'
                const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement
                if (placeholder) {
                  placeholder.style.display = 'flex'
                }
              }}
            />
          ) : null}
          {/* Placeholder that shows when image fails or doesn't exist */}
          <div className={`image-placeholder w-full h-full bg-gray-800 flex items-center justify-center absolute inset-0 ${product.image && product.image.trim() !== '' ? 'hidden' : ''}`}>
            <span className="text-gray-600 text-sm">No Image</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 md:p-4">
          <h3 className="text-white font-medium mb-2 text-sm md:text-base group-hover:text-gray-300 transition-colors line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center space-x-2">
            {displayDiscountPrice ? (
              <>
                <span className="text-white font-semibold text-sm md:text-base">
                  {formatPrice(displayDiscountPrice, currencyInfo.code, currencyInfo.symbol)}
                </span>
                <span className="text-gray-500 line-through text-xs md:text-sm">
                  {formatPrice(displayPrice, currencyInfo.code, currencyInfo.symbol)}
                </span>
              </>
            ) : (
              <span className="text-white font-semibold text-sm md:text-base">
                {formatPrice(displayPrice, currencyInfo.code, currencyInfo.symbol)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

