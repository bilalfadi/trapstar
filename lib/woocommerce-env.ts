/**
 * Centralized WooCommerce env handling.
 * Uses env vars if set; otherwise fallback (pehle jaisa).
 */

const FALLBACK_URL = 'https://payment.trapstarofficial.store/'
const FALLBACK_KEY = 'ck_c20ac943e12b15217711aa1bb556f021b3494c1f'
const FALLBACK_SECRET = 'cs_133dfd017d60c461496be3b6b58e3360e7947582'

export function getWooCommerceEnv() {
  const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || FALLBACK_URL
  const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || FALLBACK_KEY
  const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || FALLBACK_SECRET

  return { WOOCOMMERCE_URL, CONSUMER_KEY, CONSUMER_SECRET }
}

