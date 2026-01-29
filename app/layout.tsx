import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: {
    default: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
    template: '%s | Trapstar Official',
  },
  description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
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
    title: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
    description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
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
    title: 'Trapstar Official Store 2026 [Top 10 Streetwear Deals]',
    description: 'Shop Trapstar tracksuits, jackets, hoodies, tees, shorts and bags. Premium streetwear, fast shipping, secure checkout, and weekly new drops worldwide.',
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
    google: 'MUrHh9qE4cYSB5Qsq51eUjHOfG_BPTrr2-y_K5ociqM',
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
        <StructuredData />
        <Footer />
        <BackToTop />
      </body>
    </html>
  )
}

