import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compact TOC / Quick navigation (kept clean for UX) */}
        <div className="mb-10 rounded-xl border border-gray-900 bg-gray-950/60 p-5 md:p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-full">
              <h2 className="sr-only">Table of contents</h2>
              <p className="text-gray-300 text-sm md:text-base">
                Shop <strong>Trapstar</strong> streetwear across tracksuits, jackets, tees, shorts, bags, and hoodies.
              </p>
            </div>
            <Link
              href="/store"
              className="inline-flex w-fit items-center justify-center bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Browse store
            </Link>
          </div>

          <nav aria-label="Table of contents" className="mt-4">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
              <li>
                <Link className="text-gray-300 hover:text-white transition-colors" href="/#collections">
                  Shop collections
                </Link>
              </li>
              <li>
                <Link className="text-gray-300 hover:text-white transition-colors" href="/#overview">
                  Trapstar overview
                </Link>
              </li>
              <li>
                <Link className="text-gray-300 hover:text-white transition-colors" href="/#shipping-at-a-glance">
                  Shipping at a glance
                </Link>
              </li>
              <li>
                <Link className="text-gray-300 hover:text-white transition-colors" href="/#faqs">
                  FAQs
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Warehouse */}
          <div>
            <h3 className="text-white font-medium mb-4">Warehouse</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              1218 S Glendale Ave, Suite 132, Glendale,<br />
              CA 91205<br />
              United States
            </p>
          </div>

          {/* Collection */}
          <div>
            <h3 className="text-white font-medium mb-4">Collection</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/store" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/hoodies" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Hoodie
                </Link>
              </li>
              <li>
                <Link href="/t-shirts" className="text-gray-400 hover:text-white text-sm transition-colors">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/tracksuits" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Tracksuits
                </Link>
              </li>
              <li>
                <Link href="/sweatpants" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Sweatpants
                </Link>
              </li>
              <li>
                <Link href="/shorts" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Shorts
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/authenticity-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Authenticity Service
                </Link>
              </li>
              <li>
                <Link href="/size-guides" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Size Guides
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-400 hover:text-white text-sm transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/customer-care" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Customer Care
                </Link>
              </li>
              <li>
                <Link href="/return-exchange" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Return & Exchange
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-gray-400 hover:text-white text-sm transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-medium mb-4">Newsletter</h3>
            <form className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white border border-gray-800"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white border border-gray-800"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>© {new Date().getFullYear()} Trapstar Official. All rights reserved.</p>
              <p className="mt-2">
                <a href="mailto:support@trapstarofficial.store" className="hover:text-white transition-colors">
                  support@trapstarofficial.store
                </a>
                {' | '}
                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                  +1 (234) 567-890
                </a>
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://twitter.com/trapstarofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com/trapstarofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/trapstarofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com/@trapstarofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors mr-4">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="text-gray-400 hover:text-white text-sm transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
