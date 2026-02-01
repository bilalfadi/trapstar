import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { getWooCommerceEnv } from '@/lib/woocommerce-env'

type WooEnv = { WOOCOMMERCE_URL: string; CONSUMER_KEY: string; CONSUMER_SECRET: string }

function getBackendHost(env: WooEnv): string {
  let baseUrl = env.WOOCOMMERCE_URL
  if (env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')) {
    baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
  }
  return baseUrl.replace(/^https?:\/\//, '').split('/')[0]
}

// Hit backend order-pay (user ko nahi dikhana); 302 Location ya HTML se payment URL nikaalo
function triggerOrderPayAndParseZiinaUrl(env: WooEnv, orderId: number, orderKey: string): Promise<string | null> {
  return new Promise((resolve) => {
    let baseUrl = env.WOOCOMMERCE_URL
    const hasWp = env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')
    if (hasWp) baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
    const scheme = baseUrl.startsWith('https') ? 'https' : 'http'
    const pathPrefix = hasWp ? '/wp' : ''
    const orderPayUrl = `${scheme}://${host}${pathPrefix}/checkout/order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`
    const backendHost = getBackendHost(env)

    // Backend jaisa request – WooCommerce/Ziina wahi page de jisme Ziina link ho (backend checkout pe jaise)
    const origin = `${scheme}://${host}${pathPrefix || ''}`
    const referer = `${origin}/checkout/`
    const urlObj = new URL(orderPayUrl)
    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: referer,
          Origin: origin
        }
      },
      (res) => {
        // 302/301 redirect – backend Ziina ka URL Location me bhej sakta hai
        const code = res.statusCode || 0
        if (code >= 301 && code <= 308) {
          const loc = res.headers.location
          if (loc && typeof loc === 'string') {
            const locationUrl = loc.startsWith('http') ? loc : `${scheme}://${host}${loc.startsWith('/') ? '' : '/'}${loc}`
            try {
              if (new URL(locationUrl).hostname !== backendHost) {
                res.resume()
                resolve(locationUrl.trim())
                return
              }
            } catch { /* ignore */ }
          }
        }

        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          let ziinaUrl: string | null = null
          // Ziina: https://pay.ziina.com/payment_intent/<uuid> – HTML me kahin bhi (script, href, data, etc.)
          const payZiinaMatch = data.match(/https?:\/\/pay\.ziina\.com\/payment_intent\/[a-f0-9-]+(?:\?[^"'\s]*)?/i)
          if (payZiinaMatch?.[0]) ziinaUrl = payZiinaMatch[0].trim()
          // Script / JSON me "payment_url" ya "redirect_url" : "https://pay.ziina.com/..."
          if (!ziinaUrl) {
            const jsonLike = data.match(/(?:payment_url|redirect_url|checkout_url|pay_url)["']?\s*:\s*["'](https?:\/\/pay\.ziina\.com[^"']+)["']/i)
            if (jsonLike?.[1]) ziinaUrl = jsonLike[1].trim()
          }
          // Meta refresh: <meta http-equiv="refresh" content="0;url=...">
          if (!ziinaUrl) {
          const metaRefresh = data.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i)
          if (metaRefresh?.[1]) ziinaUrl = metaRefresh[1].trim()
          if (!ziinaUrl) {
            const metaContent = data.match(/<meta[^>]+content=["'](\d+);\s*url=([^"']+)["']/i)
            if (metaContent?.[2]) ziinaUrl = metaContent[2].trim()
          }
          // Form action (Ziina)
          if (!ziinaUrl && /ziina/i.test(data)) {
            const formAction = data.match(/<form[^>]+action=["']([^"']*ziina[^"']*)["']/i)
            if (formAction?.[1]) ziinaUrl = formAction[1].trim()
          }
          if (!ziinaUrl && /ziina/i.test(data)) {
            const href = data.match(/href=["']([^"']*ziina[^"']*)["']/i)
            if (href?.[1]) ziinaUrl = href[1].trim()
          }
          if (!ziinaUrl && /ziina/i.test(data)) {
            const redirect = data.match(/["'](https?:\/\/[^"']*ziina[^"']*)["']/i)
            if (redirect?.[1]) ziinaUrl = redirect[1].trim()
          }
          // window.location / location.href / data-redirect
          if (!ziinaUrl) {
            const locAssign = data.match(/(?:window\.location|location\.href)\s*=\s*["'](https?:\/\/[^"']+)["']/i)
            if (locAssign?.[1]) ziinaUrl = locAssign[1].trim()
          }
          if (!ziinaUrl) {
            const dataRedirect = data.match(/data-redirect=["'](https?:\/\/[^"']+)["']/i)
            if (dataRedirect?.[1]) ziinaUrl = dataRedirect[1].trim()
          }
          // Script me redirect/payment URL (common in gateways)
          if (!ziinaUrl) {
            const scriptUrl = data.match(/(?:redirect_url|payment_url|checkout_url|pay_url)["']?\s*:\s*["'](https?:\/\/[^"']+)["']/i)
            if (scriptUrl?.[1]) ziinaUrl = scriptUrl[1].trim()
          }
          // Koi https URL jo backend nahi aur pay/checkout/ziina/payment jaisa lag raha ho
          if (!ziinaUrl) {
            const urls = data.match(/["'](https?:\/\/[^"']+)["']/g)
            if (urls) {
              for (const s of urls) {
                const u = s.slice(1, -1)
                try {
                  const parsed = new URL(u)
                  if (parsed.hostname !== backendHost && /pay|checkout|ziina|payment/i.test(u)) {
                    ziinaUrl = u
                    break
                  }
                } catch { /* skip */ }
              }
            }
          }
          }
          resolve(ziinaUrl || null)
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

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
            let orderKey: string | undefined = order.meta_data?.find((m: any) => m.key === '_order_key')?.value
            if (!orderKey && order.order_key) orderKey = order.order_key
            if (!orderKey && order.key) orderKey = order.key
            const backendHost = (baseUrl || env.WOOCOMMERCE_URL).replace(/^https?:\/\//, '').split('/')[0]

            // Pehle known keys, phir koi bhi meta value jo https URL ho (backend nahi) – Ziina kisi bhi key me save kar sakta hai
            const knownUrl = order.meta_data?.find((m: any) =>
              m.key === '_ziina_redirect_url' ||
              m.key === '_payment_redirect_url' ||
              m.key === 'ziina_redirect_url' ||
              m.key === '_ziina_payment_url' ||
              m.key === 'ziina_payment_url' ||
              m.key === '_payment_url' ||
              m.key === 'redirect_url' ||
              m.key === '_redirect_url'
            )?.value
            let paymentUrl: string | null =
              (typeof knownUrl === 'string' && knownUrl.startsWith('http')) ? knownUrl : null

            if (!paymentUrl) {
              // Ziina: pay.ziina.com/payment_intent/... – kisi bhi meta key me ho sakta hai
              const ziinaMeta = order.meta_data?.find((m: any) => {
                const v = m.value
                if (typeof v !== 'string') return false
                return v.includes('pay.ziina.com') || v.includes('payment_intent')
              })
              if (ziinaMeta?.value && typeof ziinaMeta.value === 'string') {
                const match = ziinaMeta.value.match(/https?:\/\/[^\s"']+pay\.ziina\.com[^\s"']*/i)
                if (match?.[0]) paymentUrl = match[0].trim()
              }
            }
            if (!paymentUrl) {
              const anyUrlMeta = order.meta_data?.find((m: any) => {
                const v = m.value
                if (typeof v !== 'string' || !v.startsWith('http')) return false
                try {
                  return new URL(v).hostname !== backendHost
                } catch { return false }
              })
              if (anyUrlMeta?.value) paymentUrl = anyUrlMeta.value
            }
            if (!paymentUrl) {
              paymentUrl = order.payment_url || order.checkout_payment_url || null
            }

            if (!paymentUrl && orderKey && baseUrl) {
              const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
              const scheme = baseUrl.startsWith('https') ? 'https' : 'http'
              const hasWp = (env.WOOCOMMERCE_URL || '').endsWith('/wp') || (env.WOOCOMMERCE_URL || '').endsWith('/wp/')
              const pathPrefix = hasWp ? '/wp' : ''
              paymentUrl = `${scheme}://${host}${pathPrefix}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${orderKey}`
            }
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
            // Sirf gateway URL (Ziina/Stripe) pe redirect – backend domain user ko kabhi mat dikhao
            const gatewayUrl = paymentUrl && !isWooCommercePage ? paymentUrl : undefined
            const wooPayPageUrl = paymentUrl && isWooCommercePage ? paymentUrl : undefined
            resolve({
              success: true,
              orderId: order.id,
              paymentMethod: order.payment_method,
              paymentUrl: gatewayUrl,
              isGatewayUrl: !!gatewayUrl,
              isWooCommercePage: !!isWooCommercePage,
              orderKey: orderKey ?? undefined,
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

// POST - Get payment URL for order (backend domain kabhi frontend ko mat bhejo)
export async function POST(request: NextRequest) {
  try {
    const env = getWooCommerceEnv()
    const body = await request.json()
    const { orderId, orderKey: bodyOrderKey } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const numOrderId = Number(orderId)

    const buildFallbackUrl = (key: string) => {
      let baseUrl = env.WOOCOMMERCE_URL
      const hasWp = env.WOOCOMMERCE_URL.endsWith('/wp') || env.WOOCOMMERCE_URL.endsWith('/wp/')
      if (hasWp) baseUrl = env.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
      const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
      const scheme = baseUrl.startsWith('https') ? 'https' : 'http'
      const pathPrefix = hasWp ? '/wp' : ''
      return `${scheme}://${host}${pathPrefix}/checkout/order-pay/${orderId}/?pay_for_order=true&key=${key}`
    }

    // Jab frontend ne orderKey bheja (create order se) – turant URL bhejo, redirect zaroor ho
    if (bodyOrderKey && typeof bodyOrderKey === 'string' && bodyOrderKey.length > 0) {
      const url = buildFallbackUrl(bodyOrderKey)
      return NextResponse.json({
        success: true,
        orderId: numOrderId,
        paymentUrl: undefined,
        isGatewayUrl: false,
        fallbackPayUrl: url,
        redirectUrl: url
      })
    }

    let result: any
    try {
      result = await getOrderPaymentUrl(env, numOrderId)
    } catch (err) {
      if (bodyOrderKey && typeof bodyOrderKey === 'string') {
        const fallback = buildFallbackUrl(bodyOrderKey)
        return NextResponse.json({
          success: true,
          orderId: numOrderId,
          paymentUrl: undefined,
          isGatewayUrl: false,
          fallbackPayUrl: fallback,
          redirectUrl: fallback
        })
      }
      await new Promise((r) => setTimeout(r, 2000))
      try {
        result = await getOrderPaymentUrl(env, numOrderId)
      } catch (err2) {
        if (bodyOrderKey && typeof bodyOrderKey === 'string') {
          const fallback = buildFallbackUrl(bodyOrderKey)
          return NextResponse.json({
            success: true,
            orderId: numOrderId,
            paymentUrl: undefined,
            isGatewayUrl: false,
            fallbackPayUrl: fallback,
            redirectUrl: fallback
          })
        }
        throw err2
      }
    }

    if (!result.orderKey && bodyOrderKey && typeof bodyOrderKey === 'string') {
      result.orderKey = bodyOrderKey
    }
    if (!result.fallbackPayUrl && result.wooPayPageUrl) {
      result.fallbackPayUrl = result.wooPayPageUrl
    }

    const paymentMethod = (result.paymentMethod || '').toLowerCase()
    const paymentTitle = (result.order?.payment_method_title || result.paymentMethodTitle || '').toLowerCase()
    const isZiina = paymentMethod.includes('ziina') || paymentTitle.includes('ziina')

    // Ziina hai aur gateway URL nahi mila: backend order-pay hit karo (backend checkout jaisa request) – HTML / meta se Ziina URL nikaalo
    if (isZiina && !result.paymentUrl && result.orderKey) {
      // Pehli hit – Ziina plugin ko trigger karo (backend pe checkout karne pe bhi yahi hota hai)
      let ziinaUrlFromHtml = await triggerOrderPayAndParseZiinaUrl(env, Number(orderId), result.orderKey)
      if (!ziinaUrlFromHtml) {
        await new Promise((r) => setTimeout(r, 3000))
        ziinaUrlFromHtml = await triggerOrderPayAndParseZiinaUrl(env, Number(orderId), result.orderKey)
      }
      if (ziinaUrlFromHtml) {
        result = {
          ...result,
          paymentUrl: ziinaUrlFromHtml,
          isGatewayUrl: true
        }
      }
      // Order-pay hit hone ke baad Ziina plugin meta me URL save kar sakta hai – thodi der baad order dubara fetch karo
      if (!result.paymentUrl) {
        await new Promise((r) => setTimeout(r, 3500))
        const result2 = await getOrderPaymentUrl(env, Number(orderId))
        if (result2.paymentUrl) {
          result = { ...result, paymentUrl: result2.paymentUrl, isGatewayUrl: true }
        }
      }
      // Debug: Ziina URL ab bhi nahi mila – order pe kaun si meta keys hain wo log karo (terminal me dikhega)
      if (!result.paymentUrl && result.order?.meta_data) {
        const metaKeys = result.order.meta_data.map((m: any) => m.key)
        console.log('[get-payment-url] Ziina order #' + orderId + ' – payment URL nahi mila. Order meta_data keys:', metaKeys)
      }
      // Fallback: Ziina URL nahi mila to backend order-pay URL bhejo – frontend naye tab me khol dega, wahan se Ziina redirect ho jayega
      if (!result.paymentUrl && result.orderKey) {
        result.fallbackPayUrl = buildFallbackUrl(result.orderKey)
      }
    }

    // Ziina hai lekin paymentUrl nahi mila: fallback URL zaroor bhejo
    if (isZiina && !result.paymentUrl && result.orderKey && !result.fallbackPayUrl) {
      result.fallbackPayUrl = buildFallbackUrl(result.orderKey)
    }

    // Koi bhi order jisme direct payment URL nahi mila, lekin orderKey hai – fallback zaroor bhejo
    if (!result.paymentUrl && result.orderKey && !result.fallbackPayUrl) {
      result.fallbackPayUrl = buildFallbackUrl(result.orderKey)
    }

    // Last guarantee: orderKey (result ya body) hai to fallbackPayUrl zaroor bhejo – taake frontend redirect kar sake
    const anyKey = result.orderKey || (typeof bodyOrderKey === 'string' ? bodyOrderKey : null)
    if (!result.paymentUrl && anyKey && !result.fallbackPayUrl) {
      result.fallbackPayUrl = buildFallbackUrl(anyKey)
    }

    if (result.fallbackPayUrl) {
      console.log('[get-payment-url] Returning fallbackPayUrl for order #' + orderId)
    }

    // WooCommerce tarike se: jo URL mile (Ziina ya backend order-pay) wahi bhejo – backend pe laga Ziina redirect handle karega
    result.redirectUrl = result.paymentUrl || result.fallbackPayUrl || undefined
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
