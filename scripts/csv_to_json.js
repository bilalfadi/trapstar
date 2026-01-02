const fs = require('fs');
const path = require('path');

// Read CSV files
const csvPath1 = path.join(__dirname, '..', 'data', 'products.csv');
const csvPath2 = path.join(__dirname, '..', 'data', '1.csv');
const csvPath3 = path.join(__dirname, '..', 'data', 'trapstar.csv');
const jsonPath = path.join(__dirname, '..', 'data', 'products.json');
const bilalPath = path.join(__dirname, '..', 'public', 'bilal');

// Get all image files from bilal folder
function getAllImages() {
  if (!fs.existsSync(bilalPath)) {
    return [];
  }
  return fs.readdirSync(bilalPath).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
}

// Find matching image for product name
function findImage(productName, imageFiles) {
  // Normalize product name: remove special chars, convert to lowercase
  const normalized = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  
  // Try exact match first
  for (const file of imageFiles) {
    const fileBase = path.basename(file, path.extname(file))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    
    if (fileBase === normalized || fileBase.includes(normalized) || normalized.includes(fileBase)) {
      return `/bilal/${file}`;
    }
  }
  
  // Try partial match
  const nameWords = normalized.split('_').filter(w => w.length > 3);
  for (const file of imageFiles) {
    const fileBase = path.basename(file, path.extname(file))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    
    let matchCount = 0;
    for (const word of nameWords) {
      if (fileBase.includes(word)) {
        matchCount++;
      }
    }
    
    if (matchCount >= Math.min(3, nameWords.length)) {
      return `/bilal/${file}`;
    }
  }
  
  return null;
}

const imageFiles = getAllImages();
console.log(`📁 Found ${imageFiles.length} images in bilal folder`);

// Read all CSV files
const allCsvContent = [];
if (fs.existsSync(csvPath1)) {
  allCsvContent.push(fs.readFileSync(csvPath1, 'utf-8'));
}
if (fs.existsSync(csvPath2)) {
  allCsvContent.push(fs.readFileSync(csvPath2, 'utf-8'));
}
if (fs.existsSync(csvPath3)) {
  allCsvContent.push(fs.readFileSync(csvPath3, 'utf-8'));
}

const combinedContent = allCsvContent.join('\n');
const lines = combinedContent.split('\n').filter(line => line.trim());

// Get headers
const headers = lines[0].split(',').map(h => h.trim());

console.log('Headers:', headers);

