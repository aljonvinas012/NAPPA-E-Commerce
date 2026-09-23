import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

// Run with: npx ts-node src/scripts/resetAdminMfa.ts admin@nappa.com
// Clears out a stuck/mismatched MFA secret so the next login shows a
// fresh QR code to scan.
const run = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node src/scripts/resetAdminMfa.ts <admin-email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI as string);

  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
  if (!user) {
    console.log(`ℹ️  No admin account found for ${email}.`);
    process.exit(0);
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();

  console.log(`✅ MFA reset for ${email}. Next login will show a brand-new QR code to scan.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
