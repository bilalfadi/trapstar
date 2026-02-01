import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Fetch single product from WooCommerce (for image)
function fetchProductFromWooCommerce(env: WooEnv, productId: number): Promise<{ images?: Array<{ src: string }> }> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    const path = `/products/${productId}`
    let apiPath = `/wp-json/wc/v3${path}`
    let baseUrl = env.WOOCOMMERCE_URL
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3${path}`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    const apiUrl = new URL(apiPath, baseUrl)
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error('Failed to parse product'))
          }
        } else {
          resolve({}) // no image on fail
        }
      })
    })
    req.on('error', () => resolve({}))
    req.end()
  })
}

// Fetch order from WooCommerce
function fetchOrderFromWooCommerce(env: WooEnv, orderId: string, orderKey?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/orders/${orderId}`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/orders/${orderId}`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const order = JSON.parse(data)
            
            // Verify order key if provided
            if (orderKey) {
              const orderKeyMeta = order.meta_data?.find((m: any) => m.key === '_order_key')
              if (orderKeyMeta && orderKeyMeta.value !== orderKey) {
                reject(new Error('Invalid order key'))
                return
              }
            }
            
            resolve(order)
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.end()
  })
}

// GET - Fetch order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getWooCommerceEnv()
    const orderId = params.id
    const { searchParams } = new URL(request.url)
    const orderKey = searchParams.get('key')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const order = await fetchOrderFromWooCommerce(env, orderId, orderKey || undefined)

    // Ensure billing object (WC sometimes uses billing_address)
    if (!order.billing && (order as any).billing_address) {
      order.billing = (order as any).billing_address
    }
    if (!order.billing || typeof order.billing !== 'object') {
      order.billing = { first_name: '', last_name: '', email: '', phone: '', address_1: '', city: '', state: '', postcode: '', country: '' }
    }

    // Enrich line_items with product image (WC order line_items don't include image)
    if (order.line_items && Array.isArray(order.line_items)) {
      const enriched = await Promise.all(
        order.line_items.map(async (item: any) => {
          const productId = item.product_id
          if (!productId) return { ...item, image: undefined }
          try {
            const product = await fetchProductFromWooCommerce(env, productId)
            const src = product?.images?.[0]?.src
            return { ...item, image: src || undefined }
          } catch {
            return { ...item, image: undefined }
          }
        })
      )
      order.line_items = enriched
    }

    return NextResponse.json(order)
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('Error fetching order:', error)
    
    if (error.message === 'Invalid order key') {
      return NextResponse.json(
        { error: 'Invalid order key', message: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch order', message: error.message },
      { status: 500 }
    )
  }
}
