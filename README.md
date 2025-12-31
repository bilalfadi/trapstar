# Fashion E-Commerce Store

A modern fashion e-commerce website built with Next.js 14 (App Router), Tailwind CSS, and TypeScript.

## Features

- 🛍️ Product listing page with grid layout
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔍 Real-time product search
- 🏷️ Category pages (Hoodies, T-Shirts, Tracksuits, Sweatpants, Shorts)
- 📄 Dynamic product detail pages
- 🎨 Modern dark theme UI with premium streetwear aesthetic

## Tech Stackyes

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Server Components

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [category]/        # Dynamic category pages
│   ├── product/[slug]/    # Dynamic product detail pages
│   ├── search/            # Search results page
│   ├── store/             # Store page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── ProductGrid.tsx
├── data/                  # Dummy product data
│   └── products.json
└── lib/                   # Utility functions
    └── products.ts
```

## Pages

- `/` - Home/Store page (all products)
- `/store` - Store page
- `/hoodies` - Hoodies category
- `/t-shirts` - T-Shirts category
- `/tracksuits` - Tracksuits category
- `/sweatpants` - Sweatpants category
- `/shorts` - Shorts category
- `/product/[slug]` - Product detail page
- `/search?q=query` - Search results

## Build for Production

```bash
npm run build
npm start
```

