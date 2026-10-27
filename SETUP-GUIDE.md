# Paano Patakbuhin ang Nappa E-Commerce Website (Step by Step)

<<<<<<< HEAD
## Kailangan mong i-install muna
1. Node.js v20+ — https://nodejs.org
2. MongoDB Community Server (local database) — https://www.mongodb.com/try/download/community
3. MongoDB Compass (GUI, kadalasang kasama na sa installer) — https://www.mongodb.com/try/download/compass
4. VS Code o kahit anong code editor

## Hakbang 1 — I-extract ang zip
I-extract ang `nappa-ecommerce.zip` sa gusto mong folder, hal. Desktop.

## Hakbang 2 — Patakbuhin ang MongoDB
Siguraduhing tumatakbo ang MongoDB service mo (kadalasan awtomatiko na pagka-install).
I-verify sa terminal:
```
mongosh
```
Kung nag-connect nang walang error, gumagana na ang local MongoDB mo.

## Hakbang 3 — I-set up ang Backend
```bash
cd nappa-ecommerce/backend
npm install
```
Ang `.env` file ay nandiyan na, naka-set sa local MongoDB:
=======
## 1. Kailangan i-install muna
1. **Node.js v20 o mas bago** — https://nodejs.org (i-check: `node -v`)
2. **MongoDB Community Server** — https://www.mongodb.com/try/download/community
3. **MongoDB Compass** (GUI) — https://www.mongodb.com/try/download/compass
4. **VS Code** (o kahit anong code editor)

> Hindi kailangan ang `mongosh`. Kung nakaka-connect ang Compass sa
> `mongodb://localhost:27017`, tumatakbo na ang MongoDB mo.

## 2. I-extract ang zip
I-extract ang zip sa isang folder, hal. `C:\Users\<pangalan>\Downloads\nappa-ecommerce`.
Dapat may `backend`, `frontend`, at ang mga `.md` files sa loob.

## 3. Siguraduhing tumatakbo ang MongoDB
Buksan ang **MongoDB Compass** → i-connect sa `mongodb://localhost:27017`.
Kapag nag-connect, okay na. Ang database na gagamitin ng project ay `nappa-ecommerce`
(automatic na gagawa pagka-seed).

## 4. Backend (Terminal 1)
```powershell
cd nappa-ecommerce\backend
npm install
```
Nandiyan na ang `.env`:
>>>>>>> 3078575 (Improve landing page and responsive design)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nappa-ecommerce
JWT_SECRET=nappa_super_secret_key_2026_change_this_later
```
<<<<<<< HEAD

Pagkatapos i-install, gawin ang mga sumusunod para may laman ang database:
```bash
npm run seed:admin
npm run seed:products
```
Gagawa ito ng admin account:
- Email: `admin@nappa.com`
- Password: `Admin123!`

At ise-seed ang mga produkto gamit ang mga totoong pictures mo (pili nuts, Bicol Express, abaca bags, baskets, rugs, furniture, lampshades).

Pagkatapos, patakbuhin ang backend:
```bash
npm run dev
```
Dapat makita mo: `🚀 Nappa API running on http://localhost:5000`

## Hakbang 4 — I-set up ang Frontend (bagong terminal)
```bash
cd nappa-ecommerce/frontend
npm install
npm run dev
```
Buksan ang browser sa: **http://localhost:5173**

## Hakbang 5 — I-test ang site
1. Pumunta sa landing page, tignan ang Home/About/Products/Contact sections — may scroll
   animations na ngayon, at buo na ang "Get in Touch" section sa ibaba.
2. Mag-Sign Up ng bagong customer account (bagong split-screen design na ang Login/Register).
3. Mag-browse ng products, mag-add to cart (may success modal), mag-checkout (magdagdag muna
   ng address at contact number kapag hiningi — may modal din pagka-add ng address at
   pagka-order).
4. Pumunta sa "Track Your Order" — subukan ang search bar at "View Order History" button.
5. I-logout, tapos mag-login gamit ang `admin@nappa.com` / `Admin123!` — dapat diretso sa
   Admin Dashboard.
