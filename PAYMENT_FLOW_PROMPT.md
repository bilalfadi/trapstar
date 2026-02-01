# Payment Flow – Ek Prompt / Reference (Next.js + WooCommerce + Ziina)

Is document ko kisi aur project me same payment flow lagane ke liye **ek prompt ki tarah copy-paste** kar sakte ho, ya reference ke liye use kar sakte ho.

---

## 1. Flow ka summary (user journey)

1. User **product/category** se **Buy Now** click karta hai → **frontend checkout** (`/checkout?product=slug`) pe jata hai.
2. Checkout form bharta hai, **payment method** (Ziina) select karta hai, **Place order** click karta hai.
3. Frontend **POST /api/orders** se WooCommerce me order create karta hai (body me `productId`, `quantity`, `size`, `lineTotal`, `paymentMethod`, `customer`).
4. Order create hone ke baad frontend **POST /api/woocommerce/get-payment-url** call karta hai (body: `orderId`, `orderKey`).
5. Get-payment-url **Ziina URL** (pay.ziina.com) return kare to user **seedha Ziina** pe redirect ho jata hai; warna **WordPress order-pay URL** return hota hai, user wahan **Pay for order** click karke Ziina pe jata hai.
6. Payment Ziina pe complete hoti hai, callback/webhook WooCommerce pe aata hai.

---

## 2. Frontend (Next.js) – kya chahiye

### 2.1 Checkout page (Place order)

- **Payment methods:** `GET /api/woocommerce/payment-methods` se list lo; Ziina (ya jo gateway ho) enable hona chahiye.
- **Order create:** `POST /api/orders` with body:
  - `productId` (WooCommerce product ID)
  - `quantity` (number)
  - `size` (optional string)
  - **`lineTotal`** (number) – product ki price (discountPrice ?? price). **Zaroori:** bina iske WooCommerce order total $0 ho sakta hai.
  - `paymentMethod` (string, e.g. `ziina` – WooCommerce gateway ID)
  - `paid: false`
  - `customer`: `{ firstName, lastName, email, phone, address, city, state, postcode, country }`
- Response me `order.id`, `order.orderKey` use karo.

### 2.2 Payment URL + redirect

- **`POST /api/woocommerce/get-payment-url`** with `{ orderId, orderKey }`.
- Response me use karo: `redirectUrl` ya `paymentUrl` ya `fallbackPayUrl`.
- Agar koi bhi URL mile (`redirectUrl` etc.) to **`window.location.replace(url)`** karo.
- Agar URL na mile to khud **order-pay URL** banao:  
  `{BACKEND_CHECKOUT_BASE}/checkout/order-pay/{orderId}/?pay_for_order=true&key={orderKey}`  
  aur isi pe redirect karo.
- **BACKEND_CHECKOUT_BASE** = tumhara WooCommerce site (e.g. `https://payment.trapstarofficial.store`).

---

## 3. API – Orders (create order)

- **Route:** `POST /api/orders`
- **Body:** `productId`, `quantity`, `size`, **`lineTotal`**, `paymentMethod`, `paid`, `customer`.
- **WooCommerce payload:**  
  `currency: 'USD'`, `payment_method`, `payment_method_title`, `billing`, `shipping`,  
  **line_items** me har item ke liye agar `lineTotal > 0` ho to **`subtotal` aur `total`** dono set karo (string), taake order total $0 na aaye.
- Response: `{ success, order: { id, orderNumber, status, total, currency, orderKey } }`.

---

## 4. API – Get payment URL

- **Route:** `POST /api/woocommerce/get-payment-url`
- **Body:** `orderId`, `orderKey` (optional but recommended).
- **Logic:**
  1. Order WooCommerce se fetch karo (REST API). Order meta me koi **payment/gateway URL** (Ziina) ho to use karo.
  2. Ziina order ho aur **gateway URL na mile** to:
     - Order-pay page **GET** karke HTML parse karo; **sirf pay.ziina.com** wale URL accept karo (plugin assets / woo-blocks.js reject).
     - Optional: order-pay ka **Pay for order** form **POST** karke 302 redirect follow karo; agar Location **pay.ziina.com** ho to wahi URL return karo.
  3. **Ziina URL validate:** sirf `pay.ziina.com` (hostname). Koi bhi aisa URL jo backend domain ho ya `.js`/`.css` ya `/wp-content/plugins/ziina/` ho use **mat** return karo.
  4. Fallback: **order-pay URL** banao:  
     `{scheme}://{host}{pathPrefix}/checkout/order-pay/{orderId}/?pay_for_order=true&key={orderKey}`
