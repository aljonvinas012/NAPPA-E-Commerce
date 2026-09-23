import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../services/api';
import EmptyState from '../../components/EmptyState';

const Cart = () => {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  // Preview how checkout will split these items — one order PER category,
  // e.g. "Order 1 (Furniture)" / "Order 2 (Bags)" — same grouping used on
  // the Checkout page and reflected as separate orders in Order History.
  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.product.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([category, groupItems]) => ({
      category,
      items: groupItems,
      subtotal: groupItems.reduce((s, i) => s + i.product.price * i.quantity, 0),
    }));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="container-nappa py-8">
        <EmptyState title="Your cart is empty" message="Browse our shop and add something you love." />
        <div className="text-center flex items-center justify-center gap-3">
          <button onClick={() => navigate('/shop')} className="btn-secondary">
            <i className="fas fa-house" /> Back to Home
          </button>
          <button onClick={() => navigate('/shop/products')} className="btn-primary">Start Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-nappa py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark">
          <i className="fas fa-house" /> Back to Home
        </button>
      </div>
      <h1 className="font-display text-2xl text-bark mb-1">Your Cart ({totalQty} item{totalQty !== 1 ? 's' : ''})</h1>
      {groups.length > 1 && (
        <p className="text-xs text-bark/50 mb-5">
          Your items span {groups.length} categories, so they'll be placed as {groups.length} separate orders at checkout.
        </p>
      )}
      {groups.length <= 1 && <div className="mb-6" />}

      {/* CARD-STYLE TABLE — items grouped by category (order preview) + summary unified into a single card */}
      <div className="card-surface overflow-hidden">
        {groups.map((group, gi) => (
          <div key={group.category} className="border-b border-tan/20 last:border-0">
            <p className="text-xs font-bold text-oliveDark uppercase tracking-wide px-4 pt-4 pb-1.5">
              {groups.length > 1 ? `Order ${gi + 1} — ${group.category}` : group.category}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-bark/50 border-b border-tan/30">
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">Quantity</th>
                    <th className="py-2.5 px-4">Subtotal</th>
                    <th className="py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.product._id} className="border-b border-tan/15 last:border-0">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={getImageUrl(item.product.images[0])}
                          className="w-14 h-14 rounded-soft object-cover shrink-0 cursor-pointer"
                          onClick={() => navigate(`/shop/products/${item.product._id}`)}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate max-w-[180px]">{item.product.name}</p>
                          <p className="text-xs text-bark/50">{item.product.category}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-bark/70">₱{item.product.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center border border-tan/50 rounded-full overflow-hidden w-fit">
                          <button
                            onClick={() => updateQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 text-base hover:bg-cream"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, Math.min(item.product.stock, 99, item.quantity + 1))}
                            className="w-7 h-7 text-base hover:bg-cream"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-display text-bark whitespace-nowrap">
                        ₱{(item.product.price * item.quantity).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => removeItem(item.product._id)} className="text-red-400 hover:text-red-500 w-8 h-8 rounded-full hover:bg-red-50 inline-flex items-center justify-center">
                          <i className="fas fa-trash-can" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groups.length > 1 && (
              <p className="text-xs text-bark/50 text-right px-4 pb-3 pt-1">Order {gi + 1} subtotal: ₱{group.subtotal.toLocaleString()}</p>
            )}
          </div>
        ))}

        {/* Order summary folded into the same card, right-sized checkout button bottom-right */}
        <div className="p-5 flex flex-wrap items-end justify-between gap-4">
          <div className="text-sm text-bark/70 space-y-1">
            <p>Subtotal ({totalQty} item{totalQty !== 1 ? 's' : ''}): <span className="font-semibold text-ink">₱{subtotal.toLocaleString()}</span></p>
            <p className="text-xs text-bark/40">Shipping fee calculated at checkout.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-bark/50">Estimated Total</p>
              <p className="font-display text-xl text-bark">₱{subtotal.toLocaleString()}</p>
            </div>
            <button onClick={() => navigate('/shop/checkout')} className="btn-primary !py-2.5 !px-5 text-sm">
              Proceed to Checkout <i className="fas fa-arrow-right ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
