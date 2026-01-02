const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Multiple websites to scrape
const websites = [
  {
    name: 'hellstarofficialstudio',
    urls: [
      'https://hellstarofficialstudio.com/store/',
      'https://hellstarofficialstudio.com/hoodies/',
      'https://hellstarofficialstudio.com/t-shirts/',
      'https://hellstarofficialstudio.com/tracksuits/',
      'https://hellstarofficialstudio.com/sweatpants/',
      'https://hellstarofficialstudio.com/shorts/',
    ]
  }
];

let allProducts = [];
let productIdCounter = 1;
const seenTitles = new Set();

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractCategory(title, url) {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  if (lowerTitle.includes('hoodie') || lowerUrl.includes('hoodie')) return 'hoodies';
  if (lowerTitle.includes('t-shirt') || lowerTitle.includes('tshirt') || lowerUrl.includes('t-shirt')) return 't-shirts';
  if (lowerTitle.includes('tracksuit') || lowerUrl.includes('tracksuit')) return 'tracksuits';
  if (lowerTitle.includes('sweatpant') || lowerUrl.includes('sweatpant')) return 'sweatpants';
  if (lowerTitle.includes('short') || lowerUrl.includes('short')) return 'shorts';
  
  return 'hoodies';
}

function extractPrice(priceText) {
  if (!priceText) return null;
  
  const numbers = priceText.match(/[\d.]+/g);
  if (!numbers || numbers.length === 0) {
    return null;
  }
  
  const prices = numbers.map(n => parseFloat(n.replace(',', ''))).filter(p => p > 0 && p < 10000);
  if (prices.length === 0) {
    return null;
  }
  
  if (prices.length === 1) {
    return { price: prices[0], discountPrice: null };
  }
  
  const sorted = prices.sort((a, b) => b - a);
  return { price: sorted[0], discountPrice: sorted[1] };
}

async function scrapeUrl(url, websiteName) {
  console.log(`\n📄 Scraping: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const products = [];
    
    // Try multiple selectors
    $('a[href*="/product/"], a[href*="/shop/"], a[href*="/p/"], .product, [class*="product"], article').each((i, elem) => {
      const $elem = $(elem);
      const $link = $elem.is('a') ? $elem : $elem.find('a').first();
      
      if ($link.length === 0) return;
      
      const titleEl = $elem.find('h2, h3, h4, .title, [class*="title"], [class*="name"]').first();
      const title = titleEl.text().trim() || $elem.text().trim();
      
      if (!title || title.length < 5) return;
      
      const img = $elem.find('img').first();
      const image = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
      
      const priceEl = $elem.find('.price, [class*="price"], .amount, [class*="cost"]').first();
      const priceText = priceEl.text().trim();
      
      if (title && image) {
        products.push({ title, image, priceText, link: $link.attr('href') || '' });
      }
    });
    
    console.log(`  ✓ Found ${products.length} products on page`);
    
    // Process products
    let newCount = 0;
    for (const product of products) {
      if (!product.title || product.title.length < 5) continue;
      
      const titleLower = product.title.toLowerCase();
      if (seenTitles.has(titleLower)) continue;
      
      seenTitles.add(titleLower);
      
      const slug = generateSlug(product.title);
      const category = extractCategory(product.title, url);
      const priceData = extractPrice(product.priceText);
      
      // Skip if no price found
      if (!priceData) {
        continue;
      }
      
      // Only add if we have actual image from website
      if (!product.image || product.image.length < 10) {
        continue;
      }
      
      // Make image URL absolute
      let imageUrl = product.image;
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = urlObj.origin + imageUrl;
      }
      
      const productObj = {
        id: productIdCounter++,
        title: product.title.trim(),
        slug: slug,
        category: category,
        price: priceData.price,
        discountPrice: priceData.discountPrice,
        image: imageUrl,
        description: product.title.trim()
      };
      
      allProducts.push(productObj);
      newCount++;
    }
    
    console.log(`  ✅ Added ${newCount} new products (Total: ${allProducts.length})`);
    
    // Save after each page
    const outputPath = path.join(__dirname, '..', 'data', 'products.json');
    fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
    
    return newCount;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting to scrape from websites using axios...\n');
  console.log('Target: Get all products from actual websites\n');
  
  try {
    // Visit each website's URLs one by one
    for (const website of websites) {
      console.log(`\n🌐 Website: ${website.name}`);
      console.log(`   Total URLs: ${website.urls.length}\n`);
      
      for (let i = 0; i < website.urls.length; i++) {
        const url = website.urls[i];
        console.log(`\n[${i + 1}/${website.urls.length}]`);
        try {
          await scrapeUrl(url, website.name);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between pages
        } catch (err) {
          console.error(`  ⚠️  Error on ${url}: ${err.message}`);
          continue;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between websites
    }
    
  } catch (error) {
    console.error('Error during scraping:', error.message);
  }
  
  // Final statistics
  console.log(`\n\n📊 Final Statistics:`);
  console.log(`   Total products: ${allProducts.length}`);
  
  const byCategory = {};
  allProducts.forEach(p => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  });
  
  console.log(`\n   By category:`);
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });
  
  const outputPath = path.join(__dirname, '..', 'data', 'products.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`\n✅ Saved ${allProducts.length} products to: ${outputPath}`);
}

main().catch(console.error);