- **Return:** `redirectUrl` = Ziina URL agar mile, warna order-pay URL. Kabhi bhi backend domain ka direct page URL as “payment URL” mat bhejo; sirf gateway URL ya order-pay URL.

---

## 5. WordPress / WooCommerce – zaroori cheezein

### 5.1 Store settings

- **Currency:** USD (Ziina supported currencies me hona chahiye).
- **Payments:** Ziina (ya tumhara gateway) **Enabled**, sahi keys.

### 5.2 “Pending payment—it cannot be paid for” fix

WooCommerce order-pay pe **Pending payment** orders ke liye payment allow karo:

- Filter: **`woocommerce_valid_order_statuses_for_payment`** – array me `pending` aur `failed` ensure karo (priority 999).
- Filter: **`woocommerce_order_needs_payment`** – jab order status `pending` ya `failed` ho to **true** return karo (priority 999).

### 5.3 Order-pay page (optional styling)

- **Pay for order button upar:** Form pe `display: flex; flex-direction: column` do; **#payment** (ya payment block) pe `order: -1` do taake button wala block upar aaye.
- **Colors:** Button ka background/text color theme ke hisaab se set kar sakte ho (e.g. black/white).
- **Document title:** Order-pay page pe browser title “Pay for order – [Site Name]” set kar sakte ho (e.g. `document_title_parts` filter).

---

## 6. Environment / config

- **WOOCOMMERCE_URL** – WordPress/WooCommerce site base URL (e.g. `https://payment.trapstarofficial.store`).
- **CONSUMER_KEY**, **CONSUMER_SECRET** – WooCommerce REST API keys.
- Frontend me **BACKEND_CHECKOUT_BASE** = same as WOOCOMMERCE_URL (order-pay link ke liye).

---

## 7. File list (is project me)

| Role | File |
|------|------|
| Checkout UI + Place order + redirect | `app/checkout/page.tsx` |
| Create order API | `app/api/orders/route.ts` |
| Get payment URL API | `app/api/woocommerce/get-payment-url/route.ts` |
| Payment methods list | `app/api/woocommerce/payment-methods/route.ts` |
| Pending payment + needs_payment fix | `wordpress-plugin-trapstar-add-to-checkout.php` |
| Order-pay button upar + color | `wordpress-plugin-trapstar-order-pay-style.php` |

---

## 8. Ek prompt (copy-paste for another project)

```
Payment flow implement karo: Next.js frontend se checkout, order WooCommerce (REST API) se create, phir user ko payment URL pe redirect.

Requirements:
1. Checkout page: productId, quantity, size, lineTotal (product price), paymentMethod, customer bhej kar POST /api/orders se order create karo. Response me orderId, orderKey aata hai.
2. Order create ke baad POST /api/woocommerce/get-payment-url with { orderId, orderKey }. Response me redirectUrl / paymentUrl / fallbackPayUrl use karke user ko redirect karo. Agar koi URL na mile to {WOOCOMMERCE_URL}/checkout/order-pay/{orderId}/?pay_for_order=true&key={orderKey} bana kar redirect karo.
3. Orders API: WooCommerce ko line_items me subtotal/total bhejo jab lineTotal > 0 ho (taake order total $0 na aaye). Currency USD, billing/shipping, payment_method set karo.
4. Get-payment-url API: Order fetch karo, order meta se gateway URL (e.g. Ziina) nikaalo. Sirf pay.ziina.com jaisa URL valid; backend domain ya .js/.css/plugin path reject karo. Fallback = order-pay URL.
5. WordPress: woocommerce_valid_order_statuses_for_payment me pending/failed add karo (priority 999). woocommerce_order_needs_payment me pending/failed ke liye true return karo (priority 999). Order-pay page pe Pay for order button upar dikhane ke liye form pe flex, #payment pe order: -1.
6. Env: WOOCOMMERCE_URL, CONSUMER_KEY, CONSUMER_SECRET. Frontend me BACKEND_CHECKOUT_BASE = WooCommerce site URL.
```

---

Is file ko doosri jagah use karte waqt:
- **BACKEND_CHECKOUT_BASE** / **WOOCOMMERCE_URL** apne domain se replace karo.
- Gateway name (Ziina) agar alag hai to get-payment-url me hostname check bhi usi ke hisaab se karo.
