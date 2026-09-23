import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const SHIPPING_FEE = 80;
const regions = ['Metro Manila', 'North Luzon', 'South Luzon', 'Visayas', 'Mindanao'];

interface LineItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
}

const paymentMethods = ['Cash on Delivery', 'GCash', 'Maya', 'Credit/Debit Card', 'Mari Bank'];

interface Voucher {
  code: string;
  title: string;
  description: string;
  icon: string;
}

const availableVouchers: Voucher[] = [
  { code: 'FREESHIP', title: 'Free Shipping Voucher', description: 'Get free shipping on every order, no minimum spend.', icon: 'fa-truck-fast' },
];

const Checkout = () => {
  const location = useLocation() as { state?: { buyNow?: { productId: string; quantity: number } } };
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { cart, refreshCart } = useCart();
  const { showToast } = useToast();
  const { showResult } = useResultModal();

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherPick, setVoucherPick] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressPick, setAddressPick] = useState('');

  const buyNow = location.state?.buyNow;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (buyNow) {
        const { data } = await api.get(`/products/${buyNow.productId}`);
        setLineItems([{
          productId: data._id, name: data.name, image: data.images[0], price: data.price, quantity: buyNow.quantity, category: data.category,
        }]);
      } else {
        setLineItems(
          (cart?.items || []).map((i) => ({
            productId: i.product._id, name: i.product.name, image: i.product.images[0], price: i.product.price, quantity: i.quantity, category: i.product.category,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [buyNow, cart]);

  useEffect(() => {
    const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    if (def?._id) setAddressId(def._id);
  }, [user]);

  // Checkout is split into one order PER category — "Order 1 (Furniture)",
  // "Order 2 (Bags)", etc. — same grouping the Cart page previews.
  const groups = useMemo(() => {
    const map = new Map<string, LineItem[]>();
    for (const item of lineItems) {
      const key = item.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    }));
  }, [lineItems]);

  const freeShipping = !!appliedVoucher;
  const shippingPerOrder = freeShipping ? 0 : SHIPPING_FEE;
  const subtotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalShipping = groups.length * shippingPerOrder;
  const total = subtotal + totalShipping;

  const openVoucherModal = () => {
    setVoucherPick(appliedVoucher);
    setShowVoucherModal(true);
  };

  const confirmVoucher = () => {
    setAppliedVoucher(voucherPick);
    setShowVoucherModal(false);
    if (voucherPick) {
      showToast('Voucher applied — free shipping on every order!', 'success');
    }
  };

  const openAddressModal = () => {
    setAddressPick(addressId);
    setShowAddressModal(true);
  };

  const confirmAddress = () => {
    setAddressId(addressPick);
    setShowAddressModal(false);
  };

  const handlePlaceOrder = async () => {
    if (!user?.phone) {
      showToast('Please add your contact number before placing your order.', 'error');
      return;
    }
    if (!user?.addresses || user.addresses.length === 0) {
      showToast('Please add a delivery address before placing your order.', 'error');
      return;
    }
    setPlacing(true);
    try {
      const payload: any = { addressId, paymentMethod, voucherCode: appliedVoucher || undefined };
      if (buyNow) payload.items = [{ productId: buyNow.productId, quantity: buyNow.quantity }];

      const { data } = await api.post('/orders', payload);
      const orders = Array.isArray(data) ? data : [data];
      await Promise.all([refreshCart(), refreshUser()]);

      const orderNumbers = orders.map((o: any) => o.orderNumber).join(', ');
      showResult({
        type: 'success',
        title: orders.length > 1 ? `${orders.length} Orders Placed!` : 'Order Placed!',
        message: orders.length > 1
          ? `Your items were split into ${orders.length} separate orders by category: ${orderNumbers}. Each is now being prepared.`
          : `Your order ${orderNumbers} has been placed and is being prepared.`,
        actionLabel: 'View My Orders',
        onAction: () => navigate('/shop/orders'),
        ...(orders.length === 1 ? {
          secondaryLabel: 'View Invoice',
          onSecondary: () => navigate(`/shop/orders/${orders[0]._id}?invoice=1`),
        } : {}),
      });
    } catch (err: any) {
      showResult({
        type: 'error',
        title: 'Order Failed',
        message: err.response?.data?.message || 'Unable to place your order. Please try again.',
        actionLabel: 'Try Again',
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <LoadingSpinner label="Preparing your order..." />;

  if (lineItems.length === 0) {
    return (
      <div className="container-nappa py-16 text-center">
        <p className="text-bark/60 mb-4">There's nothing to check out yet.</p>
        <button onClick={() => navigate('/shop/products')} className="btn-primary">Browse Products</button>
      </div>
    );
  }

  return (
    <div className="container-nappa py-8">
      <button onClick={() => navigate('/shop/cart')} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-4">
        <i className="fas fa-arrow-left" /> Back to Cart
      </button>
      <h1 className="font-display text-2xl text-bark mb-1">Checkout</h1>
      {groups.length > 1 && (
        <p className="text-xs text-bark/50 mb-5">
          Your items span {groups.length} categories, so they'll be placed as {groups.length} separate orders.
        </p>
      )}
      {groups.length <= 1 && <div className="mb-6" />}

      {/* ONE unified card-style container: address, payment, then the
          category-split order summary folded into the bottom of the SAME
          card — nothing lives in a separate sidebar card anymore. */}
      <div className="card-surface overflow-hidden">
        {/* Address */}
        <div className="p-5 border-b border-tan/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-bark">Delivery Address</h2>
            <Link to="/shop/addresses" className="text-xs font-semibold text-oliveDark">Manage addresses</Link>
          </div>
          {!user?.addresses || user.addresses.length === 0 ? (
            <div className="bg-amber-50 text-amber-700 text-sm font-medium px-4 py-3 rounded-soft">
              Please add a delivery address before placing your order.{' '}
              <Link to="/shop/addresses" className="underline font-semibold">Add one now</Link>
            </div>
          ) : (
            <button
              onClick={openAddressModal}
              className="inline-flex items-start gap-2 w-fit max-w-full text-left px-3 py-2 rounded-soft border border-tan/40 hover:border-oliveDark text-xs"
            >
              <i className="fas fa-location-dot text-oliveDark mt-0.5 shrink-0" />
              {(() => {
                const selectedAddress = user.addresses.find((a) => a._id === addressId) || user.addresses[0];
                return (
                  <span className="leading-snug">
                    <span className="font-semibold text-ink text-sm block">{selectedAddress.fullName} · {selectedAddress.phone}</span>
                    <span className="text-bark/60">{selectedAddress.street}, {selectedAddress.barangay}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}</span>
                  </span>
                );
              })()}
              <i className="fas fa-chevron-right text-[10px] text-bark/40 mt-1.5 ml-1 shrink-0" />
            </button>
          )}
        </div>

        {/* Payment */}
        <div className="p-5 border-b border-tan/20">
          <h2 className="font-display text-lg text-bark mb-3">Payment Method</h2>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field !w-auto text-sm">
            {paymentMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {paymentMethod !== 'Cash on Delivery' && (
            <p className="text-xs text-bark/50 mt-3">
              You'll be guided to complete your {paymentMethod} payment after placing the order. Online payment integration is coming soon.
            </p>
          )}
        </div>

        {/* Order Summary — split by category, folded into the bottom of this same card */}
        <div>
          <div className="px-5 pt-4">
            <h2 className="font-display text-lg text-bark mb-2">Order Summary</h2>
          </div>

          {groups.map((group, gi) => (
            <div key={group.category} className="px-5 pt-3">
              <p className="text-xs font-bold text-oliveDark uppercase tracking-wide mb-1.5">
                {groups.length > 1 ? `Order ${gi + 1} — ${group.category}` : group.category}
              </p>
              <div className="overflow-x-auto rounded-soft border border-tan/20">
                <table className="w-full text-sm">
                  <tbody>
                    {group.items.map((i) => (
                      <tr key={i.productId} className="border-b border-tan/15 last:border-0">
                        <td className="py-2 px-3 flex items-center gap-2">
                          <img src={getImageUrl(i.image)} className="w-10 h-10 rounded-soft object-cover shrink-0" />
                          <span className="truncate max-w-[160px] font-medium text-ink">{i.name}</span>
                        </td>
                        <td className="py-2 px-3 text-bark/70 whitespace-nowrap">Qty {i.quantity}</td>
                        <td className="py-2 px-3 text-right font-semibold text-ink whitespace-nowrap">₱{(i.price * i.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-bark/50 text-right mt-1">
                Subtotal: ₱{group.subtotal.toLocaleString()} + ₱{shippingPerOrder} shipping
              </p>
            </div>
          ))}

          {/* Voucher — Shopee-style: tap to view available vouchers as tickets */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between gap-3 border border-tan/30 rounded-soft px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <i className="fas fa-ticket text-oliveDark" />
                {appliedVoucher ? (
                  <p className="text-sm text-ink font-semibold truncate">
                    {availableVouchers.find((v) => v.code === appliedVoucher)?.title || appliedVoucher} applied
                  </p>
                ) : (
                  <p className="text-sm text-bark/60">Have a voucher?</p>
                )}
              </div>
              <button onClick={openVoucherModal} className="text-xs font-semibold text-oliveDark whitespace-nowrap shrink-0">
                {appliedVoucher ? 'Change' : 'View available voucher'} <i className="fas fa-chevron-right text-[10px] ml-0.5" />
              </button>
            </div>
          </div>

          {/* Subtotal / shipping / total — directly above the Place Order button */}
          <div className="p-5">
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between gap-8 text-bark/70"><span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between gap-8 text-bark/70">
                <span>Shipping Fee {groups.length > 1 ? `(${groups.length} orders)` : ''}</span>
                <span>{freeShipping ? <span className="text-oliveDark font-semibold">FREE</span> : `₱${totalShipping.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between gap-8 font-semibold text-ink text-base pt-1 border-t border-tan/20"><span>Total</span><span>₱{total.toLocaleString()}</span></div>
            </div>
            <div className="flex justify-end">
              <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary !py-2.5 !px-6 text-sm">
                {placing ? 'Placing order...' : <>Place Order <i className="fas fa-arrow-right ml-1" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DELIVERY ADDRESS MODAL — pick which saved address to ship to */}
      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title="Choose Delivery Address" maxWidth="max-w-md">
        <div className="space-y-2 mb-5">
          {(user?.addresses || []).map((a) => (
            <label
              key={a._id}
              className={`block p-3 rounded-soft cursor-pointer text-sm border ${addressPick === a._id ? 'border-oliveDark bg-olive/5' : 'border-tan/40'}`}
            >
              <div className="flex items-start gap-2">
                <input type="radio" checked={addressPick === a._id} onChange={() => setAddressPick(a._id!)} className="mt-1 w-4 h-4 accent-oliveDark shrink-0" />
                <div>
                  <p className="font-semibold text-ink">{a.fullName} · {a.phone}</p>
                  <p className="text-bark/60">{a.street}, {a.barangay}, {a.city}, {a.province}, {a.region} {a.postalCode}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
        <Link to="/shop/addresses" className="text-xs font-semibold text-oliveDark block mb-4">+ Manage addresses</Link>
        <div className="flex gap-3">
          <button onClick={() => setShowAddressModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={confirmAddress} disabled={!addressPick} className="btn-primary flex-1">OK</button>
        </div>
      </Modal>

      {/* VOUCHER MODAL — Shopee-style ticket cards */}
      <Modal open={showVoucherModal} onClose={() => setShowVoucherModal(false)} title="Available Vouchers" maxWidth="max-w-md">
        <div className="space-y-3 mb-5">
          {availableVouchers.map((v) => {
            const picked = voucherPick === v.code;
            return (
              <button
                key={v.code}
                onClick={() => setVoucherPick(picked ? null : v.code)}
                className={`relative w-full flex items-stretch rounded-soft overflow-hidden border text-left ${
                  picked ? 'border-oliveDark ring-1 ring-oliveDark' : 'border-tan/40'
                }`}
              >
                <div className="w-20 shrink-0 bg-oliveDark/90 text-paper flex flex-col items-center justify-center gap-1 py-4">
                  <i className="fas fa-truck-fast text-lg" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Free Ship</span>
                </div>

                {/* dashed "ticket" divider with notch circles cut into it */}
                <div className="relative flex items-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-paper" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-paper" />
                  <div className="border-l-2 border-dashed border-tan/50 h-full" />
                </div>

                <div className="flex-1 flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{v.title}</p>
                    <p className="text-xs text-bark/50">{v.description}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Available</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${picked ? 'border-oliveDark' : 'border-tan/50'}`}>
                    {picked && <div className="w-2.5 h-2.5 rounded-full bg-oliveDark" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowVoucherModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={confirmVoucher} className="btn-primary flex-1">OK</button>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;
