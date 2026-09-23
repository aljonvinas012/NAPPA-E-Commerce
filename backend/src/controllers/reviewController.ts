import { Request, Response } from 'express';
import Review from '../models/Review';
import Order from '../models/Order';
import Product from '../models/Product';

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Could not load reviews.' });
  }
};

// Admin: view all feedback/reviews across all products
export const getAllReviewsAdmin = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'firstName lastName email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Could not load feedback.' });
  }
};

// Admin: delete a review/comment (e.g. sensitive or inappropriate content)
export const deleteReviewAdmin = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Feedback not found.' });

    await review.deleteOne();

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(review.product, {
      rating: stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length > 0 ? stats[0].count : 0,
    });

    res.json({ message: 'Feedback deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete feedback.' });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const { orderId, productId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only review products you purchased.' });
    }
    if (order.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only review products from completed orders.' });
    }

    const item = order.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(403).json({ message: 'You can only review products you purchased.' });
    }
    if (item.reviewed) {
      return res.status(400).json({ message: 'You already reviewed this product for this order.' });
    }

    const review = await Review.create({
      user: req.userId,
      product: productId,
      order: orderId,
      rating,
      comment: comment || '',
    });

    item.reviewed = true;
    await order.save();

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    res.status(201).json(review);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already reviewed this product for this order.' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Could not submit review.' });
  }
};
