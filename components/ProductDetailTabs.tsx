'use client'

import { useState } from 'react'

interface Product {
  id: number
  title: string
  slug: string
  category: string
  price: number | null
  discountPrice: number | null
  image: string
  description: string
  brand?: string
}

interface ProductDetailTabsProps {
  product: Product
}

export default function ProductDetailTabs({ product }: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description')

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews (0)' },
    { id: 'shipping', label: 'Shipping & Delivery' },
  ]

  return (
    <div className="mb-12">
      {/* Tab Buttons */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'description' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{product.title}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              <strong>Trapstar T-Shirt</strong> is understood for its numerous series of captivating designs. Wearers can express their individuality effortlessly due to each T-shirt's carefully crafted visible appeal and unique design. No matter your flavor, <strong>Trapstar</strong> has a pattern or layout to fit all of us.
            </p>
            
            <h4 className="text-lg font-semibold text-white mb-3">Specifications:</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-2 mb-6">
              <li>Unisex</li>
              <li>T-shirts</li>
              <li>100% Cotton</li>
              <li>Drawstring closure</li>
              <li>Washed vintage effect</li>
              <li>Made in USA</li>
            </ul>

            <h4 className="text-lg font-semibold text-white mb-3">Recommended Products:</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Trapstar Future Shirt</li>
              <li>Trapstar Jesus Emblem T-Shirt</li>
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Reviews</h3>
            <p className="text-gray-400 mb-6">There are no reviews yet.</p>
            <p className="text-gray-400 mb-6">Be the first to review "{product.title}"</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Your rating <span className="text-red-500">*</span>
                </label>
                <select className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white">
                  <option>Rate…</option>
                  <option>Perfect</option>
                  <option>Good</option>
                  <option>Average</option>
                  <option>Not that bad</option>
                  <option>Very poor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Your review <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Write your review here..."
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              
              <button
                type="submit"
                className="bg-white text-black px-6 py-2 font-semibold hover:bg-gray-200 transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Shipping & Delivery</h3>
            <div className="text-gray-400 space-y-4 leading-relaxed">
              <p>
                We offer fast shipping worldwide. Orders are typically processed within 1-2 business days.
              </p>
              <p>
                <strong>Standard Shipping:</strong> 5-7 business days
              </p>
              <p>
                <strong>Express Shipping:</strong> 2-3 business days
              </p>
              <p>
                <strong>International Shipping:</strong> 7-14 business days
              </p>
              <p>
                Free shipping on orders over $100. Track your order using the tracking number provided in your confirmation email.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

