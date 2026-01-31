// WooCommerce Configuration – same keys as lib/woocommerce-env.ts (env override, else fallback)
const FALLBACK_URL = 'https://payment.trapstarofficial.store/';
const FALLBACK_KEY = 'ck_c20ac943e12b15217711aa1bb556f021b3494c1f';
const FALLBACK_SECRET = 'cs_133dfd017d60c461496be3b6b58e3360e7947582';

module.exports = {
  WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL || FALLBACK_URL,
  CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY || FALLBACK_KEY,
  CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET || FALLBACK_SECRET,
  APPLICATION_PASSWORD: process.env.WOOCOMMERCE_APPLICATION_PASSWORD || ''
};

