import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Trapstar Official | trapstarofficial.store',
  description: 'Trapstar Official Privacy Policy - Learn how we collect, use, and safeguard your personal information. We are committed to protecting your privacy.',
  keywords: 'Trapstar Privacy Policy, privacy, data protection, trapstarofficial.store',
  openGraph: {
    title: 'Privacy Policy | Trapstar Official',
    description: 'Trapstar Official Privacy Policy - Learn how we collect, use, and safeguard your personal information.',
    url: 'https://trapstarofficial.store/privacy-policy',
    siteName: 'Trapstar Official',
    type: 'website',
  },
  alternates: {
    canonical: 'https://trapstarofficial.store/privacy-policy',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-400 space-y-4">
          <p>
            At Trapstar Official, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.
          </p>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including when you make a purchase, create an account, or subscribe to our newsletter.
          </p>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, communicate with you, and improve our services.
          </p>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>
      </div>
    </div>
  )
}

