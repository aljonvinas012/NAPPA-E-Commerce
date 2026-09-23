import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Counter from '../models/Counter';
import { generateSku } from '../utils/sku';

dotenv.config();

const products = [
  // Pasalubong Foods
  { name: 'Albay Pilinut Salted Pili (Spicy)', description: 'Crunchy Bicolano pili nuts, salted and given a spicy kick. A best-selling Albay pasalubong, 80g resealable pack.', price: 180, category: 'Pasalubong Foods', images: ['/images/products/pili-salted-spicy.jpg'], stock: 40 },
  { name: 'Albay Pilinut Crispy Pili (Sugar Free)', description: 'Sugar-free crispy pili nuts for a lighter, guilt-free Bicolano snack. Net weight 80g (2.822 oz).', price: 190, category: 'Pasalubong Foods', images: ['/images/products/pili-crispy-sugarfree.jpg'], stock: 35 },
  { name: 'Albay Pilinut Salted Pili', description: 'The classic salted pili nut, roasted until golden and lightly salted. A staple Bicol pasalubong treat.', price: 170, category: 'Pasalubong Foods', images: ['/images/products/pili-salted.jpg'], stock: 45 },
  { name: 'Albay Pilinut Pili Butternuts', description: 'Sweet, caramelized pili nuts with a soft buttery finish. Perfect with coffee or as a stand-alone treat.', price: 200, category: 'Pasalubong Foods', images: ['/images/products/pili-butternuts.jpg'], stock: 30 },
  { name: 'Albay Pilinut Roasted Pili', description: 'Whole roasted pili nuts, naturally rich and buttery. No added sugar or spice — just pure Bicol pili.', price: 175, category: 'Pasalubong Foods', images: ['/images/products/pili-roasted.jpg'], stock: 38 },
  // Local Foods
  { name: "Bicol's Best Bicol Express (Lechon Kawali)", description: 'Traditionally made Bicol Express with crispy lechon kawali bits simmered in coconut milk and chili. Ready to eat, bottled fresh.', price: 220, category: 'Local Foods', images: ['/images/products/bicol-express-lechon-kawali.jpg'], stock: 25 },
  { name: "Ken Toyo's Bicol Express (Pork)", description: 'A rich, home-style Bicol Express made with pork simmered in coconut cream and Bicol chilies. Refrigerate once opened.', price: 210, category: 'Local Foods', images: ['/images/products/bicol-express-pork.jpg'], stock: 28 },
  { name: "Jeck's Bicol Express (Beef)", description: 'A hearty beef version of the classic Bicol Express, cooked low and slow in coconut milk and native chilies.', price: 230, category: 'Local Foods', images: ['/images/products/bicol-express-beef.jpg'], stock: 22 },
  // Handmade Bags
  { name: 'Handwoven Abaca Tote Bag', description: 'A sturdy, handwoven abaca tote bag crafted by local Bicolano artisans. Lightweight yet durable, perfect for everyday use.', price: 850, category: 'Handmade Bags', images: ['/images/products/bag-1.jpg'], stock: 15 },
  { name: 'Abaca Sling Bag', description: 'A compact abaca sling bag with a natural fiber finish, hand-loomed in Camalig, Albay.', price: 650, category: 'Handmade Bags', images: ['/images/products/bag-2.jpg'], stock: 18 },
  { name: 'Abaca Market Basket Bag', description: 'A roomy market-style bag woven from abaca fiber, ideal for grocery runs or beach trips.', price: 900, category: 'Handmade Bags', images: ['/images/products/bag-3.jpg'], stock: 12 },
  { name: 'Woven Abaca Clutch', description: 'An elegant handwoven clutch made from fine abaca strands, great for casual or semi-formal occasions.', price: 550, category: 'Handmade Bags', images: ['/images/products/bag-4.jpg'], stock: 20 },
  { name: 'Abaca Shoulder Bag', description: 'A structured shoulder bag with abaca weave and reinforced handles, built for daily carry.', price: 780, category: 'Handmade Bags', images: ['/images/products/bag-5.jpg'], stock: 14 },
  { name: 'Natural Abaca Handbag', description: 'A classic natural-toned abaca handbag, finished by hand and ready for pasalubong gifting.', price: 700, category: 'Handmade Bags', images: ['/images/products/bag-6.jpg'], stock: 16 },
  // Woven Baskets
  { name: 'Round Abaca Storage Basket (Small)', description: 'A small round storage basket, tightly woven from abaca fiber. Great for organizing small home items.', price: 350, category: 'Woven Baskets', images: ['/images/products/basket-1.jpg'], stock: 25 },
  { name: 'Round Abaca Storage Basket (Large)', description: 'A large woven basket for laundry, toys, or plants — handcrafted by Bicolano weavers.', price: 550, category: 'Woven Baskets', images: ['/images/products/basket-2.jpg'], stock: 18 },
  { name: 'Woven Fruit Basket', description: 'A shallow, wide-mouthed basket perfect for fruits or as a dining table centerpiece.', price: 300, category: 'Woven Baskets', images: ['/images/products/basket-3.jpg'], stock: 22 },
  { name: 'Handwoven Picnic Basket', description: 'A durable picnic basket with handle, woven from natural abaca fibers.', price: 620, category: 'Woven Baskets', images: ['/images/products/basket-4.jpg'], stock: 10 },
  { name: 'Decorative Wall Basket', description: 'A flat woven basket designed for wall decor, adding texture and warmth to any room.', price: 280, category: 'Woven Baskets', images: ['/images/products/basket-5.jpg'], stock: 24 },
  { name: 'Multi-Purpose Utility Basket', description: 'A versatile mid-size basket, useful for storage, gifting, or home organization.', price: 400, category: 'Woven Baskets', images: ['/images/products/basket-6.jpg'], stock: 20 },
  // Abaca Rugs
  { name: 'Abaca Area Rug (Natural Weave)', description: 'A durable, natural-fiber abaca area rug that brings texture and warmth to any floor.', price: 2200, category: 'Abaca Rugs', images: ['/images/products/rug-1.jpg'], stock: 8 },
  { name: 'Abaca Round Rug', description: 'A round abaca rug, hand-loomed with a tight weave for durability and a soft natural texture.', price: 1800, category: 'Abaca Rugs', images: ['/images/products/rug-2.jpg'], stock: 6 },
  { name: 'Abaca Runner Rug', description: 'A long runner rug woven from abaca, perfect for hallways and entryways.', price: 1500, category: 'Abaca Rugs', images: ['/images/products/rug-3.jpg'], stock: 7 },
  // Furniture
  { name: 'Abaca Woven Accent Chair', description: 'A handcrafted accent chair with an abaca-woven seat and backrest over a solid wood frame.', price: 4500, category: 'Furniture', images: ['/images/products/furniture-1.jpg'], stock: 5 },
  { name: 'Rattan-Abaca Side Table', description: 'A natural-finish side table combining rattan framing with abaca weave detailing.', price: 3200, category: 'Furniture', images: ['/images/products/furniture-2.jpg'], stock: 6 },
  { name: 'Woven Bench with Wooden Frame', description: 'A sturdy bench with a solid wood frame and handwoven abaca seating surface.', price: 5200, category: 'Furniture', images: ['/images/products/furniture-3.jpg'], stock: 4 },
  { name: 'Handcrafted Wooden Stool', description: 'A locally made wooden stool with a woven abaca top, ideal as extra seating or a plant stand.', price: 1200, category: 'Furniture', images: ['/images/products/furniture-4.jpg'], stock: 10 },
  // Woven Lampshades
  { name: 'Abaca Pendant Lampshade (Round)', description: 'A round pendant lampshade handwoven from abaca fiber, casting warm, textured light.', price: 1350, category: 'Woven Lampshades', images: ['/images/products/lampshade-1.jpg'], stock: 12 },
  { name: 'Abaca Table Lampshade', description: 'A compact table lampshade with natural abaca weave, perfect for bedside or reading nooks.', price: 950, category: 'Woven Lampshades', images: ['/images/products/lampshade-2.jpg'], stock: 14 },
  { name: 'Abaca Drum Lampshade', description: 'A drum-shaped lampshade woven from fine abaca strands, blending well with modern and rustic interiors.', price: 1100, category: 'Woven Lampshades', images: ['/images/products/lampshade-3.jpg'], stock: 10 },
  { name: 'Cone Abaca Lampshade', description: 'A tapered cone-shaped abaca lampshade with a warm, natural glow when lit.', price: 1050, category: 'Woven Lampshades', images: ['/images/products/lampshade-4.jpg'], stock: 11 },
  { name: 'Large Abaca Floor Lampshade', description: 'An oversized abaca lampshade designed for floor lamps, a statement piece for any living space.', price: 1650, category: 'Woven Lampshades', images: ['/images/products/lampshade-5.jpg'], stock: 7 },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  await Product.deleteMany({});
  // Reset any leftover SKU counters so re-seeding always starts back at
  // -001 for each category instead of continuing from a previous run.
  await Counter.deleteMany({ name: { $regex: '^sku_' } });

  const withSkus = [];
  for (const p of products) {
    withSkus.push({ ...p, sku: await generateSku(p.category) });
  }
  await Product.insertMany(withSkus);

  console.log(`✅ Seeded ${products.length} products into the database.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
