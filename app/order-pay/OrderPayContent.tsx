'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { convertPrice, formatPrice, getCurrencyInfo } from '@/lib/currency'

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  image?: string
}

interface Order {
  id: number
  status: string
  total: string
  currency: string
  payment_method: string
  payment_method_title: string
  billing: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address_1: string
    city: string
    state: string
    postcode: string
    country: string
  }
  line_items: OrderItem[]
  meta_data?: Array<{ key: string; value: any }>
}

export interface OrderPayContentProps {
  orderId?: string
  orderKey?: string | null
}

export default function OrderPayContent({ orderId: propOrderId, orderKey: propOrderKey }: OrderPayContentProps = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get order ID from props or URL
  const orderId =
    propOrderId ||
    searchParams?.get('order_id') ||
    searchParams?.get('order-pay')?.split('/').pop()
  const orderKey = propOrderKey !== undefined ? propOrderKey : (searchParams?.get('key') || null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentPendingMessage, setPaymentPendingMessage] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [showPaymentFrame, setShowPaymentFrame] = useState(false)
  const [paymentFrameUrl, setPaymentFrameUrl] = useState<string | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [countryCode, setCountryCode] = useState('US')

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

    if (orderId) {
      fetchOrder()
    } else {
      setLoading(false)
    }

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, orderKey])

  async function fetchOrder() {
    if (!orderId) {
      setLoading(false)
      return
    }

    try {
      // Try to extract order ID from URL if it's in path format
      let actualOrderId = orderId
      if (orderId.includes('/')) {
        const parts = orderId.split('/')
        actualOrderId = parts[parts.length - 1] || orderId
      }

      const apiUrl = `/api/woocommerce/order/${actualOrderId}${orderKey ? `?key=${orderKey}` : ''}`
      console.log('📦 Fetching order from:', apiUrl)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const errMsg = (errBody as any)?.message || (errBody as any)?.error
        if (response.status === 404) {
          setPaymentError('Order not found')
        } else if (response.status === 403) {
          setPaymentError('Invalid order key. Please check your order link.')
        } else if (response.status === 503) {
          setPaymentError(errMsg || 'Payment service is temporarily unavailable. Please try again later.')
        } else {
          setPaymentError(errMsg || `Could not load order (${response.status}). Please try again.`)
        }
        setLoading(false)
        return
      }

      const orderData = await response.json()
      if (orderData) {
        // Normalize so render never crashes (line_items, billing)
        const order = {
          ...orderData,
          line_items: Array.isArray(orderData.line_items) ? orderData.line_items : [],
          billing: orderData.billing && typeof orderData.billing === 'object'
            ? orderData.billing
            : { first_name: '', last_name: '', email: '', phone: '', address_1: '', city: '', state: '', postcode: '', country: '' }
        }
        setOrder(order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setPaymentError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setPaymentError('')
    if (!order) {
      setPaymentError('Order not found')
      setSubmitting(false)
      return
    }
    try {
      const urlRes = await fetch('/api/woocommerce/get-payment-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const urlData = await urlRes.json().catch(() => ({}))
      const paymentUrl = (urlData.paymentUrl || '').trim()
      const isGatewayUrl = !!urlData.isGatewayUrl
      const isWooCommercePage = !!urlData.isWooCommercePage
      // Sirf gateway (Ziina/Stripe) pe redirect – WP page kabhi mat dikhana
      if (paymentUrl && paymentUrl.startsWith('http') && isGatewayUrl) {
        window.location.href = paymentUrl
        return
      }
      // Agar sirf WP order-pay URL hai (Ziina URL missing) to naye tab me kholo – user yahi pe rahe
      if (isWooCommercePage) {
        const wooUrl = (urlData.wooPayPageUrl || '').trim() ||
          (urlData.orderKey
            ? `https://payment.trapstarofficial.store/wp/checkout/order-pay/${order.id}/?pay_for_order=true&key=${urlData.orderKey}`
            : '')
        if (wooUrl) {
          window.open(wooUrl, '_blank', 'noopener,noreferrer')
          setPaymentError('')
          setPaymentPendingMessage(true)
        } else {
          setPaymentError('Order key not found. Please try again or check your email for the payment link.')
        }
      } else {
        setPaymentSuccess(true)
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-400 mb-6">{paymentError || 'The order you are looking for does not exist or could not be loaded.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store" className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200">
              Back to Store
            </Link>
            <Link href="/" className="border border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-800">
              Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (showPaymentFrame && paymentFrameUrl && order) {
    const orderTotal =
      typeof order.total === 'string'
        ? parseFloat(order.total.replace(/[^0-9.-]/g, '')) || 0
        : parseFloat(String(order.total)) || 0
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col">
        <div className="flex-none border-b border-gray-800 bg-black/80 backdrop-blur px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Complete payment</h1>
              <p className="text-gray-400 text-sm">
                Order #{order.id} · {order.payment_method_title || order.payment_method}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Amount:</span>
              <span className="font-bold">{formatPrice(orderTotal, order.currency || 'USD', '$')}</span>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentFrame(false)
                  setPaymentFrameUrl(null)
                }}
                className="ml-2 text-sm text-gray-400 hover:text-white underline"
              >
                Back
              </button>
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
          <p className="text-center text-gray-500 text-sm mt-3">Payment form is loaded securely. You stay on this site.</p>
        </div>
      </div>
    )
  }

  if (paymentPendingMessage && order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl border border-gray-800">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-3 text-white">Payment page opened</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Order #{order.id} is placed. We&apos;ve opened the payment page in a new tab. Please complete your payment there. If the new tab didn&apos;t open, check your browser&apos;s popup blocker or use the payment link sent to your email.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/store"
              className="bg-white text-black px-8 py-4 font-semibold hover:bg-gray-200 transition-all duration-300 inline-block rounded-lg shadow-lg"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="border border-gray-500 text-gray-300 px-8 py-3 font-semibold hover:bg-gray-800 rounded-lg transition-all"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    const pm = order?.payment_method || ''
    const isCodOrBacs = pm === 'cod' || pm === 'bacs' || pm.includes('cod') || pm.includes('bacs')
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl border border-gray-800">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {isCodOrBacs ? 'Order confirmed' : 'Payment successful'}
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {isCodOrBacs
              ? `Order #${order.id} is confirmed. ${
                  pm === 'bacs' || pm.includes('bacs')
                    ? 'Complete payment via bank transfer using the details sent to your email.'
                    : 'Pay when you receive your order.'
                }`
              : `Order #${order.id} has been confirmed. You will receive a confirmation email shortly.`}
          </p>
          <Link
            href="/store"
            className="bg-white text-black px-8 py-4 font-semibold hover:bg-gray-200 transition-all duration-300 inline-block rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const currencyInfo = getCurrencyInfo(countryCode)
  const orderTotal =
    typeof order.total === 'string'
      ? parseFloat(order.total.replace(/[^0-9.-]/g, '')) || 0
      : parseFloat(String(order.total)) || 0

  // For payment, use the actual order total (don't convert currency)
  const displayTotal = orderTotal
  void currencyInfo
  void convertPrice
  void displayTotal

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Complete Payment
          </h1>
          <p className="text-gray-400">
            Order #{order.id} - {order.status}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-800 sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Summary
              </h2>

              <div className="mb-6 space-y-4">
                {(order.line_items || []).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(item.price * item.quantity, order.currency || 'USD', '$')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-300">Billing Address</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  {order.billing && (
                    <>
                      <p>
                        {order.billing.first_name} {order.billing.last_name}
                      </p>
                      <p>{order.billing.address_1}</p>
                      <p>
                        {order.billing.city}, {order.billing.state} {order.billing.postcode}
                      </p>
                      <p>{order.billing.country}</p>
                      <p className="mt-2">{order.billing.email}</p>
                      {order.billing.phone && <p>{order.billing.phone}</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatPrice(orderTotal, order.currency || 'USD', '$')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-medium text-green-400">Free</span>
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold">{formatPrice(orderTotal, order.currency || 'USD', '$')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Complete payment</h2>
              </div>

              {paymentError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Payment method</p>
                <p className="font-semibold text-white">{order.payment_method_title || order.payment_method || '—'}</p>
                <p className="text-xs text-gray-400 mt-2">Selected at checkout. Click below to continue to payment.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-white to-gray-200 text-black px-8 py-4 font-bold text-lg rounded-lg hover:from-gray-100 hover:to-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
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
                      Pay {formatPrice(orderTotal, order.currency || 'USD', '$')}
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

