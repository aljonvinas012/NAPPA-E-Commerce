# Paano Patakbuhin ang Nappa E-Commerce Website (Step by Step)

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
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nappa-ecommerce
JWT_SECRET=nappa_super_secret_key_2026_change_this_later
```

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
