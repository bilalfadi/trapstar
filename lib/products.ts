import productsData from '@/data/products.json'
// Cache functions are server-side only - use dynamic imports
// This prevents 'fs' module from being bundled in client-side code

// Helper function to get cache functions (server-side only)
async function getCacheFunctions() {
  if (typeof window !== 'undefined') {
    return null
  }
  const cacheModule = await import('./cache')
  return {
    getCachedProducts: cacheModule.getCachedProducts,
    saveProductsToCache: cacheModule.saveProductsToCache,
    invalidateCache: cacheModule.invalidateCache
  }
}

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

// Fetch products directly from WooCommerce API (server-side only)
async function fetchProductsFromWooCommerceDirect(): Promise<Product[]> {
  const https = await import('https')
  const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || 'https://payment.trapstarofficial.store/wp'
  const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_065600d609b4e24bd1d8fbbc2cce7ca7c95ff20c'
  const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_5f61b4bb7e6c54ae001f3b12c6d0b9b6bbda6941'

  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/products?per_page=100`
    let baseUrl = WOOCOMMERCE_URL
    
    if (WOOCOMMERCE_URL.endsWith('/wp') || WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/products?per_page=100`
      baseUrl = WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    // Log the actual URL being called for debugging
    console.log(`🔗 WooCommerce API URL: ${apiUrl.href}`)
    console.log(`🔗 Hostname: ${apiUrl.hostname}, Path: ${apiUrl.pathname}`)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname + (apiUrl.search || ''),
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Trapstar-Store/1.0'
      },
      timeout: 30000 // 30 second timeout per request
    }
    
    let allProducts: any[] = []
    let page = 1
    let totalPages = 1
    
    function fetchPage(pageNum: number) {
      const pagePath = `${apiUrl.pathname}?page=${pageNum}&per_page=100${apiUrl.search ? '&' + apiUrl.search.substring(1) : ''}`
      const pageOptions = { ...options, path: pagePath }
      
      const req = https.request(pageOptions, (res: any) => {
        let data = ''
        res.on('data', (chunk: any) => {
          data += chunk
        })
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const products = JSON.parse(data)
              allProducts = allProducts.concat(products)
              const totalProductsHeader = res.headers['x-wp-total']
              const totalPagesHeader = res.headers['x-wp-totalpages']
              const totalProducts = parseInt(String(totalProductsHeader || '0'))
              totalPages = parseInt(String(totalPagesHeader || '1'))
              
              // Log for debugging
              if (pageNum === 1) {
                console.log(`📦 WooCommerce API: Total=${totalProducts}, Pages=${totalPages}`)
                console.log(`🔗 API URL: ${apiUrl.href}`)
              }
              console.log(`✅ Fetched page ${pageNum}/${totalPages}: ${products.length} products`)
              
              if (pageNum < totalPages) {
                fetchPage(pageNum + 1)
              } else {
                // Convert to our format
                const categoryMap: Record<string, string> = {
                  'Bags': 'bags',
                  'Hoodies': 'hoodies',
                  'Jackets': 'jackets',
                  'Short Sets': 'shorts',
                  'Shorts': 'shorts',
                  'T-Shirts': 't-shirts',
                  'T-Shirt': 't-shirts',
                  'Tracksuits': 'tracksuits',
                  'Tracksuit': 'tracksuits',
                  'Accessories': 'accessories'
                }
                
                const converted = allProducts.map((product: any) => {
                  let category = 'hoodies'
                  if (product.categories && product.categories.length > 0) {
                    const wooCategoryName = product.categories[0].name
                    category = categoryMap[wooCategoryName] || categoryMap[wooCategoryName.toLowerCase()] || 'hoodies'
                  }
                  
                  if (product.meta_data) {
                    const originalCategory = product.meta_data.find((m: any) => m.key === '_original_category')
                    if (originalCategory && categoryMap[originalCategory.value]) {
                      category = categoryMap[originalCategory.value]
                    }
                  }
                  
                  const slug = product.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  
                  const regularPrice = parseFloat(product.regular_price || '0')
                  const salePrice = parseFloat(product.sale_price || '0')
                  const price = salePrice > 0 ? salePrice : regularPrice
                  const discountPrice = salePrice > 0 && salePrice < regularPrice ? salePrice : null
                  
                  return {
                    id: product.id,
                    title: product.name,
                    slug: slug,
                    category: category,
                    price: regularPrice > 0 ? regularPrice : 299.99,
                    discountPrice: discountPrice,
                    image: product.images && product.images.length > 0 ? product.images[0].src : '',
                    description: product.description || product.short_description || product.name,
                    brand: 'Trapstar',
                    woocommerceId: product.id,
                    externalUrl: product.external_url || '',
                    buttonText: product.button_text || 'Buy Now'
                  }
                })
                
                console.log(`✅ Successfully converted ${converted.length} products from WooCommerce`)
                resolve(converted)
              }
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            // Handle 502 Bad Gateway and other server errors
            if (res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 504) {
              console.error(`❌ WooCommerce Server Error ${res.statusCode} on page ${pageNum}`)
              console.error(`❌ URL: ${apiUrl.href}`)
              console.error(`❌ Response: ${data.substring(0, 500)}`)
              reject(new Error(`WooCommerce server error ${res.statusCode}: Server is temporarily unavailable. This usually means the WooCommerce server is down or overloaded.`))
            } else {
              console.error(`❌ WooCommerce API Error ${res.statusCode} on page ${pageNum}`)
              console.error(`❌ URL: ${apiUrl.href}`)
              console.error(`❌ Response: ${data.substring(0, 500)}`)
              reject(new Error(`Status ${res.statusCode}: ${data.substring(0, 200)}`))
            }
          }
        })
      })
      
      req.on('error', (error: any) => {
        console.error(`❌ Request error on page ${pageNum}:`, error.message)
        reject(error)
      })
      
      req.on('timeout', () => {
        console.error(`❌ Request timeout on page ${pageNum}`)
        req.destroy()
        reject(new Error('Request timeout'))
      })
      
      req.end()
    }
    
    fetchPage(1)
  })
}

