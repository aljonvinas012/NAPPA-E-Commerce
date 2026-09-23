import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../services/api';
import type { IOrder } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useResultModal } from '../../context/ResultModalContext';

const statuses = ['Preparing', 'To Ship', 'To Receive', 'Completed'];
const filters = ['All', ...statuses, 'Cancelled'];

const STATUS_STYLES: Record<string, string> = {
  Preparing: 'bg-tan/25 text-bark',
  'To Ship': 'bg-olive/20 text-oliveDark',
  'To Receive': 'bg-oliveDark/20 text-oliveDark',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
};

const AdminOrders = () => {
  const { showResult } = useResultModal();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<IOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<IOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/orders/all').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const isTerminal = (o: IOrder | null) => !!o && (o.status === 'Completed' || o.status === 'Cancelled');

  // Shared items table — with product picture — reused by both the
  // "View Details" (read-only) modal and the "Update Status" modal.
  const renderItemsTable = (order: IOrder) => (
    <div>
      <p className="text-sm font-semibold text-ink mb-2">Items ({order.items.length})</p>
      <div className="overflow-x-auto rounded-soft border border-tan/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-bark/50 border-b border-tan/30 bg-cream/40">
              <th className="py-2 px-3 font-semibold">Item</th>
              <th className="py-2 px-3 font-semibold">Qty</th>
              <th className="py-2 px-3 font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-tan/15 last:border-0">
                <td className="py-2 px-3 flex items-center gap-2">
                  <img src={getImageUrl(item.image)} className="w-10 h-10 rounded-soft object-cover shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-ink truncate max-w-[160px] block">{item.name}</span>
                    {item.sku && <span className="text-[11px] text-bark/50 font-mono">Code: {item.sku}</span>}
                  </div>
                </td>
                <td className="py-2 px-3 text-bark/70 whitespace-nowrap">{item.quantity}</td>
                <td className="py-2 px-3 text-bark/70 whitespace-nowrap">₱{item.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const applyStatus = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await api.put(`/orders/${selected._id}/status`, { status });
      setSelected(null); // auto-close the modal once the update succeeds
      setPendingStatus(null);
      load();
      showResult({
        type: 'success',
        title: 'Status Updated',
        message: `Order ${selected.orderNumber} is now marked as "${status}".`,
        actionLabel: 'Okay',
      });
    } catch (err: any) {
      showResult({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Could not update this order\'s shipping status. Please try again.',
        actionLabel: 'Try Again',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusClick = (status: string) => {
    if (!selected || updating) return;
    // Marking an order "Completed" is irreversible (it can't be moved back
    // to Preparing/To Ship/etc. afterward), so we confirm first to avoid
    // mistakes.
    if (status === 'Completed') {
      setPendingStatus(status);
      return;
    }
    applyStatus(status);
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'All' || o.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.toLowerCase().includes(q) ||
      (o.user?.email || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  if (loading) return <LoadingSpinner label="Loading orders..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-bark">Orders ({orders.length})</h2>
        <div className="input-icon-wrap w-full sm:w-72">
          <i className="fas fa-magnifying-glass" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or customer..."
            className="input-field"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border ${
              filter === f ? 'bg-oliveDark text-paper border-oliveDark' : 'border-tan/50 text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* CARD-STYLE TABLE — matches the Products table design */}
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-bark/50 border-b border-tan/30">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-bark/50 text-sm">No orders match your search.</td></tr>
            ) : filtered.map((o) => (
              <tr key={o._id} className="border-b border-tan/15">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img
                    src={getImageUrl(o.items[0]?.image)}
                    className="w-11 h-11 rounded-soft object-cover shrink-0"
                    alt={o.items[0]?.name}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{o.orderNumber}</p>
                    <p className="text-xs text-bark/50 truncate max-w-[200px]">
                      {o.items[0]?.name}{o.items.length > 1 ? ` +${o.items.length - 1} more item${o.items.length - 1 !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-bark/70">{o.user?.firstName} {o.user?.lastName}</td>
                <td className="py-3 px-4 text-bark/70">₱{o.total.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </td>
                <td className="py-3 px-4 text-bark/50 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setViewOrder(o)} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
                      <i className="fas fa-eye" /> View Details
                    </button>
                    {!isTerminal(o) && (
                      <button onClick={() => setSelected(o)} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
                        <i className="fas fa-truck-fast" /> Update Status
                      </button>
                    )}
                    <button onClick={() => setInvoiceOrder(o)} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
                      <i className="fas fa-file-invoice" /> Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL — read-only, available for every order regardless
          of status, shows the ordered items with picture, address, payment */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order Details — ${viewOrder?.orderNumber || ''}`} maxWidth="max-w-lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{viewOrder.user?.firstName} {viewOrder.user?.lastName}</p>
                <p className="text-xs text-bark/50">{viewOrder.user?.email} · {viewOrder.contactNumber}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[viewOrder.status]}`}>{viewOrder.status}</span>
            </div>

            {viewOrder.status === 'Cancelled' && (
              <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-soft flex items-start gap-2">
                <i className="fas fa-ban mt-0.5" />
                <span>Cancelled{viewOrder.cancelReason ? ` — Reason: ${viewOrder.cancelReason}` : '.'}</span>
              </div>
            )}

            {renderItemsTable(viewOrder)}

            <div className="text-sm text-bark/70 border-t border-tan/20 pt-3">
              <p className="font-semibold text-ink mb-1">Delivery Address</p>
              <p>{viewOrder.shippingAddress.fullName}, {viewOrder.shippingAddress.street}, {viewOrder.shippingAddress.barangay}, {viewOrder.shippingAddress.city}, {viewOrder.shippingAddress.province}</p>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-tan/20 pt-3">
              <span className="text-bark/60">Payment</span>
              <span className="font-semibold text-ink">{viewOrder.paymentMethod} · {viewOrder.paymentStatus}</span>
            </div>

            <button onClick={() => setInvoiceOrder(viewOrder)} className="btn-secondary w-full !py-2 text-sm">
              <i className="fas fa-file-invoice" /> View Invoice
            </button>
          </div>
        )}
      </Modal>

      {/* UPDATE STATUS MODAL */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Update Order Status — ${selected?.orderNumber || ''}`} maxWidth="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{selected.user?.firstName} {selected.user?.lastName}</p>
                <p className="text-xs text-bark/50">{selected.user?.email} · {selected.contactNumber}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
            </div>

            {renderItemsTable(selected)}
            <div className="text-sm text-bark/70 border-t border-tan/20 pt-3">
              <p className="font-semibold text-ink mb-1">Delivery Address</p>
              <p>{selected.shippingAddress.fullName}, {selected.shippingAddress.street}, {selected.shippingAddress.barangay}, {selected.shippingAddress.city}, {selected.shippingAddress.province}</p>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-tan/20 pt-3">
              <span className="text-bark/60">Payment</span>
              <span className="font-semibold text-ink">{selected.paymentMethod} · {selected.paymentStatus}</span>
            </div>

            <div className="border-t border-tan/20 pt-3">
              <button onClick={() => setInvoiceOrder(selected)} className="btn-secondary w-full !py-2 text-sm mb-3">
                <i className="fas fa-file-invoice" /> View Invoice
              </button>

              <p className="text-sm font-semibold text-ink mb-2">Update Shipping Status</p>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => handleStatusClick(s)}
                    className={`text-xs font-semibold px-3 py-2 rounded-full border ${
                      selected.status === s ? 'bg-oliveDark text-paper border-oliveDark' : 'border-tan/50 text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM "COMPLETED" MODAL — completing an order can't be undone */}
      <Modal open={!!pendingStatus} onClose={() => setPendingStatus(null)} title="Mark Order as Completed?">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-4">
            <i className="fas fa-triangle-exclamation" />
          </div>
          <p className="text-sm text-bark/70 mb-6">
            Are you sure order <span className="font-semibold text-ink">{selected?.orderNumber}</span> is completed?
            Once marked as Completed, it cannot be changed back to Preparing, To Ship, or To Receive.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setPendingStatus(null)} className="btn-secondary flex-1">Cancel</button>
            <button disabled={updating} onClick={() => applyStatus('Completed')} className="btn-primary flex-1">
              {updating ? 'Updating...' : 'Yes, Completed'}
            </button>
          </div>
        </div>
      </Modal>

      {/* INVOICE MODAL — includes each item's picture */}
      <Modal open={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} title="Invoice" maxWidth="max-w-lg">
        {invoiceOrder && (
          <div id="invoice-print-area">
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
                <p className="font-display text-lg text-bark">{invoiceOrder.orderNumber}</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  invoiceOrder.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  invoiceOrder.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-olive/20 text-oliveDark'
                }`}>{invoiceOrder.status}</span>
              </div>
            </div>
            {invoiceOrder.status === 'Cancelled' && invoiceOrder.cancelReason && (
              <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-soft mb-4">
                <i className="fas fa-ban mr-1.5" />Cancelled — Reason: {invoiceOrder.cancelReason}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-xs text-bark/50 mb-0.5">Billed To</p>
                <p className="font-semibold text-ink">{invoiceOrder.shippingAddress.fullName}</p>
                <p className="text-bark/60 text-xs">{invoiceOrder.shippingAddress.street}, {invoiceOrder.shippingAddress.barangay}, {invoiceOrder.shippingAddress.city}, {invoiceOrder.shippingAddress.province}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-bark/50 mb-0.5">Date Issued</p>
                <p className="text-ink">{new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-bark/50 mt-2 mb-0.5">Payment</p>
                <p className="text-ink">{invoiceOrder.paymentMethod} ({invoiceOrder.paymentStatus})</p>
              </div>
            </div>
            <div className="border-t border-tan/30 pt-3 space-y-2 mb-3">
              {invoiceOrder.items.map((item, i) => (
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
              <div className="flex justify-between text-bark/60"><span>Subtotal</span><span>₱{invoiceOrder.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-bark/60"><span>Shipping Fee</span><span>₱{invoiceOrder.shippingFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold text-ink text-base pt-1"><span>Total</span><span>₱{invoiceOrder.total.toLocaleString()}</span></div>
            </div>
            <button onClick={() => window.print()} className="btn-primary w-full mt-5 !py-2 text-sm">
              <i className="fas fa-print" /> Print Invoice
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
