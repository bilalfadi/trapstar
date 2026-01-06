import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import https from 'https'
// Cache functions - dynamic import to prevent client-side bundling

// Cache products for 1 hour, but can be invalidated by webhook
export const revalidate = 3600 // 1 hour

const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || 'https://payment.trapstarofficial.store/wp'
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_065600d609b4e24bd1d8fbbc2cce7ca7c95ff20c'
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_5f61b4bb7e6c54ae001f3b12c6d0b9b6bbda6941'

// Fetch products from WooCommerce
function fetchProductsFromWooCommerce(page = 1, perPage = 100): Promise<any> {
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
}

// GET products from WooCommerce with pagination support
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '12')
  const category = searchParams.get('category') || null
  
  console.log(`🚀 API Route: Fetching products - Page: ${page}, PerPage: ${perPage}, Category: ${category || 'all'}`)
  
  try {
    // CRITICAL: Check cache FIRST before any fetch
    // Use getAllProducts which handles cache properly
    const { getAllProducts } = await import('@/lib/products')
    const allCachedProducts = await getAllProducts()
    
    if (allCachedProducts && allCachedProducts.length > 0) {
      // We have cached products - use them
      console.log(`💾 Using cached products from getAllProducts (${allCachedProducts.length} products) - NO FETCH`)
      
      // If category filter is requested
      if (category) {
        const filteredProducts = allCachedProducts.filter((p: any) => p.category === category)
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
        // No category filter - paginate all products
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage
        const paginatedProducts = allCachedProducts.slice(startIndex, endIndex)
        const totalProducts = allCachedProducts.length
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
    
    // If we reach here, cache was empty (shouldn't happen if cache is working)
    // Fallback to direct fetch (but this should rarely happen)
    console.warn('⚠️  Cache was empty, falling back to direct fetch (this should be rare)')
    
    // If category filter is requested, we need to fetch all and filter
    if (category) {
      let allProducts: any[] = []
      
      // Cache miss - fetch all products from WooCommerce
      console.log(`📥 Cache miss - Fetching all products for category filter...`)
      let currentPage = 1
      let totalPages = 1
      
      do {
        console.log(`📥 Fetching page ${currentPage} for category filter...`)
        const result = await fetchProductsFromWooCommerce(currentPage, 100)
        allProducts = allProducts.concat(result.products)
        totalPages = result.totalPages
        currentPage++
      } while (currentPage <= totalPages)
      
      // Convert and cache all products
      const convertedAll = convertToOurFormat(allProducts)
      const cacheModule = await import('@/lib/cache')
      cacheModule.saveProductsToCache(convertedAll)
      
      // Filter by category (now using converted format)
      const filteredProducts = convertedAll.filter((product: any) => product.category === category)
      
      // Apply pagination to filtered results
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
      // For non-category requests, check cache first
      const cacheModule = await import('@/lib/cache')
      const cachedAllProducts = cacheModule.getCachedProducts()
      
      if (cachedAllProducts && cachedAllProducts.length > 0) {
        // Use cached products and paginate
        console.log(`💾 Using cached products for pagination (${cachedAllProducts.length} products)`)
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage
        const paginatedProducts = cachedAllProducts.slice(startIndex, endIndex)
        const totalProducts = cachedAllProducts.length
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
      
      // Cache miss - fetch ALL products from WooCommerce and cache them
      // This ensures we have all products cached for future requests
      console.log(`📥 Cache miss - Fetching ALL products from WooCommerce to cache...`)
      
      // First, try to get all products using getAllProducts (which handles caching)
      const { getAllProducts } = await import('@/lib/products')
      const allProducts = await getAllProducts()
      
      if (allProducts && allProducts.length > 0) {
        // Use cached products and paginate
        console.log(`💾 Using fetched products for pagination (${allProducts.length} products)`)
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage
        const paginatedProducts = allProducts.slice(startIndex, endIndex)
        const totalProducts = allProducts.length
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
      
      // Fallback: fetch only requested page if getAllProducts fails
      console.log(`📥 Fallback: Fetching page ${page} from WooCommerce...`)
      const result = await fetchProductsFromWooCommerce(page, perPage)
      
      if (result.products.length === 0) {
        console.warn('⚠️  No products fetched! Returning empty array.')
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
          }
        })
      }
      
      const convertedProducts = convertToOurFormat(result.products)
      console.log(`✅ Converted products: ${convertedProducts.length}`)
      
      // If this is page 1, try to cache all products for future requests
      if (page === 1 && result.totalPages > 1) {
        // Use getAllProducts to fetch and cache all products in background
        // This will cache all products for future requests
        import('@/lib/products').then(({ getAllProducts }) => {
          getAllProducts().catch(err => {
            console.warn('⚠️  Background cache fetch failed:', err.message)
          })
        }).catch(() => {
          // Ignore errors in background cache
        })
      }
      
      return NextResponse.json({
        products: convertedProducts,
        pagination: {
          page,
          perPage,
          totalProducts: result.totalProducts,
          totalPages: result.totalPages,
          hasNextPage: page < result.totalPages,
          hasPrevPage: page > 1
        }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      })
    }
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

