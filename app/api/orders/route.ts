import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

// Update existing order in WooCommerce
function updateOrderInWooCommerce(env: WooEnv, orderId: number, updateData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/orders/${orderId}`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/orders/${orderId}`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
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

// Create order in WooCommerce
function createOrderInWooCommerce(env: WooEnv, orderData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp-json/wc/v3/orders`
    let baseUrl = env.WOOCOMMERCE_URL
    
    if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = `/wp/wp-json/wc/v3/orders`
      baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    }
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    const postData = JSON.stringify(orderData)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
            const order = JSON.parse(data)
            console.log(`✅ Order created successfully in WooCommerce: #${order.id}`)
            resolve(order)
          } catch (error) {
            console.error('❌ Failed to parse order response:', error)
            reject(new Error('Failed to parse response'))
          }
        } else {
          // Better error message for 502 and other errors
          const errorMsg = res.statusCode === 502 
            ? 'WooCommerce server is temporarily unavailable. Please try again in a moment.'
            : `WooCommerce API error (Status ${res.statusCode})`
          console.error(`❌ Order creation failed: ${errorMsg}`)
          console.error('Response:', data.substring(0, 500)) // Log first 500 chars
          reject(new Error(`${errorMsg}: ${data.substring(0, 200)}`))
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ Network error creating order:', error)
      reject(new Error(`Network error: ${error.message}`))
    })
    
    req.on('timeout', () => {
      req.destroy()
      console.error('❌ Request timeout creating order')
      reject(new Error('Request timeout - WooCommerce server took too long to respond'))
    })
    
    req.setTimeout(30000)
    req.write(postData)
    req.end()
  })
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const env = getWooCommerceEnv()
    const body = await request.json()
    const { productId, quantity, size, customer, paymentId, paymentMethod, paid } = body
    
    if (!productId || !customer) {
      return NextResponse.json(
        { error: 'Product ID and customer information are required' },
        { status: 400 }
      )
    }
    
    // Fetch payment method title from WooCommerce (optional - if fails, WooCommerce will use default)
    // Don't hardcode - get it from WooCommerce payment gateways
    let paymentMethodTitle = paymentMethod || ''
    
    // Try to fetch payment method title, but don't fail if it doesn't work
    // WooCommerce will use the gateway's configured title automatically
    if (paymentMethod) {
      try {
        // Fetch payment method details from WooCommerce to get proper title
        const auth = Buffer.from(`${env.CONSUMER_KEY}:${env.CONSUMER_SECRET}`).toString('base64')
        let apiPath = `/wp-json/wc/v3/payment_gateways/${paymentMethod}`
        let baseUrl = env.WOOCOMMERCE_URL
        
        if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
          apiPath = `/wp/wp-json/wc/v3/payment_gateways/${paymentMethod}`
          baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
        }
        
        const apiUrl = new URL(apiPath, baseUrl)
        const gatewayResponse = await new Promise<any>((resolve, reject) => {
          const options = {
            hostname: apiUrl.hostname,
            port: apiUrl.port || 443,
            path: apiUrl.pathname,
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
          }
          
          const req = https.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => { data += chunk })
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(data))
                } catch {
                  reject(new Error('Failed to parse'))
                }
              } else {
                reject(new Error(`Status ${res.statusCode}`))
              }
            })
          })
          
          req.on('error', reject)
          req.on('timeout', () => {
            req.destroy()
            reject(new Error('Request timeout'))
          })
          
          req.setTimeout(5000)
          req.end()
        })
        
        // Use title from WooCommerce payment gateway
        paymentMethodTitle = gatewayResponse.title || gatewayResponse.method_title || paymentMethod
        console.log(`✅ Payment method title from WooCommerce: ${paymentMethodTitle}`)
      } catch (error: any) {
        // If fetch fails (502, timeout, etc.), just use payment method ID
        // WooCommerce will automatically use the gateway's configured title
        console.warn(`⚠️  Could not fetch payment method title (${error.message}), WooCommerce will use gateway default`)
        paymentMethodTitle = paymentMethod // WooCommerce will handle the title
      }
    }
    
    // Prepare order data for WooCommerce
    const orderData = {
      payment_method: paymentMethod || '',
      payment_method_title: paymentMethodTitle, // From WooCommerce payment gateway
      set_paid: paid === true, // Set to true if payment is already received
      billing: {
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address_1: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postcode: customer.postcode || '',
        country: customer.country || 'US'
      },
      shipping: {
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        address_1: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postcode: customer.postcode || '',
        country: customer.country || 'US'
      },
      line_items: [
        {
          product_id: productId,
          quantity: quantity || 1,
          meta_data: size ? [
            {
              key: 'Size',
              value: size
            }
          ] : []
        }
      ],
      meta_data: [
        {
          key: '_order_source',
          value: 'trapstarofficial.store'
        },
        ...(paymentId ? [{
          key: '_payment_id',
          value: paymentId
        }] : [])
      ]
    }
    
    // Try to create order with retry logic for 502 errors
    let order
    let retries = 2
    let lastError
    
    while (retries >= 0) {
      try {
        order = await createOrderInWooCommerce(env, orderData)
        break // Success, exit loop
      } catch (error: any) {
        lastError = error
        const is502Error = error.message.includes('502') || error.message.includes('Bad Gateway')
        
        if (is502Error && retries > 0) {
          console.log(`⚠️  502 error, retrying... (${retries} attempts left)`)
          retries--
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        } else {
          // Not a 502 error or no retries left, throw error
          throw error
        }
      }
    }
    
    if (!order) {
      throw lastError || new Error('Failed to create order after retries')
    }
    
    // Agar Ziina payment hai, order-pay page trigger kare taake Ziina URL generate ho (order meta me save ho)
    if (paymentMethod && (paymentMethod.toLowerCase().includes('ziina') || paymentMethodTitle.toLowerCase().includes('ziina'))) {
      try {
        const orderKeyMeta = order.meta_data?.find((m: any) => m.key === '_order_key')
        const orderKey = orderKeyMeta?.value
        if (orderKey) {
          let baseUrl = env.WOOCOMMERCE_URL
          if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
            baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
          }
          const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
          const scheme = baseUrl.startsWith('https') ? 'https' : 'http'
          const orderPayUrl = `${scheme}://${host}/wp/checkout/order-pay/${order.id}/?pay_for_order=true&key=${orderKey}`
          
          // Order-pay page pe GET request kare taake Ziina plugin trigger ho (payment URL order meta me save ho)
          // Note: Ye request server-side hai, so Ziina plugin client-side JS se trigger nahi hoga
          // Lekin kuch plugins server-side hooks use karte hain, isliye try karte hain
          await new Promise<void>((resolve) => {
            const urlObj = new URL(orderPayUrl)
            const req = https.request({
              hostname: urlObj.hostname,
              port: urlObj.port || 443,
              path: urlObj.pathname + urlObj.search,
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TrapstarBot/1.0)',
                'Accept': 'text/html'
              },
              timeout: 3000
            }, (res) => {
              let data = ''
              res.on('data', (chunk) => { data += chunk })
              res.on('end', () => {
                // Ziina URL HTML me ho sakta hai - parse kare (optional)
                // Lekin usually plugin order meta me save karta hai, so order refresh kare
                resolve()
              })
            })
            req.on('error', () => resolve()) // Ignore errors
            req.on('timeout', () => {
              req.destroy()
              resolve()
            })
            req.setTimeout(3000)
            req.end()
          })
          
          // Order refresh kare taake updated meta (Ziina URL) mile
          // Lekin abhi order create hua hai, plugin ko time chahiye
          // So frontend pe order-pay page pe "Pay" click pe get-payment-url call karega, wahan order refresh hoga
          console.log(`✅ Triggered order-pay page for Ziina order #${order.id}`)
        }
      } catch (error: any) {
        // Ignore - order create ho gaya, payment URL frontend pe fetch hoga
        console.warn(`⚠️  Could not trigger Ziina payment URL generation: ${error.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.number,
        status: order.status,
        total: order.total,
        currency: order.currency
      }
    })
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { success: false, error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('❌ Error creating order:', error)
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to create order'
    let statusCode = 500
    
    if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
      errorMessage = 'WooCommerce server is temporarily unavailable. Please try again in a moment.'
      statusCode = 503 // Service Unavailable
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.'
      statusCode = 504 // Gateway Timeout
    } else if (error.message.includes('Network error')) {
      errorMessage = 'Network error. Please check your connection and try again.'
      statusCode = 503
    } else {
      errorMessage = error.message || 'Failed to create order. Please try again.'
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        message: error.message 
      },
      { status: statusCode }
    )
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const env = getWooCommerceEnv()
    const body = await request.json()
    const { orderId, status, paid, paymentId } = body
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    if (status) updateData.status = status
    if (paid !== undefined) updateData.set_paid = paid
    
    if (paymentId) {
      updateData.meta_data = [
        {
          key: '_payment_id',
          value: paymentId
        }
      ]
    }
    
    const order = await updateOrderInWooCommerce(env, orderId, updateData)
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        paid: order.status === 'processing' || order.status === 'completed'
      }
    })
  } catch (error: any) {
    if (error?.message?.includes('Missing WooCommerce credentials')) {
      return NextResponse.json(
        { error: 'WooCommerce not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order', message: error.message },
      { status: 500 }
    )
  }
}


