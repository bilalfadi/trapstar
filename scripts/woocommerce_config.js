// WooCommerce Configuration – same keys as lib/woocommerce-env.ts (env override, else fallback)
const FALLBACK_URL = 'https://payment.trapstarofficial.store/wp';
const FALLBACK_KEY = 'ck_119e56a9618b84741df6016c20c17f8cb8962f08';
const FALLBACK_SECRET = 'cs_35a846092f0ab01f1e9067704aa3a2da2a5e443b';

module.exports = {
  WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL || FALLBACK_URL,
  CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY || FALLBACK_KEY,
  CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET || FALLBACK_SECRET,
  APPLICATION_PASSWORD: process.env.WOOCOMMERCE_APPLICATION_PASSWORD || ''
};

