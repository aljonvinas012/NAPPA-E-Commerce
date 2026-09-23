import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';
import api from '../../services/api';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

const regions = ['Metro Manila', 'North Luzon', 'South Luzon', 'Visayas', 'Mindanao'];

const emptyForm = {
  fullName: '', phone: '', region: '', province: '', city: '', barangay: '', street: '', postalCode: '', instructions: '', isDefault: false,
};

const Addresses = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showResult } = useResultModal();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const addresses = user?.addresses || [];

  const openAdd = () => {
    if (addresses.length >= 3) {
      showToast('You can only save up to 3 addresses.', 'error');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const addr = addresses.find((a) => a._id === id);
    if (!addr) return;
    setForm({ ...addr, instructions: addr.instructions || '' });
    setEditingId(id);
    setModalOpen(true);
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['fullName', 'phone', 'region', 'province', 'city', 'barangay', 'street', 'postalCode'];
    if (required.some((k) => !(form as any)[k])) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
      } else {
        await api.post('/users/addresses', form);
      }
      await refreshUser();
      setModalOpen(false);
      showResult({
        type: 'success',
        title: editingId ? 'Address Updated' : 'Address Added',
        message: editingId
          ? 'Your delivery address has been updated successfully.'
          : 'Your new delivery address has been saved successfully.',
        actionLabel: 'Done',
      });
    } catch (err: any) {
      showResult({
        type: 'error',
        title: 'Could Not Save Address',
        message: err.response?.data?.message || 'Something went wrong while saving this address. Please try again.',
        actionLabel: 'Try Again',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/addresses/${deleteId}`);
      await refreshUser();
      showToast('Address deleted.', 'success');
    } catch {
      showToast('Could not delete address.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api.put(`/users/addresses/${id}`, { isDefault: true });
      await refreshUser();
      showToast('Default address updated.', 'success');
    } catch {
      showToast('Could not update default address.', 'error');
    }
  };

  return (
    <div className="container-nappa py-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-4">
        <i className="fas fa-arrow-left" /> Back
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-bark">My Addresses</h1>
        <button onClick={openAdd} className="btn-primary !py-2 text-sm">+ Add Address</button>
      </div>
      <p className="text-xs text-bark/50 mb-4">{addresses.length} / 3 addresses saved</p>

      {addresses.length === 0 ? (
        <EmptyState title="No saved addresses" message="Add a delivery address to speed up checkout." />
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a._id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-ink text-sm">{a.fullName}</p>
                    {a.isDefault && <span className="text-[10px] font-bold bg-olive/15 text-oliveDark px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-sm text-bark/60">{a.phone}</p>
                  <p className="text-sm text-bark/60">{a.street}, {a.barangay}, {a.city}, {a.province}, {a.region} {a.postalCode}</p>
                  {a.instructions && <p className="text-xs text-bark/40 mt-1">Note: {a.instructions}</p>}
                </div>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-tan/20 text-xs font-semibold">
                <button onClick={() => openEdit(a._id!)} className="text-oliveDark">Edit</button>
                {!a.isDefault && <button onClick={() => setDefault(a._id!)} className="text-bark/60">Set as Default</button>}
                <button onClick={() => setDeleteId(a._id!)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Address' : 'Add Address'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          <input className="input-field" placeholder="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field !rounded-full !w-auto" value={form.region} onChange={(e) => update('region', e.target.value)}>
              <option value="" disabled>Select Region</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input className="input-field" placeholder="Province" value={form.province} onChange={(e) => update('province', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="City / Municipality" value={form.city} onChange={(e) => update('city', e.target.value)} />
            <input className="input-field" placeholder="Barangay" value={form.barangay} onChange={(e) => update('barangay', e.target.value)} />
          </div>
          <input className="input-field" placeholder="Street / House No." value={form.street} onChange={(e) => update('street', e.target.value)} />
          <input className="input-field" placeholder="Postal Code" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
          <textarea className="input-field" placeholder="Delivery instructions (optional)" value={form.instructions} onChange={(e) => update('instructions', e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} />
            Set as default address
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Address'}</button>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Address">
        <p className="text-sm text-bark/70 mb-5">Are you sure you want to delete this address? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default Addresses;
