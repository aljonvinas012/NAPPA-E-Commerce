import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { connectDB } from './config/database';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import pushRoutes from './routes/pushRoutes';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Product images (seeded + admin-uploaded) are served from the frontend's
// public/images folder so both dev and build modes can reach them at /images/<file>.
app.use('/images', express.static(path.join(process.cwd(), '../frontend/public/images')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Nappa Food & Crafts Pasalubong Center API is running.' });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const PORT = Number(process.env.PORT) || 5000;

// Listen on every network interface (not only this computer) so a phone on the
// same Wi-Fi can reach the API, and print the address to open on the phone.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Nappa API running on http://localhost:${PORT}`);
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => !!i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  if (lan.length) {
    console.log('📱 Para sa phone (same Wi-Fi), buksan sa browser ng phone:');
    lan.forEach((ip) => console.log(`   http://${ip}:5173`));
  }
});
