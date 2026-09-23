# Nappa Food & Crafts Pasalubong Center — E-Commerce Website

A full-stack e-commerce site for Nappa Food & Crafts Pasalubong Center (Camalig, Albay),
built with React + Vite + TypeScript on the frontend and Express + TypeScript + MongoDB on the backend.

See **SETUP-GUIDE.md** for full step-by-step installation instructions.

## Quick Start

```bash
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
