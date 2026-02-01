import { NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Fetch available payment methods from WooCommerce
function fetchPaymentMethods(env: WooEnv): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/payment_gateways`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/payment_gateways`
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
            const raw = JSON.parse(data)
            // WooCommerce payment_gateways object return karta hai { bacs: {...}, cod: {...} }, array nahi
            const list: any[] = Array.isArray(raw)
              ? raw
              : Object.keys(raw || {}).map((k) => {
                  const m = (raw as Record<string, any>)[k]
                  if (typeof m !== 'object' || m === null) return null
                  return {
                    ...m,
                    id: m.id || k,
                    title: m.title || m.method_title || k,
                    description: m.description ?? m.method_description ?? ''
                  }
                }).filter(Boolean)
            
            const isEnabled = (m: any) => m && (m.enabled === true || m.enabled === 'yes')
            const enabledMethods = list.filter(isEnabled)
            console.log(`✅ Payment methods: ${list.length} total, ${enabledMethods.length} enabled`)
            
            resolve(enabledMethods)
          } catch (error) {
            console.error('❌ Failed to parse payment methods response:', error)
            reject(new Error('Failed to parse response'))
          }
        } else {
          console.error(`❌ Payment methods API error: Status ${res.statusCode}`)
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

// GET - Fetch available payment methods
export async function GET() {
  try {
    const env = getWooCommerceEnv()
    const paymentMethods = await fetchPaymentMethods(env)
    return NextResponse.json(paymentMethods)
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods', message: error.message },
      { status: 500 }
    )
  }
}

