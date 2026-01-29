'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import OrderPayContent from '../OrderPayContent'

function OrderPayPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = (params as any)?.orderId as string
  const orderKey = searchParams?.get('key') || null
  
  return <OrderPayContent orderId={orderId} orderKey={orderKey} />
}

export default function OrderPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading payment page...</p>
        </div>
      </div>
    }>
      <OrderPayPageContent />
    </Suspense>
  )
}
