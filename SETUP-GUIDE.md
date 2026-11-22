# Paano Patakbuhin ang Nappa E-Commerce Website (Step by Step)

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
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nappa-ecommerce
JWT_SECRET=nappa_super_secret_key_2026_change_this_later
```
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

## 8. Buksan sa PHONE (iPhone o Android)

Gumagana ito sa kahit anong phone na naka-connect sa **parehong WiFi** ng computer mo.

1. **Naka-run dapat ang dalawa** sa computer: backend (`npm run dev`) at frontend (`npm run dev`).
   Dapat naka-on din ang MongoDB. Ang computer ang nagsisilbing server, kaya kapag naka-off ito, hindi gagana ang site sa phone.
2. Alamin ang IP address ng computer:
   - Pag-start ng **backend**, may lalabas na `📱 ... http://192.168.x.x:5173` — iyon na ang address.
   - O sa PowerShell: `ipconfig` → hanapin ang **IPv4 Address** ng WiFi (hal. `192.168.1.5`).
   - Ang frontend ay nagpi-print din ng `Network: http://192.168.x.x:5173`.
3. Sa phone, siguraduhing **nasa parehong WiFi** (hindi mobile data), tapos buksan sa browser (Chrome / Safari):
   `http://192.168.x.x:5173` (palitan ng IP mo).
4. Unang beses: may lalabas na **Windows Firewall** prompt sa computer para sa Node.js →
   piliin **Allow** (lagyan ng check ang *Private networks*). Kung hindi pa rin bumubukas, buksan ang
   *Windows Security ▸ Firewall ▸ Allow an app* at i-allow ang **Node.js JavaScript Runtime**
   sa Private network. Kung "Public" ang tawag ng Windows sa WiFi mo, palitan sa *Private*.
5. **Gawing parang app (opsyonal):**
   - **Android (Chrome):** menu ⋮ ▸ *Add to Home screen* / *Install app*.
   - **iPhone (Safari):** Share ▸ *Add to Home Screen*.

Paano ito nag-a-adjust: awtomatikong sumusunod ang layout sa laki ng screen (phone, tablet, laptop).
Ang mga table ay nagiging cards sa phone, at may sariling menu ang admin sa maliit na screen.

### Kung hindi bumubukas sa phone
| Problema | Solusyon |
|---|---|
| Hindi mag-load ang page | Parehong WiFi ba? Naka-allow ba ang Node.js sa Firewall (Private)? |
| Lumalabas ang page pero walang products / hindi maka-login | Naka-run ba ang **backend**? Subukan sa phone: `http://192.168.x.x:5000` — dapat may lumabas na "API is running" |
| Dating gumagana, ngayon hindi na | Nagbabago minsan ang IP ng computer (DHCP). Tingnan ulit ang IP |
| Guest WiFi / school WiFi | Madalas hinaharang ang device-to-device. Gamitin ang home WiFi o i-on ang *Mobile Hotspot* ng computer at doon mag-connect ang phone |
| Gusto mong buksan kahit nasa labas ng bahay | Gumamit ng tunnel (hal. Cloudflare Tunnel / ngrok) o i-deploy ang site. Sa frontend, gumawa ng `frontend/.env` at ilagay ang `VITE_API_URL=https://<api-address>/api` (tingnan ang `.env.example`) |

> Ang database (MongoDB) ay nasa computer mo pa rin — walang data na nasa phone.

## 9. Mga karaniwang problema
| Problema | Solusyon |
|---|---|
| `Could not find a declaration file for module 'jsonwebtoken'` | `npm install` ulit sa `backend` (kasama na ang `@types/jsonwebtoken`) |
| Hindi lumalabas ang icons offline | `npm install` ulit sa `frontend` habang may internet |
| `port already in use` | Isara ang ibang app sa 5000/5173 o palitan ang `PORT` sa `.env` |
| Hindi maka-connect sa MongoDB | Buksan ang Compass at i-check ang `mongodb://localhost:27017` |
| Walang products | `npm run seed:products` sa `backend` |
| Lumang products na walang SKU | `npm run backfill:sku` sa `backend` |
| Hindi tumutugtog ang hero video | Siguraduhing nandoon ang `frontend/public/videos/hero.mp4` |

## 10. Production build (para sa reference)
```powershell
cd frontend ; npm run build
cd ../backend ; npm run build
```

## Paalala
- Palitan ang `JWT_SECRET` at ang admin password bago i-deploy.
- Local MongoDB muna; kapag cloud na, `MONGODB_URI` lang sa `.env` ang babaguhin.
