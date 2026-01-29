import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Fetch order from WooCommerce and get payment URL
function getOrderPaymentUrl(env: WooEnv, orderId: number): Promise<any> {
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
            
            const orderKeyMeta = order.meta_data?.find((m: any) => m.key === '_order_key')
            const orderKey = orderKeyMeta?.value
            // Pehle meta / API se URL, phir WC standard order-pay URL fallback
            let paymentUrl =
              order.meta_data?.find((m: any) =>
                m.key === '_ziina_redirect_url' ||
                m.key === '_payment_redirect_url' ||
                m.key === 'ziina_redirect_url' ||
                m.key === '_ziina_payment_url' ||
                m.key === 'ziina_payment_url' ||
                m.key === '_payment_url'
              )?.value ||
              order.payment_url ||
              order.checkout_payment_url ||
              null
            
            if (!paymentUrl && orderKey && baseUrl) {
              const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
              const scheme = baseUrl.startsWith('https') ? 'https' : 'http'
              paymentUrl = `${scheme}://${host}/wp/checkout/order-pay/${order.id}/?pay_for_order=true&key=${orderKey}`
            }
            const backendHost = (baseUrl || env.WOOCOMMERCE_URL).replace(/^https?:\/\//, '').split('/')[0]
            const isWooCommercePage = !!(
              paymentUrl &&
              (() => {
                try {
                  return new URL(paymentUrl).hostname === backendHost
                } catch {
                  return false
                }
              })()
            )
            // Sirf gateway URL (Ziina/Stripe) pe redirect – WP page kabhi nahi dikhana
            const gatewayUrl = paymentUrl && !isWooCommercePage ? paymentUrl : undefined
            const orderKeyVal = orderKeyMeta?.value
            const wooPayPageUrl = paymentUrl && isWooCommercePage ? paymentUrl : undefined
            resolve({
              success: true,
              orderId: order.id,
              paymentMethod: order.payment_method,
              paymentUrl: gatewayUrl,
              isGatewayUrl: !!gatewayUrl,
              isWooCommercePage: isWooCommercePage && !!paymentUrl,
              orderKey: orderKeyVal,
              wooPayPageUrl,
              order: order
            })
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

// POST - Get payment URL for order
export async function POST(request: NextRequest) {
  try {
    const env = getWooCommerceEnv()
    const body = await request.json()
    const { orderId } = body
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const result = await getOrderPaymentUrl(env, orderId)
    
    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('Error getting payment URL:', error)
    return NextResponse.json(
      { error: 'Failed to get payment URL', message: error.message },
      { status: 500 }
    )
  }
}
