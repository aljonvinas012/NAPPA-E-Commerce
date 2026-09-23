# Mga Update sa Nappa E-Commerce Site (Round 4)

Ito yung listahan ng mga pagbabago base sa pinakahuling request mo (yung listahan
ni client). Same pa rin ang setup — tignan ang **SETUP-GUIDE.md**.
Round 1–3 notes ay nasa ibaba pa rin ng file na ito.

## ⚠️ Kailangan mong gawin bago i-run
1. Sa `backend/`, i-run ulit ang `npm install` — may bagong packages na dinagdag
   (`speakeasy` at `qrcode`, para sa Admin MFA / Authenticator App login).
2. Kung may existing products ka na sa database mo na wala pang SKU (galing sa
   mas lumang seed), i-run ang: `npm run backfill:sku` (sa loob ng `backend/`)
   para bigyan sila ng SKU. Bagong products na gagawin mo mula ngayon ay
   awtomatikong bibigyan ng SKU.
3. Kung gusto mong i-reset lahat ng products (fresh start with SKUs), pwede mo
   ring i-run: `npm run seed:products`.

## Client-facing
- **Scroll position bug** — naayos na. Dati kapag nag-scroll ka down sa isang
  page tapos lumipat ka ng ibang page, naka-scroll down pa rin agad doon.
  Awtomatiko na ngayon babalik sa taas ang bagong page.
- **"View Order History"** — kapag binuksan mo ito sa My Orders page, hindi na
  ito awtomatikong nagsasara kapag lumipat ka ng ibang page at bumalik. Ikaw
  (client/customer) ang magdedesisyon kung kailan mo ito itatago ulit.
- **Rating ng product** — may image na ngayon ng item sa "Rate Product" modal,
  kasama ang pangalan ng produkto, sa Orders page at Order Detail page.
- **Back button** — may Back button na ngayon sa Product Detail page (kapag
  ni-click mo yung isang item, hal. Bag 1).
- **Filter ng ratings** — sa Product Detail page, may dropdown na ngayon para
  i-filter ang reviews by 5, 4, 3, 2, o 1 star.
- **Status sa invoice** — naka-display na ang order status (Preparing, To Ship,
  To Receive, Completed, Cancelled) sa invoice, parehas sa client at admin side.
- **Modal sa pag-submit ng review** — "Review Submitted / Thank you for your
  review" modal na ngayon (dati toast lang).
- **Cancel order** — required na ngayon ang reason bago mo ma-cancel ang order.
  Kung walang laman ang reason, hindi ito papayagang i-submit (parehong
  frontend at backend ang nagre-require nito).
- **Cancel reason sa invoice** — kung cancelled ang order, makikita ang exact
  reason sa invoice (parehas na parehas ang makikita ng client at ng admin,
  dahil iisa lang ang pinagkukuhanan nito sa database).
- **Sign up success modal** — pagkatapos gumawa ng account, lalabas ang modal
  na may check icon (katulad ng "add to cart successful"), bago ka dadalhin
  sa Log In page.
- **Dagdag na gender options** — Female, Male, Non-binary, Transgender,
  Genderqueer, Prefer to self-describe, Prefer not to say — sa Sign Up form.

## Admin
- **Mark as read (notification)** — may hiwalay na "Mark as read" button na
  ngayon sa bawat unread notification sa admin bell, hindi mo na kailangang
  mag-click papunta sa Orders page para lang mabura ang unread dot.
- **Status sa invoice** — pareho ng sa client, naka-display na sa admin
  invoice ang order status at cancel reason (kapag cancelled).
- **Modal sa Add/Edit Product** — "Product added successfully" /
  "Product edited successfully" modal na ngayon (dati toast lang).
- **Bug fix: bagong category** — dati kapag naglagay ka ng bagong category
  (hal. "Key Chain") habang nag-a-add ng product, hindi siya na-save nang
  maayos dahil naka-lock sa isang fixed list ang database. Ayos na ito —
  kahit anong bagong category ang i-type mo, mase-save siya at agad lalabas
  sa client shop (Products page at Home page), dahil dynamic na ang pagkuha
  ng listahan ng categories base sa mga totoong laman ng product catalog.
