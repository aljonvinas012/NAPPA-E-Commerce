import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';

export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const { range = 'month' } = req.query;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined; // 1-12
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let groupFormat = '%Y-%m-%d';
    let label = '';

    if (range === 'week') {
      // Current week (Mon-Sun)
      const day = now.getDay() === 0 ? 7 : now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (day - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      groupFormat = '%Y-%m-%d';
      label = 'This Week';
    } else if (range === 'year') {
      const y = year || now.getFullYear();
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
      groupFormat = '%Y-%m';
      label = `${y}`;
    } else {
      // month (specific month/year, defaults to current month)
      const y = year || now.getFullYear();
      const m = month ? month - 1 : now.getMonth();
      startDate = new Date(y, m, 1);
      endDate = new Date(y, m + 1, 1);
      groupFormat = '%Y-%m-%d';
      label = startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          total: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const periodRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const periodOrders = sales.reduce((sum, s) => sum + s.orders, 0);

    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    res.json({
      label,
      series: sales.map((s) => ({ date: s._id, total: s.total, orders: s.orders })),
      period: { revenue: periodRevenue, orders: periodOrders },
      totals: {
        revenue: totalRevenue[0]?.total || 0,
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Could not load analytics.' });
  }
};

// One-stop endpoint that feeds every card/chart/alert on the admin dashboard
// besides the period revenue chart (getSalesAnalytics) and best sellers
// (getBestSellers), which the dashboard already had and still uses.
export const getDashboardOverview = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    const dow = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (dow - 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const NON_CANCELLED = { status: { $ne: 'Cancelled' } };

    const revenueBetween = async (start: Date, end?: Date) => {
      const match: any = { ...NON_CANCELLED, createdAt: { $gte: start } };
      if (end) match.createdAt.$lt = end;
      const rows = await Order.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]);
      return { revenue: rows[0]?.revenue || 0, orders: rows[0]?.orders || 0 };
    };

    const [
      todaySales,
      weekSales,
      monthSales,
      lastMonthSales,
      allTime,
      orderStatusCounts,
      productStats,
      lowStockProducts,
      outOfStockProducts,
      recentOrders,
      recentProducts,
      totalCustomers,
      newCustomersThisMonth,
      customersWithOrders,
      registrationTrendRaw,
      topCustomersRaw,
      paymentStatusCounts,
      paymentMethodBreakdown,
      categoryBreakdown,
      locationBreakdown,
      newOrdersToday,
      cancelledAwaitingRefund,
    ] = await Promise.all([
      revenueBetween(startOfToday),
      revenueBetween(startOfWeek),
      revenueBetween(startOfMonth),
      revenueBetween(startOfLastMonth, startOfMonth),
      revenueBetween(new Date(0)),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
            inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          },
        },
      ]),
      Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(10),
      Product.find().sort({ createdAt: -1 }).limit(5),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth } }),
      Order.distinct('user'),
      User.aggregate([
        { $match: { role: 'customer', createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: NON_CANCELLED },
        { $group: { _id: '$user', totalSpending: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { totalSpending: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 0, name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, email: '$user.email', totalSpending: 1, orders: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: NON_CANCELLED },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: NON_CANCELLED },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
        { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$p.category', 'Other'] },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: NON_CANCELLED },
        { $group: { _id: { $ifNull: ['$shippingAddress.province', 'Unknown'] }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ status: 'Cancelled', paymentStatus: 'Refunded' }),
    ]);

    const statusMap: Record<string, number> = {};
    orderStatusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    const paymentMap: Record<string, number> = {};
    paymentStatusCounts.forEach((s: any) => { paymentMap[s._id] = s.count; });

    const totalOrders = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const growthPercent = lastMonthSales.revenue > 0
      ? ((monthSales.revenue - lastMonthSales.revenue) / lastMonthSales.revenue) * 100
      : (monthSales.revenue > 0 ? 100 : 0);

    const stats = productStats[0] || { total: 0, active: 0, inactive: 0, inventoryValue: 0 };

    // month-by-month registration trend, filling gaps with 0
    const trendMap: Record<string, number> = {};
    registrationTrendRaw.forEach((r: any) => { trendMap[r._id] = r.count; });
    const registrationTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { month: d.toLocaleString('en-US', { month: 'short' }), count: trendMap[key] || 0 };
    });

    res.json({
      sales: {
        today: todaySales.revenue,
        week: weekSales.revenue,
        month: monthSales.revenue,
        allTime: allTime.revenue,
        netRevenue: allTime.revenue, // cancelled orders already excluded above
        totalOrders: allTime.orders,
        averageOrderValue: allTime.orders > 0 ? allTime.revenue / allTime.orders : 0,
        growthPercent,
      },
      ordersOverview: {
        total: totalOrders,
        preparing: statusMap['Preparing'] || 0,
        toShip: statusMap['To Ship'] || 0,
        toReceive: statusMap['To Receive'] || 0,
        completed: statusMap['Completed'] || 0,
        cancelled: statusMap['Cancelled'] || 0,
        recent: recentOrders,
      },
      products: {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        inventoryValue: stats.inventoryValue,
        recent: recentProducts,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
        returning: customersWithOrders.length,
        active: customersWithOrders.length,
        top: topCustomersRaw,
        registrationTrend,
      },
      payments: {
        paid: paymentMap['Paid'] || 0,
        pending: paymentMap['Pending'] || 0,
        failed: paymentMap['Failed'] || 0,
        refunded: paymentMap['Refunded'] || 0,
        byMethod: paymentMethodBreakdown.map((m: any) => ({ method: m._id, count: m.count, revenue: m.revenue })),
      },
      shipping: {
        toPack: statusMap['Preparing'] || 0,
        readyToShip: statusMap['To Ship'] || 0,
        inTransit: statusMap['To Receive'] || 0,
        delivered: statusMap['Completed'] || 0,
        failedDeliveries: 0,
      },
      alerts: {
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts,
        needProcessing: statusMap['Preparing'] || 0,
        refundRequests: cancelledAwaitingRefund,
        newOrdersToday,
      },
      charts: {
        salesByCategory: categoryBreakdown.map((c: any) => ({ category: c._id, revenue: c.revenue })),
        salesByPaymentMethod: paymentMethodBreakdown.map((m: any) => ({ method: m._id, revenue: m.revenue })),
        salesByLocation: locationBreakdown.map((l: any) => ({ location: l._id, revenue: l.revenue, orders: l.orders })),
        orderStatusDistribution: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Could not load dashboard overview.' });
  }
};

export const getMonthlySales = async (req: Request, res: Response) => {
  try {
    const monthly = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          productsSold: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);
    res.json(monthly);
  } catch (error) {
    res.status(500).json({ message: 'Could not load monthly sales.' });
  }
};

export const getBestSellers = async (req: Request, res: Response) => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
      {
        $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          product: {
            _id: '$product._id',
            name: '$product.name',
            sku: '$product.sku',
            images: '$product.images',
            rating: '$product.rating',
            stock: '$product.stock',
          },
          unitsSold: 1,
          revenue: 1,
        },
      },
    ]);
    res.json(bestSellers);
  } catch (error) {
    console.error('Best sellers error:', error);
    res.status(500).json({ message: 'Could not load best sellers.' });
  }
};

// Enable / disable a customer account
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot change status of an admin account.' });
    }
    user.status = status;
    await user.save();
    res.json({ message: `Account ${status === 'active' ? 'enabled' : 'disabled'} successfully.`, user: { _id: user.id, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: 'Could not update account status.' });
  }
};

// Edit a customer's own details (name, email, phone, gender)
export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, gender } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'Another account already uses this email.' });
      user.email = email.toLowerCase();
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;

    await user.save();
    res.json({ message: 'User details updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Could not update user details.' });
  }
};

// Admin resets a customer's password (e.g. forgot password support)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not reset password.' });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          gender: 1,
          status: 1,
          addresses: 1,
          createdAt: 1,
          updatedAt: 1,
          orderCount: { $size: '$orders' },
          totalSpending: { $sum: '$orders.total' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Could not load customers.' });
  }
};
