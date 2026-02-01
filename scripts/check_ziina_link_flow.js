/**
 * Check if Ziina payment link is returned after creating an order.
 * Run: node scripts/check_ziina_link_flow.js
 * Ensure .env.local has WooCommerce credentials and dev server is running on port 3000.
 */
const http = require('http');
const https = require('https');

// Use BASE from env for live test, e.g. BASE=https://trapstarofficial.store node scripts/check_ziina_link_flow.js
const BASE = process.env.BASE || 'http://localhost:3000';
const isHttps = BASE.startsWith('https');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const port = url.port || (isHttps ? 443 : 3000);
    const opts = {
      hostname: url.hostname,
      port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body && (method === 'POST' || method === 'PUT')) {
      const data = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const lib = isHttps ? https : http;
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body && (method === 'POST' || method === 'PUT')) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('1. Fetching products...');
  const productsRes = await request('GET', '/api/products');
  if (productsRes.status !== 200 || !productsRes.data?.products?.length) {
    console.log('   Failed or no products. Status:', productsRes.status);
    process.exit(1);
  }
  const product = productsRes.data.products[0];
  const woocommerceId = product.woocommerceId || product.id;
  console.log('   Using product:', product.title, '| WooCommerce ID:', woocommerceId);

  console.log('\n2. Creating order with Ziina...');
  const orderPayload = {
    productId: woocommerceId,
    quantity: 1,
    customer: {
      firstName: 'Test',
      lastName: 'Ziina',
      email: 'test-ziina@example.com',
      phone: '+971500000000',
      address: 'Test Address',
      city: 'Dubai',
      state: 'DXB',
      postcode: '00000',
      country: 'AE'
    },
    paymentMethod: 'ziina'
  };
  const orderRes = await request('POST', '/api/orders', orderPayload);
  if (orderRes.status !== 200 || !orderRes.data?.success) {
    console.log('   Order failed. Status:', orderRes.status, orderRes.data);
    process.exit(1);
  }
  const { id: orderId, orderKey } = orderRes.data.order || {};
  console.log('   Order created: #' + orderId, '| orderKey:', orderKey ? 'yes' : 'no');

  console.log('\n3. Getting payment URL...');
  const urlRes = await request('POST', '/api/woocommerce/get-payment-url', {
    orderId: Number(orderId),
    orderKey: orderKey || undefined
  });
  if (urlRes.status !== 200) {
    console.log('   get-payment-url failed. Status:', urlRes.status, urlRes.data);
    process.exit(1);
  }

  const paymentUrl = urlRes.data?.paymentUrl || urlRes.data?.payment_url;
  const redirectUrl = urlRes.data?.redirectUrl;
  const fallbackPayUrl = urlRes.data?.fallbackPayUrl;

  console.log('\n--- Result ---');
  console.log('paymentUrl (Ziina):', paymentUrl || '(missing)');
  console.log('redirectUrl:       ', redirectUrl || '(missing)');
  console.log('fallbackPayUrl:     ', fallbackPayUrl || '(missing)');

  const isZiinaLink =
    (paymentUrl && /ziina|pay\./i.test(paymentUrl)) ||
    (redirectUrl && /ziina|pay\./i.test(redirectUrl));

  if (isZiinaLink) {
    console.log('\n✅ Ziina link aa raha hai – payment URL Ziina / pay. wala hai.');
  } else if (redirectUrl || fallbackPayUrl) {
    console.log('\n⚠️  Ziina-specific URL nahi mila; redirect/fallback (order-pay page) mila. User backend order-pay pe jaa kar pay karega.');
  } else {
    console.log('\n❌ Koi payment/redirect URL nahi mila.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