// In-memory cache for current request (prevents multiple parallel requests)
let productsCache: { products: Product[]; timestamp: number } | null = null
const CACHE_TTL = 5000 // 5 seconds cache for same request

// Global fetch lock to prevent parallel fetches across different requests
let fetchInProgress: Promise<Product[]> | null = null

// Get all products - fetches from WooCommerce (server-side) or API route (client-side)
// Uses persistent cache to avoid fetching on every request
export async function getAllProducts(): Promise<Product[]> {
  // Check if we have a recent cache (within same request)
  const now = Date.now()
  if (productsCache && (now - productsCache.timestamp) < CACHE_TTL) {
    console.log(`♻️  Using request-level cached products (${productsCache.products.length} products)`)
    return productsCache.products
  }

  try {
    if (typeof window === 'undefined') {
      // Server-side: Check persistent cache first (BEFORE any fetch)
      // This is CRITICAL - cache check must happen before any fetch
      const cacheFuncs = await getCacheFunctions()
      if (cacheFuncs) {
        const cachedProducts = cacheFuncs.getCachedProducts()
        if (cachedProducts && cachedProducts.length > 0) {
          console.log(`💾 Using cached products (${cachedProducts.length} products) - NO FETCH, cache valid until webhook or 1 hour`)
          productsCache = { products: cachedProducts, timestamp: now }
          return cachedProducts
        }
      }

      // Cache miss - check if fetch is already in progress
      if (fetchInProgress) {
        console.log(`⏳ Fetch already in progress, waiting for it to complete...`)
        try {
          const products = await fetchInProgress
          // After fetch completes, check cache again (might have been saved by the fetch)
          const cacheFuncs = await getCacheFunctions()
          if (cacheFuncs) {
            const freshCache = cacheFuncs.getCachedProducts()
            if (freshCache && freshCache.length > 0) {
              console.log(`✅ Using products from completed fetch (${freshCache.length} products)`)
              productsCache = { products: freshCache, timestamp: now }
              return freshCache
            }
          }
          productsCache = { products, timestamp: now }
          return products
        } catch (error) {
          // If fetch failed, check cache one more time
          const cacheFuncs = await getCacheFunctions()
          if (cacheFuncs) {
            const fallbackCache = cacheFuncs.getCachedProducts()
            if (fallbackCache && fallbackCache.length > 0) {
              console.log(`⚠️  Fetch failed, using cached products (${fallbackCache.length} products)`)
              productsCache = { products: fallbackCache, timestamp: now }
              return fallbackCache
            }
          }
          throw error
        }
      }

      // Cache miss and no fetch in progress - fetch from WooCommerce
      console.log('🔄 Cache miss - Fetching products from WooCommerce (server-side)...')
      
      // Create fetch promise and store it in lock
      fetchInProgress = (async () => {
        try {
          // Fetch from WooCommerce with optimized timeout
          const products = await Promise.race([
            fetchProductsFromWooCommerceDirect(),
            new Promise<Product[]>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 60000) // 60 second timeout
            )
          ])
          console.log(`✅ Successfully fetched ${products.length} products from WooCommerce`)
          
          // Save to persistent cache only if fetch was successful
          if (products && products.length > 0) {
            const cacheFuncs = await getCacheFunctions()
            if (cacheFuncs) {
              cacheFuncs.saveProductsToCache(products)
              console.log(`💾 Products saved to cache - will use cached data for next 1 hour or until webhook invalidates`)
            }
          }
          
          return products
        } finally {
          // Clear fetch lock after completion
          fetchInProgress = null
        }
      })()

      try {
        const products = await fetchInProgress
        
        // Cache for this request
        productsCache = { products, timestamp: now }
        return products
      } catch (fetchError: any) {
        // Clear fetch lock on error
        fetchInProgress = null
        
        // If fetch fails with 502/503/504, check extended cache
        if (fetchError.message?.includes('502') || fetchError.message?.includes('503') || fetchError.message?.includes('504')) {
          console.warn('⚠️  WooCommerce server error detected, checking extended cache...')
          const cacheFuncs = await getCacheFunctions()
          if (cacheFuncs) {
            const extendedCache = cacheFuncs.getCachedProducts()
            if (extendedCache && extendedCache.length > 0) {
              console.log(`✅ Using extended cache (${extendedCache.length} products) - WooCommerce server is down`)
              productsCache = { products: extendedCache, timestamp: now }
              return extendedCache
            }
          }
        }
        // Re-throw error to be handled by outer catch
        throw fetchError
      }
    } else {
      // Client-side: fetch from API route (API route will use its own cache)
      console.log('🔄 Fetching products from API route (client-side)...')
      const response = await fetch('/api/products', {
        cache: 'default', // Allow browser cache
        next: { revalidate: 3600 }, // Revalidate every hour
        signal: AbortSignal.timeout(20000) // 20 second timeout (optimized)
      })
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      const products = await response.json()
      console.log(`✅ Successfully fetched ${products.length} products from API`)
      
      // Cache for this request
      productsCache = { products: products || [], timestamp: now }
      return products || []
    }
  } catch (error: any) {
    // Log error details for debugging
    console.error('❌ Error fetching products from WooCommerce:', {
      message: error?.message,
      type: error?.name,
      timeout: error?.message?.includes('Timeout'),
      socketError: error?.message?.includes('socket'),
      badGateway: error?.message?.includes('502'),
    })
    
    // If we have cached products, return them even if fresh fetch failed
    if (typeof window === 'undefined') {
      const cacheFuncs = await getCacheFunctions()
      if (cacheFuncs) {
        const cachedProducts = cacheFuncs.getCachedProducts()
        if (cachedProducts && cachedProducts.length > 0) {
          console.log(`⚠️  WooCommerce fetch failed, but using cached products (${cachedProducts.length} products)`)
          productsCache = { products: cachedProducts, timestamp: Date.now() }
          return cachedProducts
        }
      }
    }
    
    // No cache available - return empty array
    console.log('⚠️  WooCommerce fetch failed and no cache available. Returning empty array.')
    return [] // Return empty instead of fallback to force WooCommerce data
  }
}

