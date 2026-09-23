import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../services/api';
import type { IReview } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import RatingStars from '../../components/RatingStars';
import { useResultModal } from '../../context/ResultModalContext';

const AdminFeedback = () => {
  const { showResult } = useResultModal();
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [toDelete, setToDelete] = useState<IReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/reviews').then(({ data }) => setReviews(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/reviews/${toDelete._id}`);
      setToDelete(null);
      load();
      showResult({ type: 'success', title: 'Feedback Deleted', message: 'This comment has been removed from the product page.' });
    } catch (err: any) {
      showResult({ type: 'error', title: 'Delete Failed', message: err.response?.data?.message || 'Could not delete this feedback. Please try again.', actionLabel: 'Try Again' });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = reviews.filter((r) => {
    const productName = typeof r.product === 'object' ? r.product.name : '';
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      productName.toLowerCase().includes(q) ||
      `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q);
    const matchesRating = ratingFilter === 'All' || r.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  if (loading) return <LoadingSpinner label="Loading feedback..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-bark">Product Feedback ({reviews.length})</h2>
        <div className="flex flex-wrap gap-2">
          <div className="input-icon-wrap w-full sm:w-64">
            <i className="fas fa-magnifying-glass" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, customer, or comment..." className="input-field" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {([{ key: 'All', label: 'All Ratings' }, ...[5, 4, 3, 2, 1].map((r) => ({ key: r, label: `${r} Star${r > 1 ? 's' : ''}` }))] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setRatingFilter(f.key as any)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border ${
                  ratingFilter === f.key ? 'bg-oliveDark text-paper border-oliveDark' : 'border-tan/50 text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No feedback found" message="Try a different search term or filter." />
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-bark/50 border-b border-tan/30">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Comment</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const product = typeof r.product === 'object' ? r.product : null;
                return (
                  <tr key={r._id} className="border-b border-tan/15 align-top">
                    <td className="py-3 px-4 flex items-center gap-3">
                      {product?.images?.[0] ? (
                        <img src={getImageUrl(product.images[0])} className="w-11 h-11 rounded-soft object-cover shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-soft bg-cream/60 shrink-0" />
                      )}
                      <span className="font-medium text-ink max-w-[150px] truncate">{product?.name || 'Unknown product'}</span>
                    </td>
                    <td className="py-3 px-4 text-bark/70 whitespace-nowrap">{r.user?.firstName} {r.user?.lastName}</td>
                    <td className="py-3 px-4"><RatingStars rating={r.rating} size={13} /></td>
                    <td className="py-3 px-4 text-bark/70 max-w-[280px]">{r.comment}</td>
                    <td className="py-3 px-4 text-bark/50 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setToDelete(r)}
                        title="Delete sensitive or inappropriate comment"
                        className="w-9 h-9 rounded-full inline-flex items-center justify-center text-red-400 hover:bg-red-50 transition"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Feedback?">
        <div className="space-y-4">
          <p className="text-sm text-bark/60">
            Are you sure you want to delete this comment
            {toDelete ? ` from ${toDelete.user?.firstName} ${toDelete.user?.lastName}` : ''}? This is usually done
            when a comment contains sensitive or inappropriate content. This action cannot be undone.
          </p>
          {toDelete && (
            <div className="bg-cream/50 rounded-soft p-3 text-sm text-ink italic">"{toDelete.comment}"</div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setToDelete(null)} className="btn-secondary flex-1">Cancel</button>
            <button disabled={deleting} onClick={confirmDelete} className="flex-1 bg-red-500 text-white rounded-soft font-semibold hover:bg-red-600 transition">
              {deleting ? 'Deleting...' : 'Delete Comment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFeedback;
