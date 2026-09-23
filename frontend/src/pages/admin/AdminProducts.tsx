import React, { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../services/api';
import type { IProduct } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';

const categories = [
  'Pasalubong Foods', 'Local Foods', 'Handmade Bags', 'Abaca Rugs',
  'Furniture', 'Native Hats', 'Woven Baskets', 'Woven Lampshades', 'Wooden Crafts',
];
const categoryOptions = [...categories, 'Other'];

const emptyForm = {
  name: '', description: '', price: '', category: categories[0], stock: '', images: [] as string[], isActive: true,
};

const AdminProducts = () => {
  const { showToast } = useToast();
  const { showResult } = useResultModal();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/products/admin/all').then(({ data }) => setProducts(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setEditingSku(null); setModalOpen(true); };
  const openEdit = (p: IProduct) => {
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category, stock: String(p.stock), images: p.images, isActive: p.isActive });
    setEditingId(p._id);
    setEditingSku(p.sku || null);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/products/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f: any) => ({ ...f, images: [...f.images, data.path] }));
    } catch {
      showToast('Could not upload image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => setForm((f: any) => ({ ...f, images: f.images.filter((_: any, i: number) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showResult({ type: 'success', title: 'Product Updated', message: `"${form.name}" was edited successfully.` });
      } else {
        await api.post('/products', payload);
        showResult({ type: 'success', title: 'Product Added', message: `"${form.name}" was added successfully.` });
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      showResult({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || 'Could not save product.', actionLabel: 'Try Again' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      showToast('Product deleted.', 'success');
      load();
    } catch {
      showToast('Could not delete product.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (p: IProduct) => {
    if (p.stock <= 0 && !p.isActive) {
      showToast('This product is out of stock and stays Unavailable automatically. Restock it to make it available again.', 'error');
      return;
    }
    try {
      await api.put(`/products/${p._id}`, { isActive: !p.isActive });
      load();
    } catch {
      showToast('Could not update product.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
  });

  // Inventory snapshot — moved here from the admin dashboard so it lives
  // alongside the product list itself.
  const inventory = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    inactive: products.filter((p) => !p.isActive).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    value: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };

  if (loading) return <LoadingSpinner label="Loading products..." />;

  return (
    <div>
      {/* PRODUCTS & INVENTORY OVERVIEW */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-boxes-stacked text-oliveDark" />
          <h2 className="font-display text-lg text-bark">Products &amp; Inventory</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Total Products</p>
            <p className="font-display text-xl text-bark">{inventory.total}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Active</p>
            <p className="font-display text-xl text-emerald-600">{inventory.active}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Inactive</p>
            <p className="font-display text-xl text-bark">{inventory.inactive}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Low Stock</p>
            <p className="font-display text-xl text-amber-600">{inventory.lowStock}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Out of Stock</p>
            <p className="font-display text-xl text-red-500">{inventory.outOfStock}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-bark/50">Inventory Value</p>
            <p className="font-display text-xl text-bark truncate">₱{Math.round(inventory.value).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl text-bark">Products ({products.length})</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="input-icon-wrap flex-1 sm:w-64">
            <i className="fas fa-magnifying-glass" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or product code..."
              className="input-field"
            />
          </div>
          <button onClick={openAdd} className="btn-primary !py-2 text-sm shrink-0"><i className="fas fa-plus" /> Add Product</button>
        </div>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-bark/50 border-b border-tan/30">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Product Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-bark/50 text-sm">No products match your search.</td></tr>
            ) : filteredProducts.map((p) => (
              <tr key={p._id} className="border-b border-tan/15">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img src={getImageUrl(p.images[0])} className="w-11 h-11 rounded-soft object-cover" />
                  <span className="font-medium text-ink max-w-[180px] truncate">{p.name}</span>
                </td>
                <td className="py-3 px-4 text-bark/60 text-xs font-mono whitespace-nowrap">{p.sku || '—'}</td>
                <td className="py-3 px-4 text-bark/70">{p.category}</td>
                <td className="py-3 px-4 text-bark/70">₱{p.price.toLocaleString()}</td>
                <td className="py-3 px-4 text-bark/70">
                  {p.stock}
                  {p.stock <= 0 && <span className="ml-1.5 text-[10px] font-bold text-red-500">OUT OF STOCK</span>}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(p)}
                    title={p.stock <= 0 ? 'Restock this product to make it available again.' : ''}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-olive/15 text-oliveDark' : 'bg-tan/20 text-bark/50'}`}
                  >
                    {p.isActive ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-xs font-semibold text-oliveDark">Edit</button>
                  <button onClick={() => setDeleteId(p._id)} className="text-xs font-semibold text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          {editingSku && (
            <div className="bg-tan/15 text-bark/60 text-xs font-mono px-3 py-2 rounded-soft flex items-center gap-2">
              <i className="fas fa-barcode" /> Product Code: <span className="font-semibold text-ink">{editingSku}</span>
              <span className="text-bark/40 font-sans">(auto-generated, can't be edited)</span>
            </div>
          )}
          {!editingId && (
            <p className="text-xs text-bark/40 -mt-1">A product code will be generated automatically once you save.</p>
          )}
          <input className="input-field" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="input-field min-h-[80px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min="0" className="input-field" placeholder="Price (₱)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input type="number" min="0" className="input-field" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          {/* Category — oval select consistent with the other pill-shaped
              fields; picking "Other" reveals a text field so the admin can
              type a brand-new category name. */}
          <select
            className="input-field !rounded-full !w-auto"
            value={categories.includes(form.category) ? form.category : 'Other'}
            onChange={(e) => setForm({ ...form, category: e.target.value === 'Other' ? '' : e.target.value })}
          >
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {!categories.includes(form.category) && (
            <input
              className="input-field"
              placeholder="Enter new category name"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          )}

          <div>
            <label className="text-sm font-semibold block mb-1.5 text-ink">Product Images</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {form.images.map((img: string, i: number) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={getImageUrl(img)} className="w-16 h-16 rounded-soft object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-paper rounded-full text-xs flex items-center justify-center"><i className="fas fa-xmark" /></button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-xs" />
            {uploading && <p className="text-xs text-bark/50 mt-1">Uploading...</p>}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Product'}</button>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-sm text-bark/70 mb-5">Are you sure you want to delete this product? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