- **Product image upload** — pumupunta na talaga ito sa
  `frontend/public/images/products/` folder — yung eksaktong folder na
  pinagtatagpuan din ng mga litrato ng seeded products.
- **SKU** — awtomatikong nabubuo ang SKU ng bawat bagong product, format na
  `NAPPA-XX-001` (XX = category code, hal. HB para sa "Handmade Bags"),
  tumataas ang number bawat bagong product sa parehong category. Naka-display
  ang SKU sa Admin Products table at sa Edit Product modal (read-only, hindi
  na-eedit dahil system-generated). **Makikita rin ito ng client** sa Product
  Detail page (sa ilalim ng product name).
- **Search by SKU** — pwede ka nang mag-search sa Admin Products gamit ang
  SKU, hindi lang pangalan o category.
- **Secure Admin Login + MFA (Authenticator App / TOTP)** — pag nag-login ang
  admin, kailangan munang i-verify ang 6-digit code mula sa Google
  Authenticator / Authy / Microsoft Authenticator bago ma-access ang admin
  dashboard. Sa unang beses na maglo-login ang admin account, may lalabas na
  QR code para i-scan sa authenticator app (may manual key din kung hindi
  ma-scan). Customer accounts (hindi admin) ay hindi apektado — isang hakbang
  pa rin ang kanilang login.
- **Low stock notification** — awtomatikong may lalabas na notification sa
  lahat ng admin kapag may product na bumaba sa 5 pababa (o naubos na) — either
  sa pag-order ng customer o sa pag-edit ng stock ng admin mismo.
- **Buong user info sa Users page** — may "View" button na ngayon sa bawat
  user, nagpapakita ng lahat ng detalye: email, phone, gender, date joined,
  last updated, total orders, total spending, at lahat ng saved addresses.

## Accessibility
- Pinanatili at na-verify ang keyboard navigation (Tab/Enter) at visible
  focus indicators sa mga form fields, dropdowns, at buttons sa parehong
  admin at client side — gumagamit na talaga ang site ng native
  `<button>`/`<input>`/`<select>` elements kaya keyboard-operable na ito by
  default, may global focus-visible outline style na rin.

---

# Mga Update sa Nappa E-Commerce Site (Round 3)

Ito yung listahan ng mga bagong pagbabago base sa pinakahuling hiling mo.
Same pa rin ang setup — tignan ang **SETUP-GUIDE.md** kung paano patakbuhin.
Round 2 notes ay nasa ibaba pa rin ng file na ito, para sa kumpletong history.

## Admin — Dashboard
- Kumpletong bagong Dashboard na may lahat ng hiniling na sections:
  - **Sales Overview** — Today/Weekly/Monthly Sales, Total Revenue, Net Revenue,
    Average Order Value, Growth % (up/down laban sa nakaraang buwan), Total Orders.
  - **Orders** — Total, Pending/Preparing, To Ship, To Receive, Completed,
    Cancelled, kasama ang Recent Orders table.
  - **Products & Inventory** — Total, Active, Inactive, Low Stock, Out of Stock,
    Inventory Value, recently added products.
  - **Customers** — Total, New This Month, Returning/Active, Top Customers,
    Registration Trend chart.
  - **Payments** — Paid/Pending/Failed/Refunded counts, breakdown by payment
    method (GCash, Maya, COD, Card).
  - **Shipping/Fulfillment** — Orders to Pack, Ready to Ship, In Transit,
    Delivered, Failed Deliveries.
  - **Alerts banner** sa taas — automatic lalabas kapag may out-of-stock,
    low-stock, orders needing processing, refund requests, o bagong orders
    ngayong araw. Wala lang ipapakita kung walang alerts.
- **Pie chart** ngayon ay may 10 magkakaibang kulay para sa bawat produkto
  (dati paulit-ulit lang ang 6 na kulay).
- **Line chart** na-ayos na — awtomatiko na itong pinupunan ng "0" ang mga araw
  na walang benta, kaya laging makikita nang malinaw ang pag-akyat/pagbaba ng
  sales sa buong linggo/buwan/taon, hindi lang yung mga araw na may order.
- Sales by Category, Sales by Payment Method, Sales by Location, at Order
  Status Distribution charts — bago, nasa ibaba ng Shipping section.

