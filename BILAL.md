# IP-Based Currency Detection - Full Details

## Overview
Website automatically user ki country detect karti hai IP address se aur us country ki currency default set kar deti hai. Har page load par fresh detection hoti hai - currency cache mein store nahi hoti taake har visit par accurate country detection ho sake.

## How It Works

### Step 1: Page Load
- User website open karta hai
- `CurrencySelector` component mount hota hai
- `useEffect` hook trigger hota hai

### Step 2: IP Detection
- Multiple APIs se country detect hoti hai:
  1. **ipapi.co** - `https://ipapi.co/json/`
  2. **ip-api.com** - `https://ip-api.com/json/?fields=status,countryCode`
  3. **geojs.io** - `https://geojs.io/geo.json`
  4. **api.country.is** - `https://api.country.is`
- Agar client-side APIs fail ho jayein, server-side API try hoti hai (`/api/detect-country`)

### Step 3: Currency Setting
- Detected country ke according currency automatically set hoti hai
- `currencyChanged` custom event dispatch hota hai
- Saare components (PriceDisplay, ProductCard) automatically update ho jate hain

### Step 4: No Cache Storage
- Auto-detected currency **localStorage mein store nahi hoti**
- Har page load par fresh detection hoti hai
- Sirf manual selection (user dropdown se select kare) localStorage mein save hoti hai

## Files & Implementation

### 1. Server-Side API (`app/api/detect-country/route.ts`)

**Functionality:**
- User ka IP address extract karta hai request headers se
- Priority order:
  1. `x-forwarded-for` header
  2. `x-real-ip` header
  3. `x-client-ip` header
  4. Default: '8.8.8.8'

**API Services:**
1. **Vercel/Cloudflare Headers** (first priority):
   - `x-vercel-ip-country` (Vercel)
   - `cf-ipcountry` (Cloudflare)
   - `x-country-code` (custom)

2. **ipapi.co** (primary):
   - URL: `https://ipapi.co/{ip}/json/`
   - Response: `{ country_code: "PK" }`

3. **ip-api.com** (fallback):
   - URL: `http://ip-api.com/json/{ip}?fields=countryCode`
   - Response: `{ countryCode: "PK" }`

**Response Format:**
```json
{
  "country": "PK"
}
```

### 2. Client-Side Component (`components/CurrencySelector.tsx`)

**IP Detection Flow:**

```typescript
// Step 1: Client-side APIs try karte hain
const apis = [
  { url: 'https://ipapi.co/json/', key: 'country_code' },
  { url: 'https://ip-api.com/json/?fields=status,countryCode', key: 'countryCode' },
  { url: 'https://geojs.io/geo.json', key: 'country' },
  { url: 'https://api.country.is', key: 'country' }
]

// Step 2: Server-side API fallback
if (detectedCountry === 'US') {
  const response = await fetch('/api/detect-country')
  const data = await response.json()
  if (data.country && data.country !== 'US') {
    detectedCountry = data.country
  }
}

// Step 3: Currency set karte hain
const country = COUNTRIES.find(c => c.code === detectedCountry)
if (country) {
  setSelectedCountry(detectedCountry)
  window.dispatchEvent(new CustomEvent('currencyChanged', { 
    detail: { currency: country.currency, countryCode: detectedCountry } 
  }))
}
```

**Important:**
- `useEffect` har page load par `detectCountryFromIP()` call karta hai
- Auto-detected country localStorage mein **NOT stored**
- Manual selection (`handleCountrySelect`) localStorage mein save hoti hai

## Integration

### PriceDisplay Component
- `currencyChanged` event listen karta hai
- Auto-detected currency automatically apply hoti hai
- No localStorage dependency

### ProductCard Component
- `currencyChanged` event listen karta hai
- Product prices automatically update hote hain
- No localStorage dependency

## Complete Flow

```
User page load karta hai
    â†“
CurrencySelector component mount hota hai
    â†“
useEffect trigger â†’ detectCountryFromIP() call
    â†“
Client-side APIs try (ipapi.co, ip-api.com, geojs.io, api.country.is)
    â†“
Agar country detect ho jaye:
    - Currency set hoti hai
    - currencyChanged event dispatch
    - Saare components update
    â†“
Agar sab APIs 'US' return karein:
    - Server-side API (/api/detect-country) try
    - Server-side APIs (ipapi.co, ip-api.com) try
    - Agar country detect ho jaye, currency set
    â†“
User manually country select kare (optional):
    - handleCountrySelect() call
    - Currency set hoti hai
    - currencyChanged event dispatch
    - (Manual selection localStorage mein save hoti hai)
```

## Why Multiple APIs?

**Reliability:**
- Koi ek API fail ho jaye to doosri try hoti hai
- Different APIs different accuracy levels provide karte hain
- Localhost development mein bhi kaam karta hai

**Accuracy:**
- Client-side APIs direct browser se call hoti hain (better IP detection)
- Server-side APIs production mein better kaam karti hain (Vercel/Cloudflare headers)
- Multiple sources se cross-verification

**No API Keys:**
- Sabhi APIs free tier use karte hain
- No authentication needed
- No rate limiting issues (multiple fallbacks)

## API Services Details

### Client-Side APIs:
1. **ipapi.co** - 1,000 requests/day free
2. **ip-api.com** - 45 requests/minute free
3. **geojs.io** - Unlimited requests free
4. **api.country.is** - Free, simple API

### Server-Side APIs:
1. **ipapi.co** - Same as client-side but server call
2. **ip-api.com** - Same as client-side but server call

## Why No localStorage for Auto-Detection?

**Problem with Caching:**
- Agar user travel kare (different country), cached currency wrong ho sakti hai
- VPN use karne par wrong country detect ho sakti hai
- Fresh detection har baar accurate results deti hai

**Solution:**
- Auto-detected currency cache nahi hoti
- Har page load par fresh detection
- Manual selection cache hoti hai (user preference)

## Error Handling

**Client-Side:**
- Agar koi API fail ho, next API try hoti hai
- Agar sab fail ho jayein, default 'US' set hota hai
- Console logs har step ke liye debugging

**Server-Side:**
- Network errors catch kiye gaye hain
- API failures gracefully handle kiye gaye hain
- Default 'US' return hota hai agar sab fail ho jayein

**User Experience:**
- No loading spinners (background detection)
- Instant currency update
- No errors visible to user (graceful degradation)

## Key Points Summary

âœ… **Automatic**: IP address se country detect karta hai
âœ… **No Cache**: Auto-detected currency localStorage mein store nahi hoti
âœ… **Multiple APIs**: 4+ APIs with fallbacks for reliability
âœ… **Client + Server**: Both client-side and server-side detection
âœ… **Manual Override**: User manually country select kar sakta hai
âœ… **Event-Based**: Custom events se saare components update hote hain
âœ… **Production Ready**: Vercel/Cloudflare headers support
âœ… **Development Friendly**: Localhost par bhi kaam karta hai

## Files Reference

- **`app/api/detect-country/route.ts`**: Server-side IP detection API
- **`components/CurrencySelector.tsx`**: Client-side currency selector with IP detection
- **`components/PriceDisplay.tsx`**: Currency-aware price display (listens to events)
- **`components/ProductCard.tsx`**: Product card with currency support (listens to events)
- **`lib/currency.ts`**: Currency conversion utilities and country data
