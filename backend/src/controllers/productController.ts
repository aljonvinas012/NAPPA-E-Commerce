import { Request, Response } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import Notification from '../models/Notification';
import { generateSku } from '../utils/sku';

// Public: list products with optional search / category filter
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    const filter: any = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$text = { $search: String(search) };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Could not load products.' });
  }
};

// Every distinct, currently-used category — the client shop (category
// chips on Products/ClientHome) builds its list from this instead of a
// hardcoded array, so a brand-new category an admin adds shows up here
// automatically without any code changes.
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: 'Could not load categories.' });
  }
};

// Notifies every admin whenever a product is genuinely low on stock (1-5
// left) or completely out of stock. Instead of only firing the instant
// stock "crosses" the threshold (which is easy to miss — e.g. a product
// added already low, or stale before/after reads), this checks the
// product's actual current stock every time it changes and keeps a single
// open (unread) alert per product up to date, so admins are guaranteed to
// see it in the bell for as long as the product stays low/out — without
// spamming a brand-new notification on every single unit sold.
const LOW_STOCK_THRESHOLD = 5;
export const checkLowStockAndNotify = async (productId: any, productName: string, newStock: number) => {
  const isOut = newStock <= 0;
  const isLow = !isOut && newStock <= LOW_STOCK_THRESHOLD;
  if (!isLow && !isOut) return;

  const admins = await User.find({ role: 'admin' }).select('_id');
  if (admins.length === 0) return;

  const title = isOut ? 'Product out of stock' : 'Low stock warning';
  const message = isOut
    ? `"${productName}" just ran out of stock.`
    : `"${productName}" is running low — only ${newStock} left.`;

  // If there's already an open (unread) low-stock alert for this exact
  // product, just refresh its text instead of creating a duplicate.
  const { matchedCount } = await Notification.updateMany(
    { type: 'admin_low_stock', relatedProduct: productId, isRead: false },
    { title, message }
  );
  if (matchedCount > 0) return;

  await Notification.insertMany(
    admins.map((a) => ({ user: a._id, type: 'admin_low_stock', relatedProduct: productId, title, message }))
  );
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Could not load product.' });
  }
};

// Admin only
export const getAllProductsAdmin = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Could not load products.' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    const stockValue = Number(stock) || 0;
    const sku = await generateSku(category);
    const product = await Product.create({
      name,
      description,
      price,
      category,
      sku,
      stock: stockValue,
      images: images || [],
      // A brand-new product with zero stock has nothing to sell yet, so it
      // starts hidden from the shop automatically.
      isActive: stockValue > 0,
    });

    // A brand-new product can be added already low or out of stock (e.g.
    // admin only has 3 left to list) — treat that the same as stock
    // dropping into that range on an existing product, so admins still
    // get alerted instead of the item silently sitting there unnoticed.
    await checkLowStockAndNotify(product._id, product.name, stockValue);

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Could not create product.' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const update = { ...req.body };
    // SKU is system-generated and never edited by hand.
    delete update.sku;

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found.' });

    // A product automatically becomes "Unavailable" the moment its stock
    // hits zero, so admins can't accidentally leave a sold-out item visible.
    if (update.stock !== undefined && Number(update.stock) <= 0) {
      update.isActive = false;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    if (update.stock !== undefined) {
      await checkLowStockAndNotify(product._id, product.name, Number(update.stock));
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Could not update product.' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete product.' });
  }
};

export const uploadProductImage = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  // Matches the `products/` upload folder in middleware/upload.ts.
  res.json({ path: `/images/products/${req.file.filename}` });
};
