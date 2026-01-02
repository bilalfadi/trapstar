import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Trapstar Official | trapstarofficial.store',
  description: 'Contact Trapstar Official for customer support, inquiries, or assistance. Email us at support@trapstarofficial.store or visit our warehouse in Glendale, CA.',
  keywords: 'Contact Trapstar, Trapstar support, Trapstar customer service, trapstarofficial.store',
  openGraph: {
    title: 'Contact Us | Trapstar Official',
    description: 'Contact Trapstar Official for customer support, inquiries, or assistance.',
    url: 'https://trapstarofficial.store/contact-us',
    siteName: 'Trapstar Official',
    type: 'website',
  },
  alternates: {
    canonical: 'https://trapstarofficial.store/contact-us',
  },
}

export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Get in Touch</h2>
          <div className="text-gray-400 space-y-4">
            <p>
              Have a question or need assistance? We're here to help!
            </p>
            <div>
              <h3 className="text-white font-medium mb-2">Warehouse Address</h3>
              <p className="text-gray-400">
                1218 S Glendale Ave, Suite 132<br />
                Glendale, CA 91205<br />
                United States
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Email</h3>
              <p className="text-gray-400">support@trapstarofficial.store</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-white border border-gray-800"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-white border border-gray-800"
              />
            </div>
            <div>
              <textarea
                placeholder="Your Message"
                rows={6}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-white border border-gray-800"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-200 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

