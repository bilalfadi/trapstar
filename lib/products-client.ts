// Client-safe product functions (no server-side dependencies)
// This file can be safely imported in client components

import productsData from '@/data/products.json'

export interface Product {
  id: number
  title: string
  slug: string
  category: string
  price: number | null
  discountPrice: number | null
  image: string
  description: string
  brand?: string
  woocommerceId?: number
  externalUrl?: string
  buttonText?: string
}

// Search products by title - sync version (client-safe)
export function searchProductsSync(query: string): Product[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []
  
  return productsData.filter((product) =>
    product.title.toLowerCase().includes(lowerQuery)
  ) as Product[]
}

// Get all products sync (client-safe, uses local data only)
export function getAllProductsSync(): Product[] {
  return productsData as Product[]
}

