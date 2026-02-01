const http = require('http');
const data = JSON.stringify({ orderId: 285 });
const opts = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/woocommerce/get-payment-url',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const j = JSON.parse(body);
      console.log('redirectUrl:', j.redirectUrl || '(missing)');
      console.log('fallbackPayUrl:', j.fallbackPayUrl || '(missing)');
      console.log('paymentUrl:', j.paymentUrl || '(missing)');
      console.log('orderKey:', j.orderKey ? 'present' : '(missing)');
      if (j.redirectUrl && j.redirectUrl.startsWith('http')) {
        console.log('OK – redirect URL mila, redirect chalega');
      } else {
        console.log('FAIL – redirect URL nahi mila');
      }
    } catch (e) {
      console.log('Body:', body.slice(0, 300));
    }
    process.exit(0);
  });
});
req.on('error', e => {
  console.error(e.message);
  process.exit(1);
});
req.write(data);
req.end();