// Export function to invalidate cache (used by webhook)
export async function clearProductsCache(): Promise<void> {
  if (typeof window === 'undefined') {
    const cacheFuncs = await getCacheFunctions()
    if (cacheFuncs) {
      cacheFuncs.invalidateCache()
    }
  }
  productsCache = null
  fetchInProgress = null // Clear fetch lock on cache invalidation
}

// Synchronous version for backward compatibility (uses local data)
export function getAllProductsSync(): Product[] {
  return productsData as Product[]
}

// Get product by slug - async version
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getAllProducts()
  return products.find((product) => product.slug === slug)
}

// Get product by slug - sync version (for backward compatibility)
export function getProductBySlugSync(slug: string): Product | undefined {
  return productsData.find((product) => product.slug === slug) as Product | undefined
}

// Get products by category - async version
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getAllProducts()
  return products.filter((product) => product.category === category)
}

// Fetch products directly from WooCommerce API with pagination (server-side only)
async function fetchPaginatedProductsFromWooCommerce(page: number = 1, perPage: number = 12, category?: string): Promise<{
  products: Product[]
  pagination: {
    page: number
    perPage: number
    totalProducts: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}> {
  const https = await import('https')
  const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || 'https://payment.trapstarofficial.store/wp'
  const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_065600d609b4e24bd1d8fbbc2cce7ca7c95ff20c'
  const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_5f61b4bb7e6c54ae001f3b12c6d0b9b6bbda6941'

  const categoryMap: Record<string, string> = {
    'Bags': 'bags',
    'Hoodies': 'hoodies',
    'Jackets': 'jackets',
    'Short Sets': 'shorts',
    'Shorts': 'shorts',
    'T-Shirts': 't-shirts',
    'T-Shirt': 't-shirts',
    'Tracksuits': 'tracksuits',
    'Tracksuit': 'tracksuits',
    'Accessories': 'accessories'
  }

  // If category is specified, we need to fetch all products and filter
  // This is because WooCommerce doesn't easily support category filtering in pagination
  if (category) {
    // Fetch all products for category filtering
    const allProducts = await getAllProducts()
    const filteredProducts = allProducts.filter(p => p.category === category)
    
    // Apply pagination to filtered results
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
    const totalProducts = filteredProducts.length
    const totalPages = Math.ceil(totalProducts / perPage)
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        perPage,
        totalProducts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  }

  // For non-category requests, fetch directly with pagination
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`
    let baseUrl = WOOCOMMERCE_URL
    
    if (WOOCOMMERCE_URL.endsWith('/wp') || WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`
      baseUrl = WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname + (apiUrl.search || ''),
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    }
    
    const req = https.request(options, (res: any) => {
      let data = ''
      res.on('data', (chunk: any) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const products = JSON.parse(data)
            const totalProductsHeader = res.headers['x-wp-total']
            const totalPagesHeader = res.headers['x-wp-totalpages']
            const totalProducts = parseInt(String(totalProductsHeader || '0'))
            const totalPages = parseInt(String(totalPagesHeader || '1'))
            
            // Convert to our format
            const convertedProducts = products.map((product: any) => {
              let productCategory = 'hoodies'
              if (product.categories && product.categories.length > 0) {
                const wooCategoryName = product.categories[0].name
                productCategory = categoryMap[wooCategoryName] || categoryMap[wooCategoryName.toLowerCase()] || 'hoodies'
              }
              
              if (product.meta_data) {
                const originalCategory = product.meta_data.find((m: any) => m.key === '_original_category')
                if (originalCategory && categoryMap[originalCategory.value]) {
                  productCategory = categoryMap[originalCategory.value]
                }
              }
              
              const slug = product.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
              
              const regularPrice = parseFloat(product.regular_price || '0')
              const salePrice = parseFloat(product.sale_price || '0')
              const discountPrice = salePrice > 0 && salePrice < regularPrice ? salePrice : null
              
              return {
                id: product.id,
                title: product.name,
                slug: slug,
                category: productCategory,
                price: regularPrice > 0 ? regularPrice : 299.99,
                discountPrice: discountPrice,
                image: product.images && product.images.length > 0 ? product.images[0].src : '',
                description: product.description || product.short_description || product.name,
                brand: 'Trapstar',
                woocommerceId: product.id,
                externalUrl: product.external_url || '',
                buttonText: product.button_text || 'Buy Now'
              }
            })
            
            resolve({
              products: convertedProducts,
              pagination: {
                page,
                perPage,
                totalProducts,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
              }
            })
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`))
        }
      })
    })
    
    req.on('error', (error: any) => {
      console.error(`❌ Request error on page ${page}:`, error.message)
      reject(error)
    })
    
    req.on('timeout', () => {
      console.error(`❌ Request timeout on page ${page}`)
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

// Get paginated products - fetches only requested page from WooCommerce
export async function getPaginatedProducts(page: number = 1, perPage: number = 12, category?: string): Promise<{
  products: Product[]
  pagination: {
    page: number
    perPage: number
    totalProducts: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: fetch directly from WooCommerce
      return await fetchPaginatedProductsFromWooCommerce(page, perPage, category)
    } else {
      // Client-side: fetch from API route
      const categoryParam = category ? `&category=${category}` : ''
      const response = await fetch(`/api/products?page=${page}&per_page=${perPage}${categoryParam}`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      return data
    }
  } catch (error: any) {
    console.error('❌ Error fetching paginated products:', error.message)
    return {
      products: [],
      pagination: {
        page,
        perPage,
        totalProducts: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  }
}

// Get products by category - sync version
export function getProductsByCategorySync(category: string): Product[] {
  return productsData.filter((product) => product.category === category) as Product[]
}

// Search products by title - async version
export async function searchProducts(query: string): Promise<Product[]> {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []
  
  const products = await getAllProducts()
  return products.filter((product) =>
    product.title.toLowerCase().includes(lowerQuery)
  )
}

// Search products by title - sync version
export function searchProductsSync(query: string): Product[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []
  
  return productsData.filter((product) =>
    product.title.toLowerCase().includes(lowerQuery)
  ) as Product[]
}

// Get products by brand (Trapstar only) - async version
export async function getProductsByBrand(brand: 'hellstar' | 'trapstar'): Promise<Product[]> {
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  return await getAllProducts()
}

// Get products by brand - sync version
export function getProductsByBrandSync(brand: 'hellstar' | 'trapstar'): Product[] {
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  return productsData as Product[]
}

// Get products by category and brand (Trapstar only) - async version
export async function getProductsByCategoryAndBrand(category: string, brand: 'hellstar' | 'trapstar'): Promise<Product[]> {
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  const products = await getAllProducts()
  return products.filter((product) => {
    return product.category === category
  })
}

// Get products by category and brand - sync version
export function getProductsByCategoryAndBrandSync(category: string, brand: 'hellstar' | 'trapstar'): Product[] {
  if (brand.toLowerCase() !== 'trapstar') {
    return []
  }
  return productsData.filter((product) => {
    return product.category === category
  }) as Product[]
}

