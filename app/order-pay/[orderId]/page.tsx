'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

function PaymentFrameContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = (params?.orderId as string) || ''
  const orderKey = searchParams?.get('key') || ''
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setError('Order ID missing')
      return
    }
    fetch('/api/woocommerce/get-payment-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: Number(orderId) }),
    })
      .then((r) => r.json())
      .then((data) => {
        const url = (data.paymentUrl || data.fallbackPayUrl || '').trim()
        if (url && url.startsWith('http')) {
          setPaymentUrl(url)
        } else {
          setError('Payment link could not be loaded. Please use checkout to pay.')
        }
      })
      .catch(() => setError('Failed to load payment'))
      .finally(() => setLoading(false))
  }, [orderId, orderKey])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4" />
          <p>Loading payment...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentUrl) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold mb-3">Payment</h1>
          <p className="text-gray-400 mb-6">{error || 'Payment link not available.'}</p>
          <Link href="/store" className="bg-white text-black px-6 py-3 rounded-lg font-semibold inline-block">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-none border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Complete payment</h1>
        <Link href="/store" className="text-sm text-gray-400 hover:text-white underline">
          Back to store
        </Link>
      </div>
      <div className="flex-1 min-h-[80vh] p-4">
        <iframe
          src={paymentUrl}
          title="Payment"
          className="w-full h-full min-h-[75vh] rounded-lg border border-gray-800"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  )
}

export default function OrderPayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent" />
        </div>
      }
    >
      <PaymentFrameContent />
    </Suspense>
  )
}
