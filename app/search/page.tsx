'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchProductsSync } from '@/lib/products-client'
import ProductGrid from '@/components/ProductGrid'
import type { Product } from '@/lib/products-client'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchAndSearch() {
      if (query) {
        try {
          // OPTIMIZED: Use search endpoint or fetch with pagination
          // For now, use cached products from client-side cache
          const results = searchProductsSync(query)
          setProducts(results)
          
          // If no results in cache, try fetching first page and searching
          if (results.length === 0) {
            try {
              const response = await fetch('/api/products?page=1&per_page=100')
              const data = await response.json()
              const fetchedProducts = data.products || []
              const searchResults = fetchedProducts.filter((product: Product) =>
                product.title.toLowerCase().includes(query.toLowerCase())
              )
              setProducts(searchResults)
            } catch (error) {
              console.error('Error fetching products:', error)
            }
          }
        } catch (error) {
          console.error('Error searching products:', error)
          // Fallback to sync search
          const results = searchProductsSync(query)
          setProducts(results)
        }
      } else {
        setProducts([])
      }
    }
    fetchAndSearch()
  }, [query])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          {query ? `Search Results for "${query}"` : 'Search Products'}
        </h1>
        {query && (
          <p className="text-gray-400">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
        )}
        {!query && (
          <p className="text-gray-400">Enter a search term to find products</p>
        )}
      </div>
      {query ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Start typing to search for products</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

