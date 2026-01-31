import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Trapstar Official',
  description: 'Terms of Service for Trapstar Official Store. Read our terms and conditions before making a purchase.',
  alternates: {
    canonical: 'https://trapstarofficial.store/terms-of-service',
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-400 mb-6" suppressHydrationWarning>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-400 leading-relaxed">
            By accessing and using the Trapstar Official website (trapstarofficial.store), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
          <p className="text-gray-400 leading-relaxed">
            Permission is granted to temporarily download one copy of the materials on Trapstar Official's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="text-gray-400 list-disc list-inside mt-4 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">3. Products and Pricing</h2>
          <p className="text-gray-400 leading-relaxed">
            We reserve the right to change prices and product availability at any time. All prices are in USD unless otherwise stated. We strive to provide accurate product descriptions and images, but we do not warrant that product descriptions or other content on this site is accurate, complete, reliable, current, or error-free.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">4. Orders and Payment</h2>
          <p className="text-gray-400 leading-relaxed">
            When you place an order, you are offering to purchase a product subject to these Terms of Service. We reserve the right to accept or reject your order for any reason. All orders are subject to product availability and acceptance by us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">5. Shipping and Delivery</h2>
          <p className="text-gray-400 leading-relaxed">
            Shipping terms and delivery times are estimates only. We are not responsible for delays caused by shipping carriers or customs. Please refer to our Shipping Policy for more details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">6. Returns and Refunds</h2>
          <p className="text-gray-400 leading-relaxed">
            Our return and refund policy is detailed in our Return & Exchange and Refund & Cancellation pages. Please review these policies before making a purchase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
          <p className="text-gray-400 leading-relaxed">
            All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Trapstar Official and is protected by copyright and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-400 leading-relaxed">
            Trapstar Official shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
          <p className="text-gray-400 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:support@trapstarofficial.store" className="text-white hover:underline">
              support@trapstarofficial.store
            </a>
            {' '}or visit our{' '}
            <Link href="/contact-us" className="text-white hover:underline">
              Contact Us
            </Link>
            {' '}page.
          </p>
        </section>
      </div>
    </div>
  )
}

