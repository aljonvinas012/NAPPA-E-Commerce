import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import type { IProduct, IReview } from '../../types';
import RatingStars from '../../components/RatingStars';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`),
    ]).then(([p, r]) => {
      setProduct(p.data);
      setReviews(r.data);
      setActiveImage(0);
      setQuantity(1);
      setRatingFilter('All');
    }).finally(() => setLoading(false));
  }, [id]);

  const guard = () => {
    if (!user) {
      showToast('Please log in first to continue.', 'error');
      navigate('/login');
      return false;
    }
    return true;
  };

  if (loading) return <LoadingSpinner label="Loading product..." />;
  if (!product) return <div className="text-center py-16 text-bark/60">Product not found.</div>;

  const outOfStock = product.stock <= 0;
  const filteredReviews = ratingFilter === 'All' ? reviews : reviews.filter((r) => Math.round(r.rating) === ratingFilter);

  return (
    <div className="container-nappa py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-5">
        <i className="fas fa-arrow-left" /> Back
      </button>
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-card overflow-hidden bg-cream/40 mb-3">
            <img src={getImageUrl(product.images[activeImage])} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-soft overflow-hidden border-2 ${activeImage === i ? 'border-oliveDark' : 'border-transparent'}`}
                >
                  <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold text-oliveDark">{product.category}</span>
          <h1 className="font-display text-2xl sm:text-3xl text-bark mt-1 mb-2">{product.name}</h1>
          {product.sku && <p className="text-xs text-bark/40 font-mono mb-2">Product Code: {product.sku}</p>}
          <div className="flex items-center gap-2 mb-4">
            <RatingStars rating={product.rating} />
            <span className="text-sm text-bark/50">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
          </div>
          <p className="font-display text-3xl text-bark mb-4">₱{product.price.toLocaleString()}</p>
          <p className="text-bark/70 leading-relaxed mb-6">{product.description}</p>

          <p className="text-sm font-semibold mb-4">
            {outOfStock ? (
              <span className="text-red-500">Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-amber-600">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-oliveDark">In Stock ({product.stock} available)</span>
            )}
          </p>

          {!outOfStock && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center border border-tan/50 rounded-soft">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 text-lg">−</button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, 99, q + 1))}
                  className="w-9 h-9 text-lg"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={outOfStock}
              onClick={() => { if (guard()) addToCart(product._id, quantity); }}
              className="btn-secondary flex-1"
            >
              Add to Cart
            </button>
            <button
              disabled={outOfStock}
              onClick={() => { if (guard()) navigate('/shop/checkout', { state: { buyNow: { productId: product._id, quantity } } }); }}
              className="btn-primary flex-1"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl text-bark">Customer Reviews ({filteredReviews.length}{ratingFilter !== 'All' ? ` of ${reviews.length}` : ''})</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="rating-filter" className="text-xs font-semibold text-bark/60">Filter by rating</label>
              <select
                id="rating-filter"
                className="input-field !rounded-full !py-1.5 text-sm !w-auto"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              >
                <option value="All">All Ratings</option>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-bark/50 text-sm">No reviews yet for this product.</p>
        ) : filteredReviews.length === 0 ? (
          <p className="text-bark/50 text-sm">No reviews match this rating.</p>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((r) => (
              <div key={r._id} className="card-surface p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-ink">{r.user.firstName} {r.user.lastName}</span>
                  <span className="text-xs text-bark/40">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <RatingStars rating={r.rating} size={13} />
                {r.comment && <p className="text-sm text-bark/70 mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
