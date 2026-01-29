// Loading fallback component
function OrderPayLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading payment page...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
import { Suspense } from 'react'
import OrderPayContent from './OrderPayContent'

export default function OrderPayPage() {
  return (
    <Suspense fallback={<OrderPayLoading />}>
      <OrderPayContent />
    </Suspense>
  )
}
