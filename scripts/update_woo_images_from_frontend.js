/**
 * Backend (WooCommerce) pe product images = frontend URLs set karo
 * Taake backend checkout pe bhi yahi images dikhen (trapstarofficial.store/products/XXX.jpg)
 *
 * Run: node scripts/update_woo_images_from_frontend.js
 * .env.local me WOOCOMMERCE_* hona chahiye (ya woocommerce_config fallback use hoga)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./woocommerce_config');

const WOOCOMMERCE_URL = (config.WOOCOMMERCE_URL || '').replace(/\/$/, '');
const CONSUMER_KEY = config.CONSUMER_KEY;
const CONSUMER_SECRET = config.CONSUMER_SECRET;
const FRONTEND_BASE = 'https://trapstarofficial.store';
const hasWp = WOOCOMMERCE_URL.endsWith('/wp') || WOOCOMMERCE_URL.endsWith('/wp/');
const baseUrl = hasWp ? WOOCOMMERCE_URL.replace(/\/wp\/?$/, '') : WOOCOMMERCE_URL;
const apiPathPrefix = hasWp ? '/wp' : '';

function request(method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, baseUrl);
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };
    if (body && (method === 'PUT' || method === 'POST')) {
      const data = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(opts, (res) => {
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
    if (body && (method === 'PUT' || method === 'POST')) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const productsPath = path.join(__dirname, '..', 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.log('data/products.json nahi mila. Pehle products sync karo.');
    process.exit(1);
  }
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const withWooId = products.filter((p) => p.woocommerceId || p.id);
  console.log(`Products with WooCommerce ID: ${withWooId.length}`);

  let ok = 0;
  let fail = 0;
  for (const p of withWooId) {
    const wooId = p.woocommerceId || p.id;
    const imageUrl = `${FRONTEND_BASE}/products/${wooId}.jpg`;
    const pathname = `${apiPathPrefix}/wp-json/wc/v3/products/${wooId}`;
    const res = await request('PUT', pathname, {
      images: [{ src: imageUrl }]
    });
    if (res.status >= 200 && res.status < 300) {
      ok++;
      console.log(`OK ${wooId} ${p.title?.slice(0, 40) || ''}`);
    } else {
      fail++;
      console.log(`FAIL ${wooId} status=${res.status}`, res.data?.message || res.data);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`\nDone: ${ok} updated, ${fail} failed.`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