## Admin — Orders
- May **search bar** na (order number o pangalan ng customer).
- May **"View Invoice"** button na sa bawat order — pwedeng i-print.
- Pag mag-mamark ng order bilang **"Completed"**, may lalabas munang
  confirmation ("Are you sure this order is completed?") bago ito ma-apply.
- Pagka-successful ng status update, **automatic nang magsasara ang modal**.
- Order na naka-**Completed** o **Cancelled** na ay hindi na pwedeng
  baguhin pa ang status (naka-lock na sa backend at frontend).

## Admin — Products
- May **search bar** na (pangalan o category).
- Kapag umabot sa **0 ang stock**, awtomatiko nang magiging **"Unavailable"**
  ang produkto — hindi na kailangang i-toggle pa nang manual. Hindi na rin
  pwedeng i-Available pabalik habang 0 pa ang stock (kailangan mag-restock
  muna).

## Admin — General Look
- **Sidebar** ay sagad na ngayon sa buong taas ng screen (dati kalahati lang
  minsan).
- Pinalitan lahat ng generic/emoji icons (📊🧺📦👥💬🚪) ng mas malinaw na
  FontAwesome icons.
- Lahat ng **buttons** ay oval/pill-shaped na ngayon (Save, Add, Edit,
  status buttons, filter chips, etc).
- Lahat ng **search bars** (admin at client) ay oval na rin.
- Pinantay ang alignment at spacing sa lahat ng admin pages.

## Client Side (After Login)
- Pinalitan lahat ng generic emoji icons (🔔🛍️🚚) ng FontAwesome icons sa
  header.
- **Search bar** ay oval na.
- **Header** — inayos ang layout (logo sa kaliwa, icons sa kanan) para
  kapareho ng pagkaka-pwesto sa Landing Page, gamit ang parehong
  container/spacing.
- May bagong **Chatbot widget** sa ibabang-kanang bahagi ng screen — automatic
  itong sumasagot base sa tanong tungkol sa shipping, payment, cancellation,
  returns, at contact info. Walang kailangang i-setup — nakalagay na agad.
- **Add to Cart modal** — mas maliit na ngayon (dati masyadong malaki), at
  oval na ang mga buttons.
- **Lahat ng buttons** sa buong client side ay oval na.
- **Cart** — mas malinis na "card" design bawat item, oval ang quantity
  stepper, may "Continue Shopping" button sa taas.
- May **"Back to Cart"** button na sa Checkout page.
- **Checkout** — nasa magkakahiwalay na "cards" na rin ang bawat section
  (address, contact, payment, summary) — malinis at organisado.
- Pagkatapos mag-order, may lalabas nang **"View Invoice"** option kasama ng
  "View Order" sa success message.
- **Delivery Address** — na-verify na naka-save talaga ito sa account (hindi
  nawawala), kasi naka-store na agad sa database sa oras na i-save mo ito.
- **Order History** — nagpapakita na lang ngayon ng mga **Completed** orders,
  kasama ang "View Invoice" button sa bawat isa. Yung mga order na naka-
  Preparing/To Ship/To Receive ay nasa "Track Your Order" section, at yung
  Cancelled ay may sariling maliit na section sa ilalim.
- **Track Your Order** — bawat order na aktibo (hindi pa Completed) ay may
  sariling card na may larawan ng produkto — kung marami kang aktibong order,
  makikita mo silang lahat, tig-isang card, tig-isang tracker.
- May **"Cancel Order"** button na sa Order Details — pero available lang
  ito habang "Preparing" pa ang order (bago pa ma-ship). Kapag na-ship na,
  awtomatikong nawawala ang option na ito.
- Parehong **numbering** (001, 002, 003, ...) na ang makikita sa admin at
  client side para sa parehong order — sequential talaga, hindi na basta-
  basta.
- **Sign Up** — pagkatapos mag-sign up, dadalhin ka na sa **Login page**
  (hindi na direkta sa shop). Kailangan mo munang mag-log in gamit ang bagong
  account.

