import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import https from 'https'
// Cache functions - dynamic import to prevent client-side bundling

// Cache products for 1 hour, but can be invalidated by webhook
export const revalidate = 3600 // 1 hour

import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Fetch products from WooCommerce (used when cache is populated via lib/products)
function fetchProductsFromWooCommerce(env: WooEnv, page = 1, perPage = 100): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
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
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const products = JSON.parse(data)
            const totalProductsHeader = res.headers['x-wp-total']
            const totalPagesHeader = res.headers['x-wp-totalpages']
            const totalProducts = parseInt(Array.isArray(totalProductsHeader) ? totalProductsHeader[0] : String(totalProductsHeader || '0'))
            const totalPages = parseInt(Array.isArray(totalPagesHeader) ? totalPagesHeader[0] : String(totalPagesHeader || '1'))
            
            // Log for debugging
            if (page === 1) {
              console.log(`📦 Fetching products: Total=${totalProducts}, Pages=${totalPages}, PerPage=${perPage}`)
            }
            
            resolve({ products, totalPages, currentPage: page, totalProducts })
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          // Handle 502 Bad Gateway and other server errors
          if (res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 504) {
            reject(new Error(`WooCommerce server error ${res.statusCode}: Server is temporarily unavailable`))
          } else {
            reject(new Error(`Status ${res.statusCode}: ${data.substring(0, 200)}`))
          }
        }
      })
    })
    
    req.on('error', (error) => {
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

// Convert WooCommerce products to our format
function convertToOurFormat(wooProducts: any[]) {
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
  
  return wooProducts.map((product) => {
    let category = 'hoodies' // default
    if (product.categories && product.categories.length > 0) {
      const wooCategoryName = product.categories[0].name
      category = categoryMap[wooCategoryName] || categoryMap[wooCategoryName.toLowerCase()] || 'hoodies'
    }
    
    // Check meta_data for original category
    if (product.meta_data) {
      const originalCategory = product.meta_data.find((m: any) => m.key === '_original_category')
      if (originalCategory && categoryMap[originalCategory.value]) {
        category = categoryMap[originalCategory.value]
      }
    }
    
    // Generate slug from name
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    const regularPrice = parseFloat(product.regular_price || '0')
    const salePrice = parseFloat(product.sale_price || '0')
    const price = salePrice > 0 ? salePrice : regularPrice
    const discountPrice = salePrice > 0 && salePrice < regularPrice ? salePrice : null
    
    // Use local image path based on SKU
    let localImagePath = ''
    if (product.sku && product.sku.trim()) {
      const skuBase = product.sku.split('-')[0].trim()
      localImagePath = `/products/${skuBase}.jpg`
    } else {
      const nameSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50)
      localImagePath = `/products/${nameSlug}.jpg`
    }
    const imagePath = localImagePath
    
    return {
      id: product.id,
      title: product.name,
      slug: slug,
      category: category,
      price: regularPrice > 0 ? regularPrice : 299.99,
      discountPrice: discountPrice,
      image: imagePath, // Use local image path
      description: product.description || product.short_description || product.name,
      brand: 'Trapstar',
      woocommerceId: product.id,
      externalUrl: product.external_url || '',
      buttonText: product.button_text || 'Buy Now'
    }
  })
}

// GET products from WooCommerce with pagination support
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '12')
  const category = searchParams.get('category') || null
  
  console.log(`🚀 API Route: Fetching products - Page: ${page}, PerPage: ${perPage}, Category: ${category || 'all'}`)
  
  try {
    // OPTIMIZED: Check cache first, but if cache miss, fetch ONLY the requested page
    // This prevents fetching all products when only one page is needed
    const cacheModule = await import('@/lib/cache')
    const cachedProducts = cacheModule.getCachedProducts()
    
    if (cachedProducts && cachedProducts.length > 0) {
      // We have cached products - use them for filtering/pagination
      console.log(`💾 Using cached products (${cachedProducts.length} products) - NO FETCH`)
      
      // If category filter is requested
      if (category) {
        const filteredProducts = cachedProducts.filter((p: any) => p.category === category)
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
        const totalProducts = filteredProducts.length
        const totalPagesFiltered = Math.ceil(totalProducts / perPage)
        
        return NextResponse.json({
          products: paginatedProducts,
          pagination: {
            page,
            perPage,
            totalProducts,
            totalPages: totalPagesFiltered,
            hasNextPage: page < totalPagesFiltered,
            hasPrevPage: page > 1
          }
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        })
      } else {
        // No category filter - paginate all products from cache
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage
        const paginatedProducts = cachedProducts.slice(startIndex, endIndex)
        const totalProducts = cachedProducts.length
        const totalPages = Math.ceil(totalProducts / perPage)
        
        return NextResponse.json({
          products: paginatedProducts,
          pagination: {
            page,
            perPage,
            totalProducts,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        })
      }
    }
    
    // Cache miss - return empty (cache will be populated by getAllProducts())
    // NO DIRECT FETCH - only cache is used
    console.log(`⚠️  Cache miss - returning empty. Cache will be populated by getAllProducts() on first request.`)
    
    return NextResponse.json({
      products: [],
      pagination: {
        page,
        perPage,
        totalProducts: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    // Log all errors for debugging
    console.error('❌ Error fetching from WooCommerce:', error.message || error)
    console.error('Error stack:', error.stack)
    
    // If 502/503/504 error, try to use cached products
    if (error.message?.includes('502') || error.message?.includes('503') || error.message?.includes('504')) {
      console.warn('⚠️  WooCommerce server error, checking cache...')
      const cacheModule = await import('@/lib/cache')
      const cachedProducts = cacheModule.getCachedProducts()
      if (cachedProducts && cachedProducts.length > 0) {
        console.log(`✅ Using cached products (${cachedProducts.length} products) - WooCommerce server is down`)
        
        // For category filtering
        if (category) {
          const filteredProducts = cachedProducts.filter((p: any) => p.category === category)
          const startIndex = (page - 1) * perPage
          const endIndex = startIndex + perPage
          const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
          const totalProducts = filteredProducts.length
          const totalPagesFiltered = Math.ceil(totalProducts / perPage)
          
          return NextResponse.json({
            products: paginatedProducts,
            pagination: {
              page,
              perPage,
              totalProducts,
              totalPages: totalPagesFiltered,
              hasNextPage: page < totalPagesFiltered,
              hasPrevPage: page > 1
            }
          }, {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
          })
        } else {
          // For non-category requests, return first page from cache
          const startIndex = (page - 1) * perPage
          const endIndex = startIndex + perPage
          const paginatedProducts = cachedProducts.slice(startIndex, endIndex)
          const totalProducts = cachedProducts.length
          const totalPages = Math.ceil(totalProducts / perPage)
          
          return NextResponse.json({
            products: paginatedProducts,
            pagination: {
              page,
              perPage,
              totalProducts,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1
            }
          }, {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
          })
        }
      }
    }
    
    // Return empty array if no cache available
    return NextResponse.json({
      products: [],
      pagination: {
        page,
        perPage,
        totalProducts: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  }
}

