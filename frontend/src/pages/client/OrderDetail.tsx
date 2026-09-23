import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import type { IOrder } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderStatusTracker from '../../components/OrderStatusTracker';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';

const OrderDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { showResult } = useResultModal();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; name: string; image: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const load = () => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (searchParams.get('invoice') === '1') {
      setShowInvoice(true);
      searchParams.delete('invoice');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const submitReview = async () => {
    if (!reviewTarget || !order) return;
    if (rating < 1) {
      showToast('Please select a star rating before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { orderId: order._id, productId: reviewTarget.productId, rating, comment });
      setReviewTarget(null);
      setRating(0);
      setComment('');
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

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!cancelReason.trim()) {
      setCancelError('Please tell us why you\'re cancelling this order.');
      return;
    }
    setCancelError('');
    setCancelling(true);
    try {
      await api.put(`/orders/${order._id}/cancel`, { reason: cancelReason.trim() });
      showToast('Your order has been cancelled.', 'success');
      setShowCancelConfirm(false);
      setCancelReason('');
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not cancel this order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading order..." />;
  if (!order) return <div className="text-center py-16 text-bark/60">Order not found.</div>;

  // Orders can only be cancelled by the customer while still "Preparing" —
  // once it moves to "To Ship" it's already on its way out and can't be
  // cancelled anymore.
  const canCancel = order.status === 'Preparing';

  return (
    <div className="container-nappa py-8 max-w-3xl mx-auto">
      <Link to="/shop/orders" className="flex items-center gap-2 text-sm text-bark/50 hover:text-bark mb-4 w-fit">
        <i className="fas fa-arrow-left" /> Back to orders
      </Link>

      <div className="card-surface p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="font-display text-lg text-bark">Order {order.orderNumber}</p>
            <p className="text-xs text-bark/50">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={() => setShowInvoice(true)} className="btn-secondary !py-2 !px-4 text-xs">
            <i className="fas fa-file-invoice" /> View Invoice
          </button>
        </div>
        {order.status === 'Cancelled' ? (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-soft flex items-center gap-3">
            <img src={getImageUrl(order.items[0]?.image)} className="w-10 h-10 rounded-soft object-cover shrink-0" alt={order.items[0]?.name} />
            <span><i className="fas fa-ban mr-1.5" />This order was cancelled{order.cancelReason ? ` — ${order.cancelReason}` : '.'}</span>
          </div>
        ) : (
          <OrderStatusTracker status={order.status} />
        )}
      </div>

      <h2 className="font-display text-lg text-bark mb-3">Items</h2>
      <div className="card-surface overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-bark/50 border-b border-tan/30">
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Qty</th>
              <th className="py-3 px-4">Price</th>
              {order.status === 'Completed' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-tan/15">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img src={getImageUrl(item.image)} className="w-12 h-12 rounded-soft object-cover shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-ink max-w-[220px] truncate block">{item.name}</span>
                    {item.sku && <span className="text-[11px] text-bark/50 font-mono">Code: {item.sku}</span>}
                  </div>
                </td>
                <td className="py-3 px-4 text-bark/70">{item.quantity}</td>
                <td className="py-3 px-4 text-bark/70">₱{item.price.toLocaleString()}</td>
                {order.status === 'Completed' && (
                  <td className="py-3 px-4 text-right">
                    {item.reviewed ? (
                      <span className="text-xs font-semibold text-oliveDark"><i className="fas fa-check" /> Reviewed</span>
                    ) : (
                      <button
                        onClick={() => { setReviewTarget({ productId: item.product, name: item.name, image: item.image }); setRating(0); setComment(''); }}
                        className="btn-secondary !py-1.5 !px-3 text-xs"
                      >
                        Rate Product
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="card-surface p-5">
          <h2 className="font-display text-base text-bark mb-3">Delivery Address</h2>
          <p className="text-sm text-bark/70 leading-relaxed">
            {order.shippingAddress.fullName} · {order.contactNumber}<br />
            {order.shippingAddress.street}, {order.shippingAddress.barangay}, {order.shippingAddress.city},{' '}
            {order.shippingAddress.province} {order.shippingAddress.postalCode}
          </p>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-display text-base text-bark mb-3">Payment</h2>
          <p className="text-sm text-bark/70 mb-3">{order.paymentMethod} · <span className="font-semibold">{order.paymentStatus}</span></p>
          <div className="text-sm space-y-1 border-t border-tan/20 pt-3">
            <div className="flex justify-between text-bark/60"><span>Subtotal</span><span>₱{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-bark/60"><span>Shipping</span><span>₱{order.shippingFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>₱{order.total.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="card-surface p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-bark/60">Changed your mind? You can still cancel this order while it's being prepared.</p>
          <button onClick={() => { setShowCancelConfirm(true); setCancelReason(''); setCancelError(''); }} className="btn-danger !py-2 !px-5 text-sm shrink-0 ml-auto">
            <i className="fas fa-ban" /> Cancel Order
          </button>
        </div>
      )}

      {/* REVIEW MODAL */}
      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title={`Rate ${reviewTarget?.name || ''}`}>
        <div className="space-y-4">
          {reviewTarget?.image && (
            <div className="flex items-center gap-3">
              <img src={getImageUrl(reviewTarget.image)} className="w-14 h-14 rounded-soft object-cover" alt={reviewTarget.name} />
              <p className="font-semibold text-sm text-ink">{reviewTarget.name}</p>
            </div>
          )}
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
            placeholder="Share your thoughts about this product (optional)"
            className="input-field min-h-[90px]"
          />
          <button onClick={submitReview} disabled={submitting || rating < 1} className="btn-primary w-full">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </Modal>

      {/* CANCEL CONFIRM MODAL */}
      <Modal open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="Cancel this order?">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4">
            <i className="fas fa-triangle-exclamation" />
          </div>
          <p className="text-sm text-bark/70 mb-4">
            Are you sure you want to cancel order <span className="font-semibold text-ink">{order.orderNumber}</span>? This cannot be undone.
          </p>
          <div className="text-left mb-2">
            <label className="field-label">Reason for cancelling <span className="text-red-500">*</span></label>
            <textarea
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); if (cancelError) setCancelError(''); }}
              placeholder="e.g. Changed my mind, ordered by mistake, found a better price..."
              className="input-field min-h-[80px]"
            />
            {cancelError && <p className="text-xs text-red-500 mt-1">{cancelError}</p>}
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary flex-1">Keep Order</button>
            <button disabled={cancelling || !cancelReason.trim()} onClick={handleCancelOrder} className="btn-danger flex-1">
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* INVOICE MODAL */}
      <Modal open={showInvoice} onClose={() => setShowInvoice(false)} title="Invoice" maxWidth="max-w-lg">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" className="w-10 h-10 object-contain" />
              <div>
                <p className="font-display text-base text-bark leading-tight">Nappa Food & Crafts</p>
                <p className="text-[11px] text-bark/50">Pasalubong Center</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-bark/50">Invoice for Order</p>
              <p className="font-display text-lg text-bark">{order.orderNumber}</p>
              <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-olive/20 text-oliveDark'
              }`}>{order.status}</span>
            </div>
          </div>
          {order.status === 'Cancelled' && order.cancelReason && (
            <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-soft mb-4">
              <i className="fas fa-ban mr-1.5" />Cancelled — Reason: {order.cancelReason}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-xs text-bark/50 mb-0.5">Billed To</p>
              <p className="font-semibold text-ink">{order.shippingAddress.fullName}</p>
              <p className="text-bark/60 text-xs">{order.shippingAddress.street}, {order.shippingAddress.barangay}, {order.shippingAddress.city}, {order.shippingAddress.province}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-bark/50 mb-0.5">Date Issued</p>
              <p className="text-ink">{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-bark/50 mt-2 mb-0.5">Payment</p>
              <p className="text-ink">{order.paymentMethod} ({order.paymentStatus})</p>
            </div>
          </div>
          <div className="border-t border-tan/30 pt-3 space-y-2 mb-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={getImageUrl(item.image)} className="w-10 h-10 rounded-soft object-cover shrink-0" />
                  <div className="min-w-0">
                    <span className="text-ink truncate block">{item.name} × {item.quantity}</span>
                    {item.sku && <span className="text-[10px] text-bark/45 font-mono">Code: {item.sku}</span>}
                  </div>
                </div>
                <span className="text-bark/70 shrink-0">₱{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-tan/30 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-bark/60"><span>Subtotal</span><span>₱{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-bark/60"><span>Shipping Fee</span><span>₱{order.shippingFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold text-ink text-base pt-1"><span>Total</span><span>₱{order.total.toLocaleString()}</span></div>
          </div>
          <button onClick={() => window.print()} className="btn-primary w-full mt-5 !py-2 text-sm">
            <i className="fas fa-print" /> Print Invoice
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