## Ilalim ng Kalan (Technical Notes)
- Bagong `Counter` model sa backend para sa sequential order numbers.
- Bagong `paymentStatus` field sa Order (Pending/Paid/Failed/Refunded) — COD
  ay "Pending" hanggang ma-deliver, habang online payments ay "Paid" agad
  (simulate lang — wala pang tunay na payment gateway integration).
- Bagong `/api/admin/overview` endpoint na nagbibigay ng lahat ng datos para
  sa bagong dashboard.
- Bagong `/api/orders/:id/cancel` endpoint para sa pag-cancel ng order.

## Alam kong Susunod Pang Gagawin (Future Improvements)
- Tunay na online payment gateway integration (GCash/Maya/Card) — sa ngayon
  ay "simulated" lang ang pagiging "Paid" ng mga online payment.
- Real-time courier tracking integration (kung meron kang partner courier
  API sa hinaharap).
- Push notifications (sa ngayon ay in-app notification bell lang).

---

# Mga Update sa Nappa E-Commerce Site (Round 2)

Ito yung listahan ng mga ginawang pagbabago base sa mga hiling mo. Same pa rin ang
setup — tignan ang **SETUP-GUIDE.md** kung paano patakbuhin.

## 1. Color Palette 🎨
- Tinanggal na ang lahat ng berde/olive green. Ang bagong theme ay:
  - **Mocha** (`oliveDark` / `olive` sa code) — mga button, accents, active states
  - **Cream Beige** (`cream` / `tan`) — soft backgrounds, borders
  - **Vanilla Cream** (`paper`) — pangunahing background ng buong site
- Nasa `frontend/tailwind.config.js` at `frontend/src/index.css` ang mga exact color codes,
  kaya isang lugar lang babaguhin kung gusto mo pang i-adjust ang shade.

## 2. Landing Page
- Dinagdagan ng **scroll animations** (fade/slide-in habang nag-sscroll) gamit ang bagong
  `<Reveal>` component — makikita sa About, Products, at Contact sections.
- **Buo na** ang bottom part ng page (Contact + Footer) — na-restructure para hindi na
  naka-clip o naka-cut ang laman sa ibaba.
- Na-redesign ang **"Get in Touch"** section — mas may personalidad na (dark mocha background
  na may floating blobs, tunay na FontAwesome icons imbes na generic layout, hiwalay na info
  card at message form) imbes na yung typical/generic AI look.
- Naka full-bleed na rin ang header (logo sa dulong kaliwa, buttons sa dulong kanan).

## 3. Login & Register
- Kinopya ang **split-screen design** ng gg-fixed (kaliwa: branding + gradient + feature list
  na may floating blobs; kanan: form) pero gamit na ang mocha/cream/vanilla palette.
- May mga animation na: fade-in-up sa text, fade-in-left sa feature list, gradient shift sa
  background, show/hide password toggle.

## 4. Client Home (after login)
- Full-bleed header — logo+pangalan sa **dulong kaliwa**, notification/cart/order/profile icons
  sa **dulong kanan**.
- **Pinalaki** ang hero banner section.
- Na-resize ang **"Shop by Category"** — naging maayos na scrollable row ng category chips
  (hindi na sobrang laki o sobrang liit).
- Lahat ng client pages (Cart, Orders, Addresses, Product Detail, Checkout, atbp.) ay may
  parehong behavior na ng Landing Page — kailangan mo talagang mag-scroll ng sagad bago makita
  ang footer, hindi na basta "stuck" sa ibaba ng short pages.

## 5. Track Your Order
- May bagong **"View Order History"** button na nagpapakita ng buong listahan ng lahat mong
  orders (dati nakatago/scattered lang sa isang listahan).
- May **search bar** (by order number o item name) at status filter chips (Preparing, To Ship,
  To Receive, Completed).
- Yung pinaka-current/active order mo ay naka-highlight sa itaas bilang "Track Your Order".

## 6. Mga Bagong Modal (Success/Failed)
- **Add to Cart** — modal na may check/x icon, hindi na lang toast.
- **Place Order** (checkout) — modal pagkatapos mag-order, may "View Order" button kung
  successful.
- **Add/Edit Address** — modal pagka-save ng address.
- Lahat ito ay gumagamit ng bagong reusable `ResultModalContext`
  (`frontend/src/context/ResultModalContext.tsx`) — pwede mo pa itong gamitin sa ibang parte
  ng site sa hinaharap.

