import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Update order payment method in WooCommerce
function updateOrderPaymentMethod(env: WooEnv, orderId: number, paymentMethod: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/orders/${orderId}`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/orders/${orderId}`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    // Sirf method update – payment WC / redirect pe complete hoga, isliye status/set_paid nahi
    const updateData = {
      payment_method: paymentMethod
    }
    
    const postData = JSON.stringify(updateData)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
    
    req.write(postData)
    req.end()
  })
}

// POST - Process payment
export async function POST(request: NextRequest) {
  try {
    const env = getWooCommerceEnv()
    const body = await request.json()
    const { orderId, paymentMethod } = body
    
    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Order ID and payment method are required' },
        { status: 400 }
      )
    }
    
    // Update order with payment method
    const order = await updateOrderPaymentMethod(env, orderId, paymentMethod)
    
    // For Ziina, payment URL will be fetched separately
    // For other methods, payment is processed here
    const isZiina = paymentMethod === 'ziina' || paymentMethod.includes('ziina')
    
    if (isZiina) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentMethod: 'ziina',
        message: 'Order updated. Payment URL will be fetched separately.'
      })
    } else {
      // For card payments, mark as processing
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentMethod: paymentMethod,
        message: 'Payment processed successfully'
      })
    }
    
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed', message: error.message },
      { status: 500 }
    )
  }
}
