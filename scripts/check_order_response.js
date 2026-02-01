const https = require('https');
const config = require('./woocommerce_config.js');
const auth = Buffer.from(config.CONSUMER_KEY + ':' + config.CONSUMER_SECRET).toString('base64');
let baseUrl = config.WOOCOMMERCE_URL.replace(/\/wp\/?$/, '');
let path = (config.WOOCOMMERCE_URL.indexOf('wp') !== -1) ? '/wp/wp-json/wc/v3/orders' : '/wp-json/wc/v3/orders';
const url = new URL(path + '?per_page=1&orderby=id&order=desc', baseUrl);
const opts = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + url.search,
  method: 'GET',
  headers: { 'Authorization': 'Basic ' + auth }
};
https.request(opts, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log('Error', res.statusCode, data.slice(0, 300));
      process.exit(1);
    }
    const list = JSON.parse(data);
    const order = Array.isArray(list) ? list[0] : list;
    if (!order) {
      console.log('No order found');
      process.exit(0);
    }
    console.log('--- Latest WooCommerce order response ---');
    console.log('Order ID:', order.id);
    console.log('Top-level keys:', Object.keys(order).join(', '));
    const meta = order.meta_data || [];
    console.log('meta_data length:', meta.length);
    const orderKeyMeta = meta.find(m => m.key === '_order_key');
    console.log('_order_key present:', !!orderKeyMeta, orderKeyMeta ? 'value=' + orderKeyMeta.value : '');
    console.log('order.order_key:', order.order_key);
    console.log('order.key:', order.key);
    console.log('order.payment_url:', order.payment_url);
    console.log('order.checkout_payment_url:', order.checkout_payment_url);
    if (meta.length > 0) {
      console.log('meta_data keys:', meta.map(m => m.key).join(', '));
    }
    process.exit(0);
  });
}).on('error', e => {
  console.error(e);
  process.exit(1);
}).end();
