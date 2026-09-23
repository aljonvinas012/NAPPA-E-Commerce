import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';

const MAX_CART_QUANTITY = 99;

export const getCart = async (req: Request, res: Response) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Could not load your cart.' });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found.' });
    if (product.stock < 1) return res.status(400).json({ message: 'This product is out of stock.' });

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = await Cart.create({ user: req.userId, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === productId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + qty;

    if (newQty > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} left in stock.` });
    }
    if (newQty > MAX_CART_QUANTITY) {
      return res.status(400).json({ message: `Cart quantity cannot exceed ${MAX_CART_QUANTITY}.` });
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ product: product._id, quantity: newQty } as any);
    }

    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Could not add item to cart.' });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart.' });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const qty = Number(quantity);
    if (qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1.' });
    if (qty > product.stock) return res.status(400).json({ message: `Only ${product.stock} left in stock.` });
    if (qty > MAX_CART_QUANTITY) return res.status(400).json({ message: `Cart quantity cannot exceed ${MAX_CART_QUANTITY}.` });

    item.quantity = qty;
    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Could not update cart.' });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId) as any;
    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Could not remove item.' });
  }
};
