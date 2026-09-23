import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const existing = await User.findOne({ email: 'admin@nappa.com' });
  if (existing) {
    console.log('ℹ️  Admin account already exists (admin@nappa.com). Skipping.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await User.create({
    firstName: 'Michelle',
    lastName: 'Napa',
    email: 'admin@nappa.com',
    phone: '09177708925',
    gender: 'Female',
    passwordHash,
    role: 'admin',
  });

  console.log('✅ Admin account created:');
  console.log('   email: admin@nappa.com');
  console.log('   password: Admin123!');
  console.log('   ⚠️  Please log in and change this password right away.');
  console.log('   🔐 On first login you\'ll be asked to scan a QR code into an authenticator app (Google Authenticator / Authy / Microsoft Authenticator) to finish setting up 2FA.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
