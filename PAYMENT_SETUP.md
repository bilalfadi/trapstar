# Payment Setup (Ziina + WooCommerce)

## Sirf WooCommerce tarike se – koi alag Ziina API nahi

Payment **sirf backend (WooCommerce) se** aata hai – jo Ziina wahan pe laga howa hai, usi se. Naya Ziina token ya direct API use nahi hota.

- Order create → **get-payment-url** backend se URL leta hai (Ziina URL agar order meta / order-pay se mile, warna backend order-pay URL).
- User ko jo URL mile (Ziina ya backend order-pay) wahi redirect hota hai – **backend pe laga Ziina** redirect / payment handle karta hai.

---

## Ziina enable hai but checkout pe aa nahi raha?

**Possible causes (code side – fix ho chuka):**

1. **WooCommerce `enabled` = "yes" (string)** – Kabhi API `enabled: "yes"` bhejta hai, code sirf `true` check kar raha tha. Ab dono (`true` aur `"yes"`) accept hote hain.
2. **API fail** – Browser **DevTools → Network** me `/api/woocommerce/payment-methods` check karo: status 200? response me array me Ziina hai?
3. **Console** – Checkout page khol ke **Console** me dekho: "Ziina Payment Method Found" ya "Ziina NOT found" – agar NOT found aur API 200 hai to response me `enabled` value check karo.

**Backend side:** WooCommerce → Settings → Payments me Ziina **Enabled** hona chahiye (toggle ON).

---

## Ziina payment enable hai – backend pe kya karna hai

Ziina WooCommerce me **enable** hai, lekin order-pay page pe **"Pending payment—it cannot be paid for"** aa raha hai aur **Ziina link/redirect nahi mil raha**. Neeche steps follow karo **payment.trapstarofficial.store** (WordPress/WooCommerce) pe.

---

### 1. Ziina plugin settings

- **WooCommerce** → **Settings** → **Payments** → **Ziina** (Credit/Debit Card, Apple Pay or Google Pay) pe click karo.
- Check karo:
  - **Enable/Disable** = Enabled.
  - **Test mode / Sandbox** – agar test kar rahe ho to Test mode ON, warna Live keys daal ke Live pe rakhna.
  - **API keys / credentials** – Ziina dashboard se sahi keys (Live ya Test) yahan daale hue hon.
  - Koi **"Allow pay for order"** ya **"Order pay"** option ho to **ON** karo.
- **Save changes**.

---

### 2. "Pay for order" / order-pay allow karo

WooCommerce kabhi **order status** ki wajah se "pay for order" block kar deta hai. Check karo:

- **WooCommerce** → **Settings** → **Advanced** → **Checkout** (ya **Account**).
- Agar **"Pay for existing orders"** / **"Allow customers to pay for pending orders"** jaisa option ho to **enable** karo.
- Koi **"Order pay"** / **"Pay for order"** page ya setting ho to ensure **enabled** hai.

---

### 3. Order status – Pending payment

Message aa raha hai: **"This order's status is 'Pending payment'—it cannot be paid for."**

- Ye usually tab hota hai jab theme ya koi plugin **"Pending payment"** orders ke liye **pay** button/link disable kar deta hai.
- **WooCommerce** → **Status** → **Orders** – koi recent Ziina order kholo.
  - Status **Pending payment** hona chahiye (ye sahi hai).
  - **Actions** me **"Customer pay page"** / **"Pay link"** jaisa kuch ho to test karo ke link sahi open ho raha hai.

Agar theme ya custom code me **"pending"** status ke orders ke liye payment block ho raha ho to:

- **Appearance** → **Theme File Editor** (ya child theme) me **checkout/order-pay** ya **pay-for-order** related template/file dhundho.
- Ya **Plugins** me koi **"Disable pay for order"** / **"Restrict payment"** wala plugin to nahi.

---

### 4. Ziina plugin docs / support

- Ziina ka **official docs** ya **WooCommerce integration guide** kholo.
- Wahan **"Pay for order"** / **"Order pay"** flow ka section dhundho – kya extra setting ya shortcode required hai.
- Agar Ziina **"payment link"** email me bhejta ho to check karo – **WooCommerce** → **Settings** → **Emails** → **"Customer invoice / Pay order"** jaisa email **enabled** hai.

---

### 5. Test flow backend pe

1. **WooCommerce** → **Orders** → naya order banao, **Payment method = Ziina**, **Status = Pending payment**.
2. Order pe **"Customer pay page"** / **Pay link** open karo (jo link customer ko milta hai).
3. **Expected:** Page pe Ziina payment form ya **redirect to Ziina** (card details wala page).
4. Agar ab bhi **"it cannot be paid for"** aaye to:
   - Ziina plugin **update** karo.
   - Theme / plugins me **pay for order** block karne wala code hatao.
   - Ziina support se poochho: **"Pay for order"** flow WooCommerce me kaise enable karein.

---

### 6. Short checklist (backend)

| Step | Kya karna hai |
|------|----------------|
| Ziina enabled | WooCommerce → Payments → Ziina ON, keys sahi |
| Pay for order | Settings / theme me "pay for existing orders" allow karo |
| Order status | Pending payment = sahi; block mat karo |
| Order-pay page | Direct link se open karke Ziina form/redirect check karo |
| Theme/plugins | Koi "cannot be paid for" logic to nahi |Jab backend pe order-pay link se **Ziina form ya Ziina redirect** dikhne lagega, tab humara site bhi Ziina URL use kar payega (agar backend HTML/redirect me Ziina link de).