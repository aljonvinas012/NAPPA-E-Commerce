# Nappa Food & Crafts Pasalubong Center — E-Commerce Website

<<<<<<< HEAD
A full-stack e-commerce site for Nappa Food & Crafts Pasalubong Center (Camalig, Albay),
built with React + Vite + TypeScript on the frontend and Express + TypeScript + MongoDB on the backend.

See **SETUP-GUIDE.md** for full step-by-step installation instructions.
=======
Full-stack e-commerce site para sa **Nappa Food & Crafts Pasalubong Center**
(Sumlang, Camalig, Albay).

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (+ Framer Motion, Recharts)
- **Backend:** Node.js + Express + TypeScript + Mongoose
- **Database:** MongoDB (local, gamit ang MongoDB Compass)

> Step-by-step na installation: tingnan ang **SETUP-GUIDE.md**.
> Listahan ng mga pagbabago bawat round: tingnan ang **UPDATE-NOTES.md**.
>>>>>>> 3078575 (Improve landing page and responsive design)

## Quick Start

```bash
<<<<<<< HEAD
# 1. Backend
cd backend
npm install
npm run seed:admin      # creates admin@nappa.com / Admin123!
npm run seed:products   # loads the sample Nappa product catalog
npm run dev              # http://localhost:5000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Make sure MongoDB (local, via MongoDB Compass / MongoDB Community Server) is running on
`mongodb://localhost:27017` before starting the backend.

## Folder structure

```
nappa-ecommerce/
├── backend/     Express + TypeScript API (auth, products, cart, orders, admin)
└── frontend/    React + Vite + TypeScript storefront + admin dashboard
```
=======
# 1. Backend  (Terminal 1)
cd backend
npm install
npm run seed:admin       # gumagawa ng admin@nappa.com / Admin123!
npm run seed:products    # nilo-load ang sample Nappa products (may SKU)
npm run dev              # http://localhost:5000

# 2. Frontend (Terminal 2)
cd frontend
npm install              # i-install din ang icons + fonts (offline-ready)
npm run dev              # http://localhost:5173
```

Siguraduhing tumatakbo ang MongoDB sa `mongodb://localhost:27017` bago i-start ang backend.
(Hindi kailangan ng `mongosh` — sapat na ang MongoDB Compass.)

## Mga Feature

**Customer**
- Landing page na may intro animation (nahuhulog na bilog na logo → lalawak na bilog → lalabas ang
  background video → saka lalabas ang header), scroll animations, About / Products / Contact
- Sign up / Login, product search at category filter, cart (max 99, naka-check ang stock sa backend)
- Checkout na may address at contact validation, payment method selection, success/failed modals
- Order tracking (Preparing → To Ship → To Receive → Completed), Order History na may search at filter,
  rating at review pagkatapos ma-complete ang order, notifications, profile / address (max 3) / password

**Admin** (`admin@nappa.com`, may Authenticator App / MFA)
- Dashboard: sales line graph (Day/Week/Month/Year), pie chart ng best sellers, monthly sales report
- Products: add/edit/delete, stock, price, category, image upload, auto SKU (`NAPPA-XX-001`)
- Orders: search at filter, update status (may success/failed modal), invoice, makikita lahat ng items
  kapag 2 o higit pa ang laman ng order
- Customers (Manage Users): makikita agad ang User ID, phone, gender at address ng bawat user;
  Edit, Reset Password, Enable/Disable account (hindi makaka-login ang disabled)
- Feedback: tingnan at i-delete ang sensitive na comments (nag-a-update ang rating ng product)

**Responsive at Offline-ready**
- Gumagana sa desktop, tablet, at phone — kahit paliitin ang browser window, nag-a-adjust ang layout
  (ang mga table ay nagiging cards sa maliit na screen) sa client at admin pages.
- Ang icons (Font Awesome) at fonts (Manrope, Fraunces) ay naka-bundle na sa project via npm,
  kaya lumalabas pa rin kahit walang internet. *(Kailangan lang ng internet sa unang `npm install`.)*

## Folder Structure

```
nappa-ecommerce/
├── backend/                 Express + TypeScript API
│   └── src/
│       ├── controllers/     auth, products, cart, orders, reviews, notifications, admin
│       ├── models/          User, Product, Cart, Order, Review, Notification, Counter
│       ├── routes/          REST endpoints (/api/...)
│       ├── middleware/      JWT auth, adminOnly, image upload
│       ├── scripts/         seedAdmin, seedProducts, backfillSku, resetAdminMfa
│       └── server.ts
├── frontend/                React + Vite storefront + admin dashboard
│   ├── public/              logo, product images, videos/hero.mp4
│   └── src/
│       ├── components/      Header, HeroIntro, ProductCard, Modal, OrderItemsPreview, ...
│       ├── context/         Auth, Cart, Toast, ResultModal
│       ├── pages/           Landing, Login, Register, client/*, admin/*
│       └── services/api.ts  axios instance (http://localhost:5000/api)
├── README.md
├── SETUP-GUIDE.md
└── UPDATE-NOTES.md
```

## Useful Backend Commands

| Command | Gamit |
|---|---|
| `npm run dev` | Patakbuhin ang API (auto-restart) |
| `npm run seed:admin` | Gumawa ng admin account |
| `npm run seed:products` | I-reset at i-load ang sample products |
| `npm run backfill:sku` | Bigyan ng SKU ang lumang products na wala pa |
| `npm run reset:admin-mfa -- admin@nappa.com` | I-reset ang MFA kapag nawala ang Authenticator |
| `npm run build` | Production build ng backend |

## Mahalaga Bago I-deploy

- Palitan ang `JWT_SECRET` sa `backend/.env` at ang default admin password.
- Ang online payments (GCash, Maya, Card) ay wala pang totoong payment gateway.
>>>>>>> 3078575 (Improve landing page and responsive design)