// Parse CSV rows
const products = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Simple CSV parsing (handles quoted values)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim()); // Last value
  
  if (values.length >= headers.length) {
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      row[header] = value;
    });
    
    // Only process if has name
    if (row.name && row.name.trim()) {
      // Map CSV columns to our JSON format
      const title = row.name.trim();
      
      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Map category
      let category = (row.category || '').trim().toLowerCase();
      const titleLower = title.toLowerCase();
      
      // Check title for category hints (for Trapstar products)
      // Map CSV categories to our category system
      // Order matters - check specific matches first
      if (category === 'tracksuits' || category.includes('tracksuit')) {
        category = 'tracksuits';
      } else if (category === 'short sets' || category === 'short set' || category.includes('short set')) {
        category = 'shorts';
      } else if (category === 'bags' || category === 'bag' || category.includes('bag')) {
        category = 'bags';
      } else if (category === 'jackets' || category === 'jacket' || category.includes('jacket')) {
        category = 'jackets';
      } else if (category === 't-shirts' || category === 't shirts' || category === 't-shirt' || category.includes('t-shirt') || (category.includes('shirt') && !category.includes('short'))) {
        category = 't-shirts';
      } else if (category === 'hoodies' || category === 'hoodie' || category.includes('hoodie')) {
        category = 'hoodies';
      } else if (titleLower.includes('tracksuit')) {
        category = 'tracksuits';
      } else if (titleLower.includes('short set') || titleLower.includes('shorts')) {
        category = 'shorts';
      } else if (titleLower.includes('puffer jacket') || titleLower.includes('windbreaker') || titleLower.includes('jacket')) {
        category = 'jackets';
      } else if (titleLower.includes('bag')) {
        category = 'bags';
      } else if (titleLower.includes('central cee')) {
        category = 'collaborations';
      } else if (category.includes('sweatpant')) {
        category = 'sweatpants';
      } else if (category.includes('short') && !category.includes('short set')) {
        category = 'shorts';
      } else if (category.includes('jean')) {
        category = 'jeans';
      } else if (category.includes('beanie')) {
        category = 'beanies';
      } else if (category.includes('hat')) {
        category = 'hats';
      } else if (category.includes('ski mask')) {
        category = 'ski-masks';
      } else if (category.includes('long sleeve')) {
        category = 'long-sleeves';
      } else if (category.includes('sweater')) {
        category = 'sweaters';
      } else if (category.includes('pant') && !category.includes('sweat')) {
        category = 'pants';
      } else if (category === 'uncategorized' || category === 'trapstar' || !category) {
        // Try to infer from title
        if (titleLower.includes('hoodie')) {
          category = 'hoodies';
        } else if (titleLower.includes('t-shirt') || titleLower.includes('tee')) {
          category = 't-shirts';
        } else if (titleLower.includes('jacket')) {
          category = 'jackets';
        } else if (titleLower.includes('bag')) {
          category = 'bags';
        } else if (titleLower.includes('short set') || titleLower.includes('shorts')) {
          category = 'shorts';
        } else {
          category = 'hoodies'; // default
        }
      } else {
        category = 'hoodies'; // default
      }
      
      // Parse prices (remove £, $ and commas)
      const priceStr = (row.original_price || row.price || '').replace(/[£$,]/g, '').trim();
      const discountPriceStr = (row.price || '').replace(/[£$,]/g, '').trim();
      
      // Parse and validate prices
      const parsedPrice = priceStr ? parseFloat(priceStr) : null;
      const parsedDiscountPrice = discountPriceStr && discountPriceStr !== priceStr ? parseFloat(discountPriceStr) : null;
      
      // Ensure prices are valid numbers (not NaN)
      const price = (parsedPrice && !isNaN(parsedPrice) && parsedPrice > 0) ? parsedPrice : 299.99;
      const discountPrice = (parsedDiscountPrice && !isNaN(parsedDiscountPrice) && parsedDiscountPrice > 0) ? parsedDiscountPrice : null;
      
      // Find matching local image or use image_url
      const localImage = findImage(title, imageFiles);
      const imagePath = localImage || row.image_url || '';
      
      // For Trapstar products, allow image_url if no local image
      const isTrapstar = title.toLowerCase().includes('trapstar') || (row.brand || '').toLowerCase().includes('trapstar');
      if (!localImage && !imagePath && !isTrapstar) {
        console.log(`⚠️  Skipping "${title}" - no image found`);
        continue;
      }
      
      // Determine brand
      const brand = (row.brand || '').trim() || (titleLower.includes('trapstar') ? 'Trapstar' : 'Hellstar');
      
      // Only include Trapstar products - skip Hellstar
      if (brand.toLowerCase() !== 'trapstar' && !titleLower.includes('trapstar')) {
        continue;
      }
      
      const product = {
        id: products.length + 1,
        title: title,
        slug: slug,
        category: category,
        price: price,
        discountPrice: discountPrice,
        image: imagePath,
        description: row.description || title,
        brand: 'Trapstar'
      };
      
      products.push(product);
    }
  }
}

console.log(`\n✅ Parsed ${products.length} products`);

// Count matched images
const matchedImages = products.filter(p => p.image.startsWith('/bilal/')).length;
console.log(`🖼️  Matched ${matchedImages} local images`);

// Save to JSON
fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));

console.log(`✅ Saved to: ${jsonPath}`);

// Show summary
const byCategory = {};
const byBrand = {};
products.forEach(p => {
  byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
});

console.log('\n📊 By category:');
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log('\n🏷️  By brand:');
Object.entries(byBrand).forEach(([brand, count]) => {
  console.log(`  ${brand}: ${count}`);
});

// Show Trapstar categories specifically
const trapstarProducts = products.filter(p => p.brand === 'Trapstar');
const trapstarByCategory = {};
trapstarProducts.forEach(p => {
  trapstarByCategory[p.category] = (trapstarByCategory[p.category] || 0) + 1;
});

if (trapstarProducts.length > 0) {
  console.log('\n⭐ Trapstar products by category:');
  Object.entries(trapstarByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
}

