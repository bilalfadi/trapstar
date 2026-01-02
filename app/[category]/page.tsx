import { getProductsByCategory, getProductsByCategoryAndBrand } from '@/lib/products'
import ProductGrid from '@/components/ProductGrid'
import { notFound } from 'next/navigation'

interface CategoryPageProps {
  params: {
    category: string
  }
}

const validCategories = ['hoodies', 't-shirts', 'tracksuits', 'sweatpants', 'shorts', 'jackets', 'jeans', 'beanies', 'hats', 'ski-masks', 'long-sleeves', 'sweaters', 'pants', 'bags', 'collaborations']

export default function CategoryPage({ params }: CategoryPageProps) {
  // Use category directly from params (already matches URL)
  const category = params.category

  if (!validCategories.includes(category)) {
    notFound()
  }

  // Get only Trapstar products
  const trapstarProducts = getProductsByCategoryAndBrand(category, 'trapstar')
  const allProducts = trapstarProducts

  // Format category name for display
  const categoryName = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Category-specific descriptions for Trapstar
  const categoryDescriptions: Record<string, string> = {
    'hoodies': "The Trapstar hoodie's popularity comes from its blend of premium quality, striking graphics, and streetwear credibility. It is a badge of style for the brave, as celebrities, rappers, and influencers have been spotted wearing these distinctive pieces.",
    't-shirts': "Trapstar is not an established brand. The loudness of their T-shirts is not childish. The designs carry some real weight—metaphorically and physically. It is not thin cotton that deteriorates after two washes.",
    'tracksuits': "Trapstar tracksuits are popular because they are both fashion-forward and wearable because they combine premium comfort with bold streetwear design. The brand's edgy graphics, quality materials, and limited releases make them a must-have for streetwear.",
    'sweatpants': "Trapstar Sweatpants' Rebirth. Because they combine comfort, toughness, and edge in a way that fits today's culture, Trapstar sweatpants have become a must-have for streetwear. Consistent design, quality materials, and that signature Trapstar aesthetic make these sweatpants more than just loungewear—they're a statement piece.",
    'shorts': "Trapstar Shorts are athletic shorts of high quality made with streetwear culture in mind. They frequently have eye-catching graphic prints, high-quality materials, and a distinct relaxed fit that will make you stand out.",
    'jackets': "Trapstar jackets combine premium materials with bold streetwear designs. From leather jackets to track jackets, each piece features the brand's signature aesthetic and quality craftsmanship.",
    'jeans': "Trapstar jeans feature unique designs with raw edges and airbrushed details. Made with premium denim, these jeans offer both style and durability for the modern streetwear enthusiast.",
    'beanies': "Stay warm and stylish with Trapstar beanies. Featuring the brand's iconic logos and designs, these beanies are perfect for completing your streetwear look.",
    'hats': "From snapback hats to fitted caps, Trapstar offers a wide range of headwear. Each hat features unique designs, premium materials, and the brand's distinctive streetwear aesthetic.",
    'ski-masks': "Trapstar ski masks combine functionality with streetwear style. Perfect for cold weather and making a bold fashion statement.",
    'long-sleeves': "Trapstar long sleeve shirts offer comfort and style with the brand's signature designs. Perfect for layering or wearing on their own.",
    'sweaters': "Trapstar sweaters provide warmth and style with premium materials and distinctive designs. Perfect for the colder months.",
    'pants': "Trapstar pants combine comfort and style with the brand's signature aesthetic. From track pants to casual wear, each piece offers quality and design.",
    'bags': "Complete your streetwear look with Trapstar bags. From cross-body bags to backpacks, each piece features the brand's iconic logos and premium quality.",
    'collaborations': "Exclusive Trapstar collaborations featuring unique designs and limited edition pieces from special partnerships."
  }

  const description = categoryDescriptions[category] || ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">{categoryName}</h1>
        <p className="text-gray-400 mb-3 md:mb-6 text-sm md:text-base">{allProducts.length} products available</p>
      </div>

      {/* Trapstar Products Section */}
      {trapstarProducts.length > 0 && (
        <section className="mb-16 md:mb-20">
          <ProductGrid products={trapstarProducts} />
          {description && (
            <div className="mt-8">
              <p className="text-gray-400 max-w-3xl text-sm md:text-base leading-relaxed">{description}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

