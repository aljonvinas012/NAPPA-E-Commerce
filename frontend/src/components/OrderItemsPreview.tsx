import { getImageUrl } from '../services/api';

interface PreviewItem {
  name: string;
  image?: string;
  quantity?: number;
}

/** "Bag, Basket +1 more" style summary used under the order number */
export const itemsSummary = (items: PreviewItem[]) => {
  if (!items || items.length === 0) return '';
  const rest = items.length - 1;
  return `${items[0].name}${rest > 0 ? ` +${rest} more` : ''}`;
};

/** Small "3 items" pill — only shown when an order has 2 or more items */
export const ItemsBadge = ({ items }: { items: PreviewItem[] }) =>
  items && items.length > 1 ? (
    <span className="ml-1.5 align-middle text-[10px] font-bold bg-oliveDark/15 text-oliveDark px-1.5 py-0.5 rounded-full whitespace-nowrap">
      {items.length} items
    </span>
  ) : null;

/**
 * Overlapping thumbnails of every product in an order (up to `max`),
 * plus a "+N" bubble for the rest — so a multi-item order is obvious
 * at a glance instead of only showing the first product.
 */
const OrderItemsPreview = ({ items, max = 3 }: { items: PreviewItem[]; max?: number }) => {
  const shown = (items || []).slice(0, max);
  const extra = (items?.length || 0) - shown.length;
  return (
    <div className="flex items-center -space-x-3 shrink-0">
      {shown.map((it, i) => (
        <img
          key={i}
          src={getImageUrl(it.image)}
          alt={it.name}
          title={it.name}
          className="w-11 h-11 rounded-soft object-cover border-2 border-paper shadow-soft bg-cream"
          style={{ zIndex: shown.length - i }}
        />
      ))}
      {extra > 0 && (
        <span className="w-11 h-11 rounded-soft border-2 border-paper bg-cream text-oliveDark text-xs font-bold flex items-center justify-center" style={{ zIndex: 0 }}>
          +{extra}
        </span>
      )}
    </div>
  );
};

export default OrderItemsPreview;
