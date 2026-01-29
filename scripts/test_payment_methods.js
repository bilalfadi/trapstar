const https = require('https');
const config = require('./woocommerce_config.js');

const WOOCOMMERCE_URL = config.WOOCOMMERCE_URL;
const CONSUMER_KEY = config.CONSUMER_KEY;
const CONSUMER_SECRET = config.CONSUMER_SECRET;

function fetchPaymentMethods() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    
    let apiPath = `/wp/wp-json/wc/v3/payment_gateways`
    let baseUrl = WOOCOMMERCE_URL.replace(/\/wp\/?$/, '')
    
    const apiUrl = new URL(apiPath, baseUrl)
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
    
    console.log('Fetching payment methods from:', `${baseUrl}${apiPath}`)
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const paymentMethods = JSON.parse(data)
            console.log('\n=== All Payment Methods ===')
            console.log(`Total methods: ${paymentMethods.length}\n`)
            
            paymentMethods.forEach((method, index) => {
              console.log(`${index + 1}. ID: ${method.id}`)
              console.log(`   Title: ${method.title}`)
              console.log(`   Enabled: ${method.enabled}`)
              console.log(`   Description: ${method.description || 'N/A'}`)
              console.log('')
            })
            
            const enabledMethods = paymentMethods.filter((method) => method.enabled === true)
            console.log(`\n=== Enabled Payment Methods (${enabledMethods.length}) ===`)
            enabledMethods.forEach((method, index) => {
              console.log(`${index + 1}. ${method.id} - ${method.title}`)
            })
            
            // Check specifically for Ziina
            const ziinaMethod = paymentMethods.find(m => 
              m.id.toLowerCase().includes('ziina') || 
              m.title.toLowerCase().includes('ziina') ||
              m.method_title?.toLowerCase().includes('ziina')
            )
            
            console.log('\n=== Ziina Check ===')
            if (ziinaMethod) {
              console.log('✅ Ziina found!')
              console.log(JSON.stringify(ziinaMethod, null, 2))
            } else {
              console.log('❌ Ziina not found in payment methods')
              console.log('Available IDs:', paymentMethods.map(m => m.id).join(', '))
            }
            
            resolve(paymentMethods)
          } catch (error) {
            console.error('Parse error:', error)
            console.log('Raw response:', data)
            reject(new Error('Failed to parse response'))
          }
        } else {
          console.error(`Error: Status ${res.statusCode}`)
          console.log('Response:', data)
          reject(new Error(`Status ${res.statusCode}: ${data}`))
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('Request error:', error)
      reject(error)
    })
    
    req.end()
  })
}

fetchPaymentMethods()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  })
