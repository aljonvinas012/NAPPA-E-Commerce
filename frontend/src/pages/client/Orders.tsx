import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import type { IOrder } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';

const STATUS_STYLES: Record<string, string> = {
  Preparing: 'bg-tan/25 text-bark',
  'To Ship': 'bg-olive/20 text-oliveDark',
  'To Receive': 'bg-oliveDark/20 text-oliveDark',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
};

// Remembers whether "Order History" was expanded, so navigating away to
// another page and back doesn't quietly re-collapse it — the shopper
// decides when to hide it again, not the router.
const HISTORY_OPEN_KEY = 'nappa_order_history_open';

const Orders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showResult } = useResultModal();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(() => localStorage.getItem(HISTORY_OPEN_KEY) === '1');

  const toggleHistory = () => {
    setShowHistory((v) => {
      const next = !v;
      localStorage.setItem(HISTORY_OPEN_KEY, next ? '1' : '0');
      return next;
    });
  };

  // Rate/feedback modal — lets a customer rate any not-yet-reviewed item
  // straight from the Order History row, without leaving the page.
  const [rateOrder, setRateOrder] = useState<IOrder | null>(null);
  const [rateItemIdx, setRateItemIdx] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Every order that isn't finished yet can be tracked on its own.
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  // Order History now includes both Completed AND Cancelled orders in one
  // combined, single list — no separate button for cancelled orders.
  const historyOrders = useMemo(
    () => orders.filter((o) => o.status === 'Completed' || o.status === 'Cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const filteredHistory = historyOrders.filter((o) => {
    const q = search.trim().toLowerCase();
    return !q || o.orderNumber.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
  });

  const openRate = (order: IOrder) => {
    const idx = order.items.findIndex((i) => !i.reviewed);
    setRateOrder(order);
    setRateItemIdx(idx >= 0 ? idx : 0);
    setRating(0);
    setComment('');
  };

  const submitReview = async () => {
    if (!rateOrder) return;
    const item = rateOrder.items[rateItemIdx];
    if (!item) return;
    if (rating < 1) {
      showToast('Please select a star rating before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { orderId: rateOrder._id, productId: item.product, rating, comment });
      setRateOrder(null);
      load();
      showResult({
        type: 'success',
        title: 'Review Submitted',
        message: 'Thank you for your review! Your feedback helps other shoppers and our local artisans.',
      });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your orders..." />;

  return (
    <div className="container-nappa py-8">
      <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-4">
        <i className="fas fa-house" /> Back to Home
      </button>
      <h1 className="font-display text-2xl text-bark mb-6">Track Your Order</h1>

      {orders.length === 0 ? (
        <EmptyState title="No orders here" message="Orders you place will show up in this list." />
      ) : (
        <>
          {/* TRACK YOUR ORDER — card-style table, every order still in progress */}
          {activeOrders.length > 0 ? (
            <div className="card-surface overflow-x-auto mb-8">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-bark/50 border-b border-tan/30">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order) => (
                    <tr key={order._id} className="border-b border-tan/15">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={getImageUrl(order.items[0]?.image)}
                          className="w-11 h-11 rounded-soft object-cover shrink-0"
                          alt={order.items[0]?.name}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{order.orderNumber}</p>
                          <p className="text-xs text-bark/50 truncate max-w-[200px]">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-bark/70">₱{order.total.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                      </td>
                      <td className="py-3 px-4 text-bark/50 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/shop/orders/${order._id}`} className="btn-primary !py-1.5 !px-3 text-xs whitespace-nowrap">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-surface p-5 mb-8 text-center">
              <p className="text-sm text-bark/60">You have no orders in progress right now — everything's been delivered! 🎉</p>
            </div>
          )}

          {/* ORDER HISTORY — Completed AND Cancelled orders together, one toggle button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bark">Order History</h2>
            <button onClick={toggleHistory} className="btn-secondary !py-2 text-sm">
              {showHistory ? 'Hide History' : 'View Order History'}
            </button>
          </div>

          {showHistory && (
            <>
              <div className="input-icon-wrap mb-4 w-full sm:w-72">
                <i className="fas fa-magnifying-glass" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order or item..."
                  className="input-field"
                />
              </div>

              {filteredHistory.length === 0 ? (
                <EmptyState title="No order history yet" message="Completed and cancelled orders show up here." />
              ) : (
                <div className="card-surface overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-left text-bark/50 border-b border-tan/30">
                        <th className="py-3 px-4">Order</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((order) => {
                        const hasUnreviewed = order.status === 'Completed' && order.items.some((i) => !i.reviewed);
                        return (
                          <tr key={order._id} className="border-b border-tan/15 align-top">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getImageUrl(order.items[0]?.image)}
                                  className="w-11 h-11 rounded-soft object-cover shrink-0"
                                  alt={order.items[0]?.name}
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                                  <p className="text-xs text-bark/50 truncate max-w-[200px]">
                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                  </p>
                                  {order.status === 'Cancelled' && order.cancelReason && (
                                    <p className="text-xs text-red-500 truncate max-w-[200px]">Reason: {order.cancelReason}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-bark/70">₱{order.total.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                            </td>
                            <td className="py-3 px-4 text-bark/50 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Link to={`/shop/orders/${order._id}`} className="btn-secondary !py-1.5 !px-2.5 text-[11px] whitespace-nowrap">
                                  View Details
                                </Link>
                                {order.status === 'Completed' && (
                                  <Link to={`/shop/orders/${order._id}?invoice=1`} className="btn-secondary !py-1.5 !px-2.5 text-[11px] whitespace-nowrap">
                                    Invoice
                                  </Link>
                                )}
                                {hasUnreviewed && (
                                  <button onClick={() => openRate(order)} className="btn-primary !py-1.5 !px-2.5 text-[11px] whitespace-nowrap">
                                    Rate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* RATE / FEEDBACK MODAL */}
      <Modal open={!!rateOrder} onClose={() => setRateOrder(null)} title="Rate Your Order">
        {rateOrder && (
          <div className="space-y-4">
            {rateOrder.items.filter((i) => !i.reviewed).length > 1 && (
              <div>
                <label className="field-label">Which item?</label>
                <select
                  className="input-field"
                  value={rateItemIdx}
                  onChange={(e) => { setRateItemIdx(Number(e.target.value)); setRating(0); setComment(''); }}
                >
                  {rateOrder.items.map((item, idx) => (
                    !item.reviewed && <option key={idx} value={idx}>{item.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <img src={getImageUrl(rateOrder.items[rateItemIdx]?.image)} className="w-14 h-14 rounded-soft object-cover" />
              <p className="font-semibold text-sm text-ink">{rateOrder.items[rateItemIdx]?.name}</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className="text-3xl leading-none text-oliveDark" aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  {n <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-xs text-center text-bark/50">Tap a star to rate this product.</p>}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about this product (optional)"
              className="input-field min-h-[90px]"
            />
            <button onClick={submitReview} disabled={submitting || rating < 1} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
