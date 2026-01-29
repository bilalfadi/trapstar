const https = require('https');
const config = require('./woocommerce_config.js');

const WOOCOMMERCE_URL = config.WOOCOMMERCE_URL;
const CONSUMER_KEY = config.CONSUMER_KEY;
const CONSUMER_SECRET = config.CONSUMER_SECRET;

console.log('🔍 Testing WooCommerce API Connection...\n');
console.log('WOOCOMMERCE_URL:', WOOCOMMERCE_URL);
console.log('CONSUMER_KEY:', CONSUMER_KEY.substring(0, 10) + '...');
console.log('CONSUMER_SECRET:', CONSUMER_SECRET.substring(0, 10) + '...\n');

// Test API connection
function testConnection() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    let apiPath = '/wp-json/wc/v3/products?per_page=1';
    let baseUrl = WOOCOMMERCE_URL;
    
    if (WOOCOMMERCE_URL.endsWith('/wp') || WOOCOMMERCE_URL.endsWith('/wp/')) {
      apiPath = '/wp/wp-json/wc/v3/products?per_page=1';
      baseUrl = WOOCOMMERCE_URL.replace(/\/wp\/?$/, '');
    }
    
    const apiUrl = new URL(apiPath, baseUrl);
    
    console.log('🔗 Full API URL:', apiUrl.href);
    console.log('🔗 Hostname:', apiUrl.hostname);
    console.log('🔗 Path:', apiUrl.pathname);
    console.log('🔗 Port:', apiUrl.port || 443);
    console.log('');
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname + (apiUrl.search || ''),
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Trapstar-Store-Test/1.0'
      },
      timeout: 10000
    };
    
    console.log('📡 Making request...\n');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log('📥 Response Status:', res.statusCode);
      console.log('📥 Response Headers:', JSON.stringify(res.headers, null, 2));
      console.log('');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const products = JSON.parse(data);
            console.log('✅ SUCCESS! API is working.');
            console.log('✅ Products found:', products.length);
            if (products.length > 0) {
              console.log('✅ Sample product:', products[0].name);
            }
            resolve({ success: true, products });
          } catch (error) {
            console.error('❌ Failed to parse response:', error.message);
            console.error('Response data:', data.substring(0, 500));
            reject(error);
          }
        } else if (res.statusCode === 502) {
          console.error('❌ 502 Bad Gateway Error');
          console.error('❌ This means the WooCommerce server is down or overloaded.');
          console.error('❌ Response:', data.substring(0, 500));
          console.error('\n💡 Possible causes:');
          console.error('   1. WooCommerce server is temporarily down');
          console.error('   2. Server is overloaded with too many requests');
          console.error('   3. Nginx/Proxy server issue');
          console.error('   4. WordPress/WooCommerce plugin issue');
          reject(new Error(`502 Bad Gateway: ${data.substring(0, 200)}`));
        } else if (res.statusCode === 401) {
          console.error('❌ 401 Unauthorized Error');
          console.error('❌ API credentials are invalid or expired.');
          reject(new Error('401 Unauthorized: Check API credentials'));
        } else if (res.statusCode === 404) {
          console.error('❌ 404 Not Found Error');
          console.error('❌ API endpoint not found. Check the URL path.');
          console.error('❌ Expected path:', apiPath);
          reject(new Error('404 Not Found: Check API URL'));
        } else {
          console.error(`❌ Error ${res.statusCode}`);
          console.error('Response:', data.substring(0, 500));
          reject(new Error(`Status ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('\n💡 Possible causes:');
      console.error('   1. Network connectivity issue');
      console.error('   2. DNS resolution problem');
      console.error('   3. Firewall blocking the connection');
      console.error('   4. SSL certificate issue');
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ Request Timeout');
      console.error('❌ Server did not respond within 10 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run test
testConnection()
  .then((result) => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });

