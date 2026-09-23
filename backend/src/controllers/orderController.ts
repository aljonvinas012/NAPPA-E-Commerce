import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Cart from '../models/Cart';
import User from '../models/User';
import Notification from '../models/Notification';
import { generateOrderNumber } from '../utils/orderNumber';
import { checkLowStockAndNotify } from './productController';

const SHIPPING_FEE = 80;

// Notifies every admin account — used so the admin notification bell has
// real, per-admin, mark-as-read notifications instead of just re-reading
// the recent orders list.
const notifyAdmins = async (type: string, title: string, message: string) => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (admins.length === 0) return;
  await Notification.insertMany(admins.map((a) => ({ user: a._id, type, title, message })));
};

// body: { addressId, paymentMethod, items?: [{productId, quantity}] }
// if `items` is omitted, the whole cart is checked out (normal checkout).
// if `items` is provided, only those are ordered (Buy Now flow).
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { addressId, paymentMethod, items: buyNowItems, voucherCode } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.phone) {
      return res.status(400).json({ message: 'Please add your contact number before placing your order.' });
    }
    if (!user.addresses || user.addresses.length === 0) {
      return res.status(400).json({ message: 'Please add a delivery address before placing your order.' });
    }

    const address = addressId
      ? user.addresses.find((a) => a._id?.toString() === addressId)
      : user.addresses.find((a) => a.isDefault) || user.addresses[0];

    if (!address) {
      return res.status(400).json({ message: 'Please add a delivery address before placing your order.' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Please select a payment method.' });
    }

    let sourceItems: { productId: string; quantity: number }[] = [];

    if (buyNowItems && buyNowItems.length > 0) {
      sourceItems = buyNowItems;
    } else {
      const cart = await Cart.findOne({ user: req.userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty.' });
      }
      sourceItems = cart.items.map((i) => ({ productId: i.product.toString(), quantity: i.quantity }));
    }

    // Items are grouped by category so checkout produces one order PER
    // category (e.g. "Furniture" and "Bags" become two separate orders)
    // instead of one big mixed order — mirrors how the cart/checkout UI
    // previews the split.
    const itemsByCategory = new Map<string, { orderItems: any[]; productIds: string[] }>();

    for (const it of sourceItems) {
      const product = await Product.findById(it.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `A product in your order is no longer available.` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({ message: `Only ${product.stock} left in stock for "${product.name}".` });
      }

      const category = product.category || 'Other';
      if (!itemsByCategory.has(category)) {
        itemsByCategory.set(category, { orderItems: [], productIds: [] });
      }
      const group = itemsByCategory.get(category)!;
      group.orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku || '',
        image: product.images[0] || '',
        price: product.price,
        quantity: it.quantity,
        reviewed: false,
      });
      group.productIds.push(it.productId);
    }

    // Cash on Delivery is only settled once the parcel is delivered; online
    // methods are treated as paid right away (payment gateway integration
    // is a future improvement — see UPDATE-NOTES).
    const paymentStatus = paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid';

    // Free-shipping voucher waives the per-order shipping fee on every
    // split order (simple, single voucher type for now).
    const freeShipping = typeof voucherCode === 'string' && voucherCode.trim().toUpperCase() === 'FREESHIP';

    const shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      region: address.region,
      province: address.province,
      city: address.city,
      barangay: address.barangay,
      street: address.street,
      postalCode: address.postalCode,
      instructions: address.instructions,
    };

    const createdOrders = [];
    for (const [category, group] of itemsByCategory) {
      const groupSubtotal = group.orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
      const groupShippingFee = freeShipping ? 0 : SHIPPING_FEE;
      const groupTotal = groupSubtotal + groupShippingFee;

      const order = await Order.create({
        user: req.userId,
        orderNumber: await generateOrderNumber(),
        items: group.orderItems,
        shippingAddress,
        contactNumber: user.phone,
        paymentMethod,
        subtotal: groupSubtotal,
        shippingFee: groupShippingFee,
        total: groupTotal,
        status: 'Preparing',
        paymentStatus,
      });
      createdOrders.push(order);

      await Notification.create({
        user: req.userId,
        type: 'order_placed',
        title: 'Order placed successfully',
        message: `Your order ${order.orderNumber} (${category}) has been placed and is being prepared.`,
      });

      await notifyAdmins(
        'admin_new_order',
        'New order received',
        `${user.firstName} ${user.lastName} placed order ${order.orderNumber} (${category}) — ₱${groupTotal.toLocaleString()}.`
      );
    }

    // deduct stock, and auto-hide any product that just hit zero stock
    for (const it of sourceItems) {
      const updated = await Product.findByIdAndUpdate(
        it.productId,
        { $inc: { stock: -it.quantity } },
        { new: true }
      );
      if (updated && updated.stock <= 0 && updated.isActive) {
        updated.isActive = false;
        await updated.save();
      }
      if (updated) {
        await checkLowStockAndNotify(updated._id, updated.name, updated.stock);
      }
    }

    // clear only the purchased items from the cart (buy-now leaves the rest untouched)
    const cart = await Cart.findOne({ user: req.userId });
    if (cart) {
      const purchasedIds = sourceItems.map((i) => i.productId);
      cart.items = cart.items.filter((i) => !purchasedIds.includes(i.product.toString())) as any;
      await cart.save();
    }

    res.status(201).json(createdOrders);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Unable to place your order. Please try again.' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Could not load your orders.' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'You do not have access to this order.' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Could not load order.' });
  }
};

// Admin only
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Could not load orders.' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Preparing', 'To Ship', 'To Receive', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Terminal states can never be changed again, to avoid accidental
    // "un-completing" or "un-cancelling" an order.
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        message: `This order is already "${order.status}" and its status can no longer be changed.`,
      });
    }

    order.status = status;
    if (status === 'Completed' && order.paymentStatus === 'Pending') {
      // Cash on Delivery is collected upon successful delivery.
      order.paymentStatus = 'Paid';
    }
    await order.save();

    await Notification.create({
      user: order.user,
      type: 'order_status',
      title: 'Order status updated',
      message: `Your order ${order.orderNumber} is now "${status}".`,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Could not update order status.' });
  }
};

// Customer cancels their own order — only allowed before it has shipped out.
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      return res.status(400).json({ message: 'Please tell us why you\'re cancelling this order.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have access to this order.' });
    }
    if (order.status !== 'Preparing') {
      return res.status(400).json({
        message: 'This order can no longer be cancelled because it is already being shipped.',
      });
    }

    order.status = 'Cancelled';
    order.cancelReason = reason;
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
    }
    await order.save();

    // return the reserved stock
    for (const item of order.items) {
      const updated = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
      if (updated && updated.stock > 0 && !updated.isActive) {
        // Only re-activate products that were auto-hidden purely for being
        // out of stock; if it's still inactive with stock, an admin most
        // likely disabled it on purpose, but restoring on restock is the
        // safer default for a cancelled order returning inventory.
        updated.isActive = true;
        await updated.save();
      }
    }

    await Notification.create({
      user: order.user,
      type: 'order_status',
      title: 'Order cancelled',
      message: `Your order ${order.orderNumber} has been cancelled.`,
    });

    await notifyAdmins(
      'admin_order_cancelled',
      'Order cancelled by customer',
      `Order ${order.orderNumber} was cancelled${order.cancelReason ? ` — ${order.cancelReason}` : '.'}`
    );

    res.json(order);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Could not cancel this order.' });
  }
};
