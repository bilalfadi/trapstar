'use client'

import { useState, useEffect } from 'react'
import { COUNTRIES, getCurrencyInfo } from '@/lib/currency'

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string, countryCode: string) => void
}

export default function CurrencySelector({ onCurrencyChange }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>('US')

  // Always detect country from IP (no cache)
  useEffect(() => {
    detectCountryFromIP()
  }, [])
  
  // Detect country from IP address - try multiple APIs
  const detectCountryFromIP = async () => {
    try {
      let detectedCountry = 'US'
      
      // Try APIs that work from browser (CORS-friendly). api.country.is first â€“ usually works.
      const apis = [
        { url: 'https://api.country.is', key: 'country' },
        { url: 'https://ipapi.co/json/', key: 'country_code' },
        { url: 'https://ip-api.com/json/?fields=status,countryCode', key: 'countryCode' },
        { url: 'https://geojs.io/geo.json', key: 'country' }
      ]
      
      for (const api of apis) {
        try {
          const response = await fetch(api.url, {
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
          })
          
          if (response.ok) {
            const data = await response.json()
            const country = (data[api.key] || '').toString().toUpperCase()
            
            if (country && country.length === 2) {
              detectedCountry = country
              break
            }
          }
        } catch {
          continue
        }
      }
      
      // Fallback: Try server-side API
      if (detectedCountry === 'US') {
        try {
          const response = await fetch('/api/detect-country')
          const data = await response.json()
          if (data.country && data.country !== 'US') {
            detectedCountry = data.country
            console.log('Ã¢Å“â€¦ Country detected (server):', detectedCountry)
          }
        } catch (e) {
          console.log('Server-side failed')
        }
      }
      
      // Set currency based on detected country
      const country = COUNTRIES.find(c => c.code === detectedCountry)
      if (country) {
        setSelectedCountry(detectedCountry)
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
          detail: { currency: country.currency, countryCode: detectedCountry } 
        }))
        if (onCurrencyChange) {
          onCurrencyChange(country.currency, detectedCountry)
        }
      } else {
        setSelectedCountry('US')
        const defaultCountry = COUNTRIES[0]
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
          detail: { currency: defaultCountry.currency, countryCode: 'US' } 
        }))
      }
    } catch (error) {
      console.error('Error:', error)
      setSelectedCountry('US')
      const defaultCountry = COUNTRIES[0]
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency: defaultCountry.currency, countryCode: 'US' } 
      }))
    }
  }

  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0]
  const currencyInfo = getCurrencyInfo(selectedCountry)

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setIsOpen(false)
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
    if (onCurrencyChange) {
      onCurrencyChange(country.currency, countryCode)
    }
    window.dispatchEvent(new CustomEvent('currencyChanged', { 
      detail: { currency: country.currency, countryCode } 
    }))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        aria-label="Select country and currency"
      >
        <span className="hidden sm:inline">{currentCountry.currency}</span>
        <span className="sm:hidden">{currencyInfo.symbol}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-black border border-gray-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                Select Country / Currency
              </div>
              {COUNTRIES.map((country) => {
                const isSelected = country.code === selectedCountry
                return (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                      isSelected 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{country.currency}</span>
                      <span className="text-gray-500">{country.symbol}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}