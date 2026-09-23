import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { IProduct } from '../types';
import { getImageUrl } from '../services/api';
import RatingStars from './RatingStars';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }: { product: IProduct }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const guard = () => {
    if (!user) {
      showToast('Please log in first to continue.', 'error');
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!guard()) return;
    addToCart(product._id, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!guard()) return;
    navigate('/shop/checkout', { state: { buyNow: { productId: product._id, quantity: 1 } } });
  };

  return (
    <div
      onClick={() => navigate(`/shop/products/${product._id}`)}
      className="card-surface overflow-hidden cursor-pointer group hover:shadow-card transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className="aspect-square overflow-hidden bg-cream/40 relative">
        <img
          src={getImageUrl(product.images[0])}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
            <span className="text-paper font-semibold text-sm tracking-wide">Out of Stock</span>
          </div>
        )}
        {!outOfStock && lowStock && (
          <span className="absolute top-2 left-2 bg-bark text-paper text-xs font-semibold px-2 py-1 rounded-soft">
            Only {product.stock} left
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <span className="text-[11px] text-oliveDark font-semibold">{product.category}</span>
        <h3 className="font-semibold text-ink text-sm leading-snug line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <RatingStars rating={product.rating} size={12} />
          <span className="text-xs text-bark/50">({product.reviewCount})</span>
        </div>
        <p className="font-display text-lg text-bark mt-auto">₱{product.price.toLocaleString()}</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 btn-secondary !py-2 !px-2 text-xs"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex-1 btn-primary !py-2 !px-2 text-xs"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
