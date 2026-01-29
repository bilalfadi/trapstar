/**
 * Centralized WooCommerce env handling.
 * Uses env vars if set; otherwise fallback (pehle jaisa).
 */

const FALLBACK_URL = 'https://payment.trapstarofficial.store/wp'
const FALLBACK_KEY = 'ck_119e56a9618b84741df6016c20c17f8cb8962f08'
const FALLBACK_SECRET = 'cs_35a846092f0ab01f1e9067704aa3a2da2a5e443b'

export function getWooCommerceEnv() {
  const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || FALLBACK_URL
  const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || FALLBACK_KEY
  const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || FALLBACK_SECRET

  return { WOOCOMMERCE_URL, CONSUMER_KEY, CONSUMER_SECRET }
}