## 7. Admin — Orders
- May **search bar** na (order number o pangalan/email ng customer) dagdag sa existing status
  filter.
- Pag nag-update ng shipping status (Preparing → To Ship → To Receive → Completed), may
  **success/failed modal** na ngayon imbes na toast lang.

## 8. Admin — Sales Report
- May **Weekly / Monthly / Yearly** toggle.
  - Sa Monthly, may dropdown ng specific month-year (hal. "September 2026", "October 2026",
    pababa ng 12 buwan).
  - Sa Yearly, may dropdown ng taon (last 5 years).
- May bagong **pie chart** (best sellers by revenue share) katabi ng line graph, may maliit na
  legend na may maliliit na larawan (24px) ng bawat produkto — hindi na sobrang laki gaya ng dati.
- Pinaliit din ang mga larawan sa best-seller table.

## 9. Admin — Manage Users
- May **search bar** (pangalan o email) at status filter (Active / Disabled).
- May **Enable/Disable** button per user — kapag na-disable ng admin, hindi na makaka-login
  yung user (naka-enforce na rin sa backend/login at sa bawat protected request).
- May **Edit** button na nagbubukas ng modal kung saan pwedeng baguhin ang first name, last
  name, email, phone number, at gender.
- May **Reset Password** button — pwedeng magset ng bagong password para sa user na
  nakalimutan ang password nila (hindi na kailangan malaman ang lumang password).
- Lahat ng actions na ito ay may success/failed modal.

## 10. Admin — Feedback (Bago!)
- Bagong page/tab sa sidebar: **Feedback** — makikita dito lahat ng reviews/comments ng
  customers sa lahat ng products, kasama ang larawan ng produkto, rating, at pangalan ng
  gumawa ng comment.
- May **search bar** (product, customer, o laman ng comment) at rating filter.
- May **Delete** button (may confirmation modal muna) para matanggal yung mga sensitive o
  hindi angkop na comment — may success/failed modal din pagkatapos i-delete.

## Mga bagong/binagong file (kung gusto mong tignan mismo)
**Backend**
- `backend/src/controllers/adminController.ts` — dinagdagan ng user status/edit/reset-password
  endpoints, at pinahusay ang sales analytics (week/month/year + specific month/year filter).
- `backend/src/controllers/reviewController.ts` — dinagdagan ng admin get-all/delete review.
- `backend/src/routes/adminRoutes.ts` — dinagdagan ng routes para sa mga bago sa taas.

**Frontend**
- `frontend/tailwind.config.js`, `frontend/src/index.css` — bagong color palette + animations.
- `frontend/src/context/ResultModalContext.tsx` — bago, global success/fail modal.
- `frontend/src/components/Reveal.tsx`, `frontend/src/hooks/useReveal.ts` — bago, scroll animations.
- `frontend/src/pages/Login.tsx`, `Register.tsx` — bagong split-screen design.
- `frontend/src/pages/Landing.tsx` — redesign + animations.
- `frontend/src/components/Header.tsx`, `ClientLayout.tsx` — full-bleed layout, footer fix.
- `frontend/src/pages/client/ClientHome.tsx` — mas malaking hero, category section.
- `frontend/src/pages/client/Orders.tsx` — order history + search/filter.
- `frontend/src/pages/client/Addresses.tsx`, `Checkout.tsx` — result modals.
- `frontend/src/pages/admin/AdminOrders.tsx` — search + status modal.
- `frontend/src/pages/admin/AdminDashboard.tsx` — period picker + pie chart.
- `frontend/src/pages/admin/AdminCustomers.tsx` — enable/disable, edit, reset password.
- `frontend/src/pages/admin/AdminFeedback.tsx` — bago, feedback moderation page.

## Paalala
- Na-verify na na walang TypeScript errors ang backend at frontend (`tsc -b` / `tsc --noEmit`
  ay clean) bago pinackage ang zip.
- Hindi kasama ang `node_modules` sa zip (malaki kasi) — kailangan mo pa ring mag-`npm install`
  sa parehong `backend` at `frontend` folder, tignan lang ang SETUP-GUIDE.md.
