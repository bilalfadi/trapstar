import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Trapstar Official - Premium Streetwear Collection | trapstarofficial.store',
    template: '%s | Trapstar Official',
  },
  description: 'Shop the latest Trapstar collection featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies. Official Trapstar streetwear with bold designs and quality materials. Free shipping available.',
  keywords: 'Trapstar, Trapstar Official, streetwear, tracksuits, jackets, hoodies, t-shirts, bags, premium streetwear, trapstarofficial.store',
  authors: [{ name: 'Trapstar Official' }],
  creator: 'Trapstar Official',
  publisher: 'Trapstar Official',
  metadataBase: new URL('https://trapstarofficial.store'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trapstarofficial.store',
    siteName: 'Trapstar Official',
    title: 'Trapstar Official - Premium Streetwear Collection',
    description: 'Shop the latest Trapstar collection featuring premium tracksuits, jackets, shorts, t-shirts, bags, and hoodies.',
    images: [
      {
        url: '/trapstar.webp',
        width: 1200,
        height: 630,
        alt: 'Trapstar Official Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trapstar Official - Premium Streetwear Collection',
    description: 'Shop the latest Trapstar collection featuring premium streetwear.',
    images: ['/trapstar.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
  },
  icons: {
    icon: '/trapstar.webp',
    shortcut: '/trapstar.webp',
    apple: '/trapstar.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

