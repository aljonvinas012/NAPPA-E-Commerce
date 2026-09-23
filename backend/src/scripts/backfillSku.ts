// One-time helper: assigns a SKU to any existing product that doesn't
// have one yet (i.e. products created before the SKU feature existed).
// New products get a SKU automatically on creation — you don't need to
// run this again after using it once.
// Usage: npm run backfill:sku (inside backend/)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product';
import { generateSku } from '../utils/sku';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const products = await Product.find({ $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }] }).sort({ createdAt: 1 });
  for (const p of products) {
    p.sku = await generateSku(p.category);
    await p.save();
    console.log(`  ${p.sku}  —  ${p.name}`);
  }

  console.log(`✅ Assigned SKUs to ${products.length} product(s) that didn't have one.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
