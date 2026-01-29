# WooCommerce Integration Setup

## Steps to Import and Sync Products

### 1. Update WooCommerce Configuration

Edit `scripts/woocommerce_config.js` and update:
```javascript
WOOCOMMERCE_URL: 'https://your-woocommerce-site.com' // Your WooCommerce site URL
```

### 2. Import Products to WooCommerce

Run the import script to add products from `trapstar.csv` to WooCommerce:

```bash
node scripts/import_to_woocommerce.js
```

This will:
- Read products from `data/trapstar.csv`
- Create products in WooCommerce as "External" products
- Set external URLs from CSV `product_url` column
- Set categories, prices, images, etc.

### 3. Fetch Products from WooCommerce

After importing, fetch products back to update your site:

```bash
node scripts/fetch_from_woocommerce.js
```

This will:
- Fetch all products from WooCommerce API
- Convert to your site's format
- Save to `data/products.json`
- Include WooCommerce external URLs for "Buy Now" buttons

### 4. Regenerate Products JSON (Alternative)

If you want to use CSV directly (without WooCommerce):

```bash
node scripts/csv_to_json.js
```

This will read `trapstar.csv` and include `product_url` as `externalUrl` in products.json.

## Notes

- Products are created as "External" type in WooCommerce
- External URLs from CSV are used for "Buy Now" buttons
- Products sync automatically when you run fetch script
- Make sure WooCommerce REST API is enabled in WooCommerce settings

## API Credentials

Do **NOT** store credentials in the repo. Set them as environment variables instead:

- `WOOCOMMERCE_URL` (example: `https://payment.trapstarofficial.store/wp`)
- `WOOCOMMERCE_CONSUMER_KEY` (example: `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- `WOOCOMMERCE_CONSUMER_SECRET` (example: `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

