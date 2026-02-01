'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PriceDisplay from '@/components/PriceDisplay'
import { convertPrice, formatPrice, getCurrencyInfo } from '@/lib/currency'

interface Product {
  id: number
  title: string
  slug: string
  price: number | null
  discountPrice: number | null
  image: string
  woocommerceId?: number
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const productSlug = searchParams?.get('product') || null
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [countryCode, setCountryCode] = useState('US')
  const [showPaymentFrame, setShowPaymentFrame] = useState(false)
  const [paymentFrameUrl, setPaymentFrameUrl] = useState<string | null>(null)
  const [paymentLinkByEmail, setPaymentLinkByEmail] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US',
    size: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  })
  
  useEffect(() => {
    // Load saved currency
    const saved = localStorage.getItem('selectedCountry')
    if (saved) {
      setCountryCode(saved)
      const { COUNTRIES } = require('@/lib/currency')
      const country = COUNTRIES.find((c: any) => c.code === saved)
      if (country) {
        setCurrency(country.currency)
      }
    }

    // Listen for currency changes
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrency(e.detail.currency)
      setCountryCode(e.detail.countryCode)
    }
    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener)

    if (productSlug) {
      fetchProduct()
      fetchPaymentMethods()
    } else {
      setLoading(false)
    }

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener)
    }
  }, [productSlug])
  
  async function fetchPaymentMethods() {
    try {
      const response = await fetch('/api/woocommerce/payment-methods')
      const methods = await response.json()
      
      console.log('💳 Payment Methods Response:', methods)
      
      // Only show payment methods from WooCommerce - no defaults
      if (methods.error) {
        console.error('❌ Error from payment methods API:', methods.error)
        setPaymentMethods([])
        setSelectedPaymentMethod('')
        return
      }
      
      // Jo WooCommerce pe enabled hain sirf wahi – enabled = true ya "yes" dono accept
      const isEnabled = (method: any) => method && (method.enabled === true || method.enabled === 'yes')
      const filteredMethods = (Array.isArray(methods) ? methods : []).filter(isEnabled)
      
      // Check for Ziina
      const ziinaMethod = filteredMethods.find((m: any) => 
        m.id.toLowerCase().includes('ziina') || 
        m.title?.toLowerCase().includes('ziina') ||
        m.method_title?.toLowerCase().includes('ziina')
      )
      
      if (ziinaMethod) {
        console.log('✅ Ziina Payment Method Found in checkout:', ziinaMethod)
      } else {
        console.log('⚠️  Ziina NOT found. Available methods:', filteredMethods.map((m: any) => m.id).join(', '))
      }
      
      // Only set methods from WooCommerce - no fallback
      console.log(`✅ Setting ${filteredMethods.length} payment methods from WooCommerce`)
      setPaymentMethods(filteredMethods)
      if (filteredMethods.length > 0) {
        setSelectedPaymentMethod(filteredMethods[0].id)
      } else {
        setSelectedPaymentMethod('')
        console.log('⚠️  No payment methods available from WooCommerce')
      }
    } catch (error) {
      console.error('❌ Error fetching payment methods:', error)
      // No fallback - only show what comes from WooCommerce
      setPaymentMethods([])
      setSelectedPaymentMethod('')
    }
  }
  
  async function fetchProduct() {
    if (!productSlug) {
      setLoading(false)
      return
    }
    
    try {
      // Use direct product endpoint - much faster, no pagination needed
      const response = await fetch(`/api/products/${productSlug}`, {
        cache: 'default', // Use browser cache
        next: { revalidate: 3600 } // Revalidate every hour
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Product not found with slug: ${productSlug}`)
        } else {
          throw new Error(`API returned ${response.status}`)
        }
        setLoading(false)
        return
      }
      
      const foundProduct = await response.json()
      if (foundProduct) {
        setProduct(foundProduct)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setOrderError('')
    
    if (!product || !product.woocommerceId) {
      setOrderError('Product not found')
      setSubmitting(false)
      return
    }
    
    if (!formData.size) {
      setOrderError('Please select a size')
      setSubmitting(false)
      return
    }
    
    if (!selectedPaymentMethod || paymentMethods.length === 0) {
      setOrderError('No payment method available. Please contact support.')
      setSubmitting(false)
      return
    }
    
    try {
      // Create order in WooCommerce first (pending status)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product.woocommerceId,
          quantity: 1,
          size: formData.size,
          // Line total bhejo taake WooCommerce order me amount $0 na aaye (Ziina / order-pay pe sahi total dikhe)
          lineTotal: product.discountPrice ?? product.price ?? 0,
          paymentMethod: selectedPaymentMethod,
          paid: false, // Will be updated after payment
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postcode: formData.postcode,
            country: formData.country
          }
        })
      })
      
      // Check order response status first
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ error: 'Failed to create order' }))
        console.error('❌ Order Creation Error:', errorData)
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to create order'
        if (orderResponse.status === 502 || orderResponse.status === 503) {
          errorMessage = 'WooCommerce server is temporarily unavailable. Please try again in a moment.'
        } else if (orderResponse.status === 504) {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = errorData.error || errorData.message || 'Failed to create order. Please try again.'
        }
        
        setOrderError(errorMessage)
        setSubmitting(false)
        return
      }
      
      const orderData = await orderResponse.json()
      
      if (!orderData.success) {
        console.error('❌ Order creation failed:', orderData)
        setOrderError(orderData.error || orderData.message || 'Failed to create order')
        setSubmitting(false)
        return
      }
      
      const createdOrderId = orderData.order?.id
      const orderNumber = orderData.order?.orderNumber || orderData.order?.number || orderData.order?.id
      const orderKeyFromCreate = orderData.order?.orderKey || null
      setCreatedOrderId(createdOrderId)
      setOrderNumber(orderNumber ? String(orderNumber) : null)

      // Hybrid: Next.js checkout → order WooCommerce me → user ko payment URL pe redirect (Ziina direct ya WordPress order-pay – dono OK)
      const method = (selectedPaymentMethod || '').toLowerCase()
      const needsPayment = method.includes('ziina') || method.includes('card') || method.includes('stripe') || method.includes('paypal')
      const BACKEND_CHECKOUT_BASE = 'https://payment.trapstarofficial.store'
      const buildOrderPayUrl = (oid: number, key: string) =>
        `${BACKEND_CHECKOUT_BASE}/checkout/order-pay/${oid}/?pay_for_order=true&key=${encodeURIComponent(key)}`

      if (needsPayment && createdOrderId) {
        const fetchPayUrl = async () => {
          const res = await fetch('/api/woocommerce/get-payment-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: createdOrderId, orderKey: orderKeyFromCreate }),
          })
          const data = await res.json().catch(() => ({}))
          const payUrl =
            data.redirectUrl ||
            data.redirect_url ||
            data.paymentUrl ||
            data.payment_url ||
            data.fallbackPayUrl ||
            data.fallback_pay_url ||
            ''
          return { payUrl: typeof payUrl === 'string' ? payUrl.trim() : '', data, ok: res.ok }
        }

        let { payUrl: toRedirect, data: urlData, ok: urlResOk } = await fetchPayUrl()
        if (toRedirect.startsWith('http')) {
          window.location.replace(toRedirect)
          return
        }
        if (urlData.paymentLinkByEmail && urlResOk) {
          setPaymentLinkByEmail(true)
          setOrderSuccess(true)
          setSubmitting(false)
          return
        }

        await new Promise((r) => setTimeout(r, 2000))
        const { payUrl: toRedirect2, data: urlData2, ok: urlRes2Ok } = await fetchPayUrl()
        if (toRedirect2.startsWith('http')) {
          window.location.replace(toRedirect2)
          return
        }
        if (urlData2.paymentLinkByEmail && urlRes2Ok) {
          setPaymentLinkByEmail(true)
          setOrderSuccess(true)
          setSubmitting(false)
          return
        }

        // Frontend fallback: orderKey + orderId ho to khud order-pay URL bana kar redirect – link frontend pe zaroor aaye
        if (orderKeyFromCreate && typeof orderKeyFromCreate === 'string' && orderKeyFromCreate.length > 0) {
          const orderPayUrl = buildOrderPayUrl(createdOrderId, orderKeyFromCreate)
          window.location.replace(orderPayUrl)
          return
        }
        setOrderError('Payment page could not be loaded. Order #' + (orderNumber || createdOrderId) + ' is placed. Please check your email for the payment link or try again.')
        setSubmitting(false)
        return
      }

      // COD / bacs / baki: success dikhao
      setOrderSuccess(true)
      return
    } catch (error: any) {
      setOrderError(error.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading product...</p>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/store" className="text-white underline">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }
  
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl border border-gray-800">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Order Placed Successfully!
          </h1>
          
          {createdOrderId && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Order Number</p>
              <p className="text-2xl font-bold text-white">
                #{orderNumber || createdOrderId}
              </p>
              {product && (
                <p className="text-sm text-gray-400 mt-2">
                  {product.title}
                </p>
              )}
            </div>
          )}
          
          <p className="text-gray-400 mb-6 leading-relaxed">
            {paymentLinkByEmail
              ? `Your order #${orderNumber || createdOrderId} has been placed. Please check your email for the payment link to complete payment securely.`
              : createdOrderId 
                ? `Your order has been placed successfully in WooCommerce. Order #${orderNumber || createdOrderId} has been created and you will receive a confirmation email shortly.`
                : 'Your order has been placed and payment has been processed successfully. You will receive an order confirmation email shortly.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200 transition-all duration-300 inline-block rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Continue Shopping
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              ✅ Order created in WooCommerce<br/>
              {paymentLinkByEmail ? '📧 Payment link will be sent to your email – complete payment from that link' : '📧 Confirmation email will be sent to your email address'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showPaymentFrame && paymentFrameUrl && product) {
    const displayPrice = product.discountPrice || product.price || 0
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col">
        <div className="flex-none border-b border-gray-800 bg-black/80 backdrop-blur px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Complete payment</h1>
              <p className="text-gray-400 text-sm">
                Order #{createdOrderId || ''} · Ziina
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Amount:</span>
              <span className="font-bold">{formatPrice(displayPrice, 'USD', '$')}</span>
              <Link
                href="/store"
                className="ml-2 text-sm text-gray-400 hover:text-white underline"
              >
                Back to store
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 p-4">
          <div className="max-w-4xl mx-auto h-full min-h-[70vh] rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
            <iframe
              src={paymentFrameUrl}
              title="Payment"
              className="w-full h-full min-h-[70vh] border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">Complete your payment below. You stay on this site.</p>
        </div>
      </div>
    )
  }
  
  // Get currency info for price conversion
  const currencyInfo = getCurrencyInfo(countryCode)
  const basePrice = product.price || 0
  const baseDiscountPrice = product.discountPrice || null
  const displayPrice = convertPrice(basePrice, 'USD', currencyInfo.code)
  const displayDiscountPrice = baseDiscountPrice ? convertPrice(baseDiscountPrice, 'USD', currencyInfo.code) : null
  const finalPrice = displayDiscountPrice || displayPrice
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-gray-400">Complete your order securely</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Product Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-800 sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Summary
              </h2>
              <div className="mb-6">
                <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-gray-800">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                <div className="flex items-center gap-2">
                  <PriceDisplay 
                    price={product.price} 
                    discountPrice={product.discountPrice}
                    className="text-xl font-bold text-white"
                    discountClassName="line-through text-gray-500 text-sm"
                  />
                  {product.discountPrice && product.price && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(displayPrice, currencyInfo.code, currencyInfo.symbol)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-medium text-green-400">Free</span>
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold">
                      {formatPrice(finalPrice, currencyInfo.code, currencyInfo.symbol)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Shipping Information</h2>
              </div>
              
              {orderError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{orderError}</span>
                </div>
              )}
            
            <form onSubmit={handleSubmit}>
              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-300">
                  Size <span className="text-red-500">*</span>
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                >
                  <option value="">Select Size</option>
                  <option value="S">S - Small</option>
                  <option value="M">M - Medium</option>
                  <option value="L">L - Large</option>
                  <option value="XL">XL - Extra Large</option>
                  <option value="XXL">XXL - 2X Large</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Postcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="PK">Pakistan</option>
                    <option value="IN">India</option>
                  </select>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="border-t-2 border-gray-700 pt-8 mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">Payment Information</h3>
                </div>
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-300">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    required
                    disabled={paymentMethods.length === 0}
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((method: any) => (
                        <option key={method.id} value={method.id}>
                          {method.title} {method.description ? `- ${method.description}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">No payment methods available</option>
                    )}
                  </select>
                  {selectedPaymentMethod && (
                    <p className="text-xs text-gray-400 mt-1">
                      {(() => {
                        const method = paymentMethods.find((m: any) => m.id === selectedPaymentMethod)
                        if (method?.description) {
                          return method.description
                        }
                        // Fallback descriptions for common methods
                        if (selectedPaymentMethod === 'bacs' || selectedPaymentMethod.includes('bacs')) {
                          return 'You will receive bank details after order confirmation'
                        }
                        if (selectedPaymentMethod === 'stripe' || selectedPaymentMethod.includes('stripe') || selectedPaymentMethod.includes('card')) {
                          return 'Payment will be processed securely through card'
                        }
                        if (selectedPaymentMethod === 'paypal' || selectedPaymentMethod.includes('paypal')) {
                          return 'You will be redirected to PayPal for payment'
                        }
                        if (selectedPaymentMethod === 'ziina' || selectedPaymentMethod.includes('ziina')) {
                          return 'After Place Order, complete payment on this page (Ziina)'
                        }
                        return 'Complete your payment using the selected method'
                      })()}
                    </p>
                  )}
                </div>
                
                {/* Payment Method Specific Fields */}
                
                {/* Ziina – no extra description box; sirf payment method select dikhe */}

                {/* Card / Stripe – card details next page (order-pay) pe WooCommerce/Stripe form me enter honge */}
                {(selectedPaymentMethod === 'stripe' || 
                  selectedPaymentMethod.includes('card') || 
                  selectedPaymentMethod.includes('credit')) && 
                  selectedPaymentMethod !== 'ziina' && 
                  !selectedPaymentMethod.includes('ziina') && (
                  <div className="mb-6 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700 p-6 rounded-xl">
                    <h4 className="text-base font-semibold mb-4 text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Card Payment
                    </h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>You will complete payment on the next page securely.</p>
                      <p className="text-gray-300 font-medium">
                        Card details will be entered on the payment page after you click &quot;Place Order&quot; — not here.
                      </p>
                      <div className="mt-3 space-y-1">
                        <p>✅ Secure payment through our payment gateway</p>
                        <p>✅ No need to enter card details on this page</p>
                        <p>✅ Enter card on the next (payment) page</p>
                      </div>
                      <p className="mt-3 text-blue-400">
                        ℹ️ After clicking &quot;Place Order&quot;, you will be taken to the payment page to enter your card and complete the transaction.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Bank Transfer Details */}
                {selectedPaymentMethod === 'bacs' && (
                  <div className="mb-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 p-6 rounded-xl">
                    <h4 className="text-base font-semibold mb-4 text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Bank Transfer Instructions
                    </h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Please transfer the payment to the following bank account:</p>
                      <div className="mt-3 space-y-1">
                        <p><span className="font-medium text-white">Bank Name:</span> Your Bank Name</p>
                        <p><span className="font-medium text-white">Account Name:</span> Trapstar Official Store</p>
                        <p><span className="font-medium text-white">Account Number:</span> 1234567890</p>
                        <p><span className="font-medium text-white">Routing Number:</span> 987654321</p>
                        <p><span className="font-medium text-white">SWIFT/BIC:</span> BANKUS33</p>
                      </div>
                      <p className="mt-3 text-yellow-400">
                        ⚠️ Please include your order number in the payment reference. Your order will be processed once payment is confirmed.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* PayPal Details */}
                {selectedPaymentMethod === 'paypal' && (
                  <div className="mb-6 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30 p-6 rounded-xl">
                    <h4 className="text-base font-semibold mb-4 text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.174 1.351 1.05 3.3.93 4.857-.022.27-.042.537-.056.793l-.02.36c-.05.89-.1 1.778-.186 2.64-.19 1.938-.5 3.794-1.22 5.373a7.903 7.903 0 0 1-2.96 3.423c-1.437 1.09-3.285 1.636-5.54 1.636h-2.19c-.63 0-1.174.38-1.354.974l-1.594 4.907a.955.955 0 0 1-.944.69zm-4.08-1.28h3.365l1.323-4.073a2.2 2.2 0 0 1 2.08-1.466h2.19c1.882 0 3.44-.443 4.595-1.3a6.355 6.355 0 0 0 2.36-2.77c.65-1.392.93-2.994 1.11-4.785.08-1.02.13-1.88.18-2.75l.02-.36c.014-.25.033-.5.054-.76.1-1.4.2-2.78-.6-3.75-.8-.92-2.366-1.33-4.56-1.33H6.22L3.496 20.057z"/>
                      </svg>
                      PayPal Payment
                    </h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>You will be redirected to PayPal to complete your payment securely.</p>
                      <div className="mt-3 space-y-1">
                        <p>✅ Secure payment through PayPal</p>
                        <p>✅ No need to enter card details here</p>
                        <p>✅ You can use PayPal balance or linked cards</p>
                      </div>
                      <p className="mt-3 text-blue-400">
                        ℹ️ After clicking "Place Order", you will be redirected to PayPal login page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-white to-gray-200 text-black px-8 py-4 font-bold text-lg rounded-lg hover:from-gray-100 hover:to-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay {formatPrice(finalPrice, currencyInfo.code, currencyInfo.symbol)}
                  </>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading checkout...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  )
}
