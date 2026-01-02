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
}

// Get all products
export function getAllProducts(): Product[] {
  return productsData as Product[]
}

// Get product by slug
export function getProductBySlug(slug: string): Product | undefined {
  return productsData.find((product) => product.slug === slug) as Product | undefined
}

// Get products by category
export function getProductsByCategory(category: string): Product[] {
  return productsData.filter((product) => product.category === category) as Product[]
}

// Search products by title
export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []
  
  return productsData.filter((product) =>
    product.title.toLowerCase().includes(lowerQuery)
  ) as Product[]
}

// Get products by brand (Trapstar only)
export function getProductsByBrand(brand: 'hellstar' | 'trapstar'): Product[] {
  // Only Trapstar products are available
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  return productsData as Product[]
}

// Get products by category and brand (Trapstar only)
export function getProductsByCategoryAndBrand(category: string, brand: 'hellstar' | 'trapstar'): Product[] {
  // Only Trapstar products are available
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  return productsData.filter((product) => {
    return product.category === category
  }) as Product[]
}

