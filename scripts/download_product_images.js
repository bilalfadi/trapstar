// Download all product images from WooCommerce and save to public/products/
// This script downloads images once and stores them locally

const https = require('https')
const fs = require('fs')
const path = require('path')
const config = require('./woocommerce_config.js')

const WOOCOMMERCE_URL = config.WOOCOMMERCE_URL
const CONSUMER_KEY = config.CONSUMER_KEY
const CONSUMER_SECRET = config.CONSUMER_SECRET

const PRODUCTS_IMAGES_DIR = path.join(process.cwd(), 'public', 'products')

// Ensure products directory exists
if (!fs.existsSync(PRODUCTS_IMAGES_DIR)) {
  fs.mkdirSync(PRODUCTS_IMAGES_DIR, { recursive: true })
  console.log(`📁 Created directory: ${PRODUCTS_IMAGES_DIR}`)
}

// Download image function
function downloadImage(imageUrl, productId, retries = 3) {
  return new Promise((resolve, reject) => {
    const imageUrlObj = new URL(imageUrl)
    const filename = `${productId}.jpg`
    const filepath = path.join(PRODUCTS_IMAGES_DIR, filename)
    
    // Skip if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Image already exists: ${filename}`)
      resolve(`/products/${filename}`)
      return
    }
    
    const options = {
      hostname: imageUrlObj.hostname,
      port: imageUrlObj.port || 443,
      path: imageUrlObj.pathname + (imageUrlObj.search || ''),
      method: 'GET',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }
    
    const file = fs.createWriteStream(filepath)
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log(`✅ Downloaded: ${filename}`)
          resolve(`/products/${filename}`)
        })
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        file.close()
        fs.unlinkSync(filepath)
        if (retries > 0) {
          const redirectUrl = res.headers.location
          console.log(`🔄 Redirect to: ${redirectUrl}`)
          downloadImage(redirectUrl, productId, retries - 1).then(resolve).catch(reject)
        } else {
          reject(new Error(`Too many redirects`))
        }
      } else {
        file.close()
        fs.unlinkSync(filepath)
        reject(new Error(`Status ${res.statusCode}`))
      }
    })
    
    req.on('error', (error) => {
      file.close()
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
      if (retries > 0) {
        console.log(`⚠️  Error downloading ${filename}, retrying... (${retries} attempts left)`)
        setTimeout(() => {
          downloadImage(imageUrl, productId, retries - 1).then(resolve).catch(reject)
        }, 2000)
      } else {
        reject(error)
      }
    })
    
    req.on('timeout', () => {
      req.destroy()
      file.close()
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
      if (retries > 0) {
        console.log(`⚠️  Timeout downloading ${filename}, retrying... (${retries} attempts left)`)
        setTimeout(() => {
          downloadImage(imageUrl, productId, retries - 1).then(resolve).catch(reject)
        }, 2000)
      } else {
        reject(new Error('Request timeout'))
      }
    })
    
    req.end()
  })
}

// Fetch all products and download images
async function downloadAllImages() {
  let allProducts = []
  let currentPage = 1
  let totalPages = 1
  const productsPerPage = 100
  
  console.log('📥 Fetching all products from WooCommerce...')
  
  // Fetch all products
  while (currentPage <= totalPages) {
    try {
      const pageProducts = await new Promise((resolve, reject) => {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
        let apiPath = `/wp-json/wc/v3/products?page=${currentPage}&per_page=${productsPerPage}`
        let baseUrl = WOOCOMMERCE_URL
        
        if (WOOCOMMERCE_URL.endsWith('/wp') || WOOCOMMERCE_URL.endsWith('/wp/')) {
          apiPath = `/wp/wp-json/wc/v3/products?page=${currentPage}&per_page=${productsPerPage}`
          baseUrl = WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
        }
        
        const apiUrl = new URL(apiPath, baseUrl)
        const options = {
          hostname: apiUrl.hostname,
          port: apiUrl.port || 443,
          path: apiUrl.pathname + (apiUrl.search || ''),
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
        
        const req = https.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const products = JSON.parse(data)
                if (currentPage === 1) {
                  totalPages = parseInt(res.headers['x-wp-totalpages'] || '1')
                  console.log(`📥 Found ${res.headers['x-wp-total'] || '0'} products across ${totalPages} pages`)
                }
                resolve(products)
              } catch (error) {
                reject(new Error('Failed to parse response'))
              }
            } else {
              reject(new Error(`Status ${res.statusCode}: ${data}`))
            }
          })
        })
        
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
        req.end()
      })
      
      allProducts = allProducts.concat(pageProducts)
      console.log(`✅ Fetched page ${currentPage}/${totalPages}: ${pageProducts.length} products`)
      currentPage++
      
      if (currentPage <= totalPages) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error.message)
      break
    }
  }
  
  console.log(`\n📥 Total products: ${allProducts.length}`)
  console.log('🖼️  Starting image downloads...\n')
  
  // Download images for each product
  let downloaded = 0
  let skipped = 0
  let failed = 0
  
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i]
    const productId = product.id
    
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0].src
      try {
        const localPath = await downloadImage(imageUrl, productId)
        downloaded++
        
        // Update product image path to local
        product.localImagePath = localPath
        
        // Small delay to avoid overwhelming the server
        if (i < allProducts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error) {
        console.error(`❌ Failed to download image for product ${productId}:`, error.message)
        failed++
        product.localImagePath = imageUrl // Fallback to original URL
      }
    } else {
      skipped++
    }
  }
  
  console.log(`\n✅ Download complete:`)
  console.log(`   - Downloaded: ${downloaded}`)
  console.log(`   - Skipped (no image): ${skipped}`)
  console.log(`   - Failed: ${failed}`)
  console.log(`\n💾 Images saved to: ${PRODUCTS_IMAGES_DIR}`)
}

// Run the script
downloadAllImages().catch(console.error)

