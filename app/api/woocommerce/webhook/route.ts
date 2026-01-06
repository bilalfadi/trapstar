import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { clearProductsCache } from '@/lib/products'
import { getAllProducts } from '@/lib/products'

// WooCommerce Webhook Handler
// This endpoint receives webhooks from WooCommerce when products are created/updated/deleted
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the webhook event
    console.log('🔔 WooCommerce Webhook Received:', {
      action: body.action || 'unknown',
      resource: body.resource || 'unknown',
      id: body.id || 'unknown'
    })

    // Clear products cache - this will force fresh fetch on next request
    await clearProductsCache()
    console.log('🗑️  Products cache cleared - next request will fetch fresh data from WooCommerce')

    // Pre-fetch products to warm up the cache (same system as other pages)
    // This ensures cache is ready for next requests
    try {
      console.log('🔄 Pre-fetching products to warm up cache...')
      const products = await getAllProducts()
      console.log(`✅ Cache warmed up with ${products.length} products`)
    } catch (error: any) {
      console.warn('⚠️  Failed to pre-fetch products, but cache is cleared. Next request will fetch fresh.')
    }

    // Revalidate all product-related pages
    revalidatePath('/', 'layout')
    revalidatePath('/store')
    revalidatePath('/search')
    
    // Revalidate category pages
    const categories = ['tracksuits', 'jackets', 'shorts', 't-shirts', 'bags', 'hoodies', 'sweatpants', 'jeans', 'beanies', 'hats', 'ski-masks', 'long-sleeves', 'sweaters', 'pants', 'collaborations']
    categories.forEach(category => {
      revalidatePath(`/${category}`)
    })

    // Revalidate product detail pages if we have product slug
    if (body.name) {
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      revalidatePath(`/${slug}`)
    }

    // Revalidate API routes
    revalidateTag('products')
    revalidateTag('woocommerce-products')

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received, cache cleared, and pages revalidated',
      revalidated: true,
      cacheCleared: true,
      cacheWarmed: true,
      now: Date.now()
    })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook verification (some systems ping the endpoint)
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'WooCommerce webhook endpoint is active',
    timestamp: Date.now()
  })
}