6. Sa Admin:
   - **Dashboard** — subukan ang Weekly/Monthly/Yearly toggle at yung month/year dropdown,
     tignan ang pie chart katabi ng line graph.
   - **Orders** — subukan ang search bar, i-update ang status ng isang order (may
     success/failed modal na).
   - **Customers** — subukan mag-search, mag-disable/enable ng account, mag-edit ng details,
     at mag-reset ng password.
   - **Feedback** (bagong tab) — tignan ang mga comment ng customers, subukan mag-delete ng
     isang comment.

## Mahalagang paalala
- **Palitan ang JWT_SECRET at admin password** bago mo i-deploy nang totoo sa publiko.
- Local pa lang ang MongoDB (via Compass) — kapag gusto mo na ng cloud/production database, doon lang babaguhin ang `MONGODB_URI` sa `.env`.
- Kung may error sa "port already in use", baguhin ang `PORT` sa `.env` o isara muna ang ibang programang gumagamit ng port 5000/5173.
- Basahin din ang **UPDATE-NOTES.md** para sa buong listahan ng mga bagong feature at pagbabago sa round na ito.
=======
I-seed ang database (isang beses lang):
```powershell
npm run seed:admin
npm run seed:products
```
Admin account na magagawa: **admin@nappa.com** / **Admin123!**

Patakbuhin ang backend:
```powershell
npm run dev
```
Dapat lumabas: `Nappa API running on http://localhost:5000` — **huwag isara ang terminal**.

## 5. Frontend (Terminal 2 — bago)
```powershell
cd nappa-ecommerce\frontend
npm install
npm run dev
```
Buksan ang **http://localhost:5173**.

> **Importante (offline icons):** ang icons at fonts ay dumadaan na sa `npm install`
> (`@fortawesome/fontawesome-free`, `@fontsource/manrope`, `@fontsource/fraunces`).
> Kaya kailangan ng internet **sa unang `npm install` lang** — pagkatapos nito, lalabas na ang
> icons kahit walang WiFi. Kung dati ka nang nag-install, i-run ulit ang `npm install` sa `frontend`.

## 6. Unang login ng Admin (MFA)
1. Pumunta sa `/login` → email `admin@nappa.com`, password `Admin123!`.
2. Sa unang login, may lalabas na **QR code**. I-scan gamit ang Google Authenticator / Authy /
   Microsoft Authenticator.
3. Ilagay ang 6-digit code. Sa susunod na login, code na lang ang hihingin.
4. Nawala ang Authenticator? Sa `backend`: `npm run reset:admin-mfa -- admin@nappa.com`.

## 7. Subukan ang site
**Landing page** — pag-refresh ng `/`: bababa ang bilog na logo → lalawak ang bilog →
lalabas ang video → saka lalabas ang header at ang text.

**Customer:** Sign Up → mag-browse → Add to Cart (may modal) → Profile ▸ mag-lagay ng phone →
Addresses ▸ mag-add ng address → Checkout → Place Order → Track Order.

**Admin:** Dashboard (charts) → Products → Orders (search, update status) →
Customers (kita agad ang ID/phone/gender/address; Edit / Reset Password / Disable) → Feedback.

## 8. Mga karaniwang problema
| Problema | Solusyon |
|---|---|
| `Could not find a declaration file for module 'jsonwebtoken'` | `npm install` ulit sa `backend` (kasama na ang `@types/jsonwebtoken`) |
| Hindi lumalabas ang icons offline | `npm install` ulit sa `frontend` habang may internet |
| `port already in use` | Isara ang ibang app sa 5000/5173 o palitan ang `PORT` sa `.env` |
| Hindi maka-connect sa MongoDB | Buksan ang Compass at i-check ang `mongodb://localhost:27017` |
| Walang products | `npm run seed:products` sa `backend` |
| Lumang products na walang SKU | `npm run backfill:sku` sa `backend` |
| Hindi tumutugtog ang hero video | Siguraduhing nandoon ang `frontend/public/videos/hero.mp4` |

## 9. Production build (para sa reference)
```powershell
cd frontend ; npm run build
cd ../backend ; npm run build
```

## Paalala
- Palitan ang `JWT_SECRET` at ang admin password bago i-deploy.
- Local MongoDB muna; kapag cloud na, `MONGODB_URI` lang sa `.env` ang babaguhin.
>>>>>>> 3078575 (Improve landing page and responsive design)
