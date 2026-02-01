const https = require('https');
const config = require('./woocommerce_config.js');
const auth = Buffer.from(config.CONSUMER_KEY + ':' + config.CONSUMER_SECRET).toString('base64');
let baseUrl = config.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '');
const hasWp = (config.WOOCOMMERCE_URL || '').indexOf('wp') !== -1;
const pathPrefix = hasWp ? '/wp' : '';
const backendHost = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

function get(path) {
  return new Promise((resolve, reject) => {
    const u = new URL(pathPrefix + path, baseUrl.startsWith('http') ? baseUrl : 'https://' + baseUrl);
    const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname + (u.search || ''), method: 'GET', headers: { 'Authorization': 'Basic ' + auth } };
    https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, data: d, headers: res.headers });
        else reject(new Error(res.statusCode + ' ' + d.slice(0, 200)));
      });
    }).on('error', reject).end();
  });
}

function getOrderPayHtml(orderId, orderKey) {
  return new Promise((resolve, reject) => {
    const path = pathPrefix + '/checkout/order-pay/' + orderId + '/?pay_for_order=true&key=' + encodeURIComponent(orderKey);
    const u = new URL(path, baseUrl.startsWith('http') ? baseUrl : 'https://' + baseUrl);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + (u.search || ''),
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrapstarBot/1.0)', 'Accept': 'text/html' }
    };
    https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: d, location: res.headers.location });
      });
    }).on('error', reject).end();
  });
}

async function main() {
  console.log('=== Ziina link check ===\n');

  // 1. Latest order
  const listRes = await get('/wp-json/wc/v3/orders?per_page=1&orderby=id&order=desc');
  const list = JSON.parse(listRes.data);
  const order = Array.isArray(list) ? list[0] : list;
  if (!order) {
    console.log('No order found');
    process.exit(0);
  }

  const orderId = order.id;
  const orderKey = order.order_key || order.key || (order.meta_data || []).find(m => m.key === '_order_key')?.value;
  console.log('Order ID:', orderId);
  console.log('Order key:', orderKey || '(missing)');
  console.log('payment_url:', order.payment_url || '(missing)');
  console.log('payment_method:', order.payment_method);

  // 2. Order meta – any Ziina / external payment URL?
  const meta = order.meta_data || [];
  const urlMeta = meta.filter(m => typeof m.value === 'string' && m.value.startsWith('http'));
  console.log('\n--- Order meta_data (URLs only) ---');
  if (urlMeta.length === 0) console.log('None');
  else urlMeta.forEach(m => console.log('  ', m.key, ':', m.value));

  const ziinaMeta = meta.find(m => typeof m.value === 'string' && /ziina|pay\.|payment/i.test(m.value) && m.value.startsWith('http'));
  if (ziinaMeta) console.log('\n>>> Ziina URL in meta:', ziinaMeta.key, ziinaMeta.value);
  else console.log('\n>>> Ziina URL in order meta: NAHI MILA');

  // 3. payment_url – Ziina or backend?
  if (order.payment_url) {
    try {
      const url = new URL(order.payment_url);
      const isBackend = url.hostname === backendHost;
      console.log('\n--- payment_url ---');
      console.log('  URL:', order.payment_url);
      console.log('  Backend (same host):', isBackend);
      if (/ziina|pay\./i.test(order.payment_url)) console.log('  >>> Ziina jaisa URL: HAAN');
      else console.log('  >>> Ziina jaisa URL: NAHI');
    } catch (e) {}
  }

  // 4. Hit order-pay page – redirect or HTML
  if (!orderKey) {
    console.log('\n>>> Order key nahi, order-pay page hit nahi kar sakte');
    process.exit(0);
  }

  console.log('\n--- Order-pay page hit (GET) ---');
  const pageRes = await getOrderPayHtml(orderId, orderKey);
  console.log('Status:', pageRes.status);
  console.log('Location header:', pageRes.location || '(none)');

  if (pageRes.location && pageRes.location.startsWith('http')) {
    const loc = pageRes.location;
    const isZiina = /ziina|pay\./i.test(loc) && !loc.includes(backendHost);
    console.log('>>> Redirect URL:', loc);
    console.log('>>> Ziina link (external):', isZiina ? 'HAAN' : 'NAHI');
  }

  const html = pageRes.data || '';
  const hasZiinaInHtml = /ziina/i.test(html);
  console.log('HTML me "ziina" text:', hasZiinaInHtml ? 'HAAN' : 'NAHI');

  const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i);
  const formAction = html.match(/<form[^>]+action=["']([^"']+)["']/gi);
  const hrefs = (html.match(/href=["'](https?:\/\/[^"']+)["']/g) || []).slice(0, 10);

  if (metaRefresh && metaRefresh[1]) {
    const u = metaRefresh[1].trim();
    console.log('Meta refresh URL:', u);
    console.log('>>> Ziina (meta refresh):', /ziina|pay\./i.test(u) && !u.includes(backendHost) ? 'HAAN' : 'NAHI');
  }
  if (formAction && formAction.length) console.log('Form actions count:', formAction.length);
  const ziinaHref = (hrefs || []).find(s => /ziina|pay\./i.test(s) && !s.includes(backendHost));
  if (ziinaHref) console.log('>>> Ziina jaisa href:', ziinaHref);
  else console.log('>>> Ziina link HTML me: NAHI MILA');

  console.log('\n=== Result: Ziina link aa raha hai? ===');
  const fromMeta = !!ziinaMeta;
  const fromRedirect = pageRes.location && /ziina|pay\./i.test(pageRes.location) && !pageRes.location.includes(backendHost);
  const fromHtml = !!(metaRefresh && /ziina|pay\./i.test(metaRefresh[1]) && !metaRefresh[1].includes(backendHost)) || !!ziinaHref;
  if (fromMeta || fromRedirect || fromHtml) console.log('HAAN – Ziina link mil raha hai (meta/redirect/HTML)');
  else console.log('NAHI – Ziina link kahin nahi mil raha (order meta, redirect, order-pay HTML)');
  process.exit(0);
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
