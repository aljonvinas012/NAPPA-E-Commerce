import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { ICustomer } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useResultModal } from '../../context/ResultModalContext';

const AdminCustomers = () => {
  const { showResult } = useResultModal();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'suspended'>('All');

  const [editing, setEditing] = useState<ICustomer | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', gender: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewing, setViewing] = useState<ICustomer | null>(null);

  const [resetting, setResetting] = useState<ICustomer | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/customers').then(({ data }) => setCustomers(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c: ICustomer) => {
    setEditing(c);
    setEditForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || '', gender: c.gender || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await api.put(`/admin/users/${editing._id}`, editForm);
      setEditing(null);
      load();
      showResult({ type: 'success', title: 'User Updated', message: 'This customer\'s details have been saved successfully.' });
    } catch (err: any) {
      showResult({ type: 'error', title: 'Update Failed', message: err.response?.data?.message || 'Could not update this user\'s details.', actionLabel: 'Try Again' });
    } finally {
      setSavingEdit(false);
    }
  };

  const savePassword = async () => {
    if (!resetting) return;
    if (newPassword.length < 6) {
      showResult({ type: 'error', title: 'Password Too Short', message: 'New password must be at least 6 characters long.' });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put(`/admin/users/${resetting._id}/password`, { newPassword });
      setResetting(null);
      setNewPassword('');
      showResult({ type: 'success', title: 'Password Reset', message: `${resetting.firstName}'s password has been reset successfully. Share the new password with them securely.` });
    } catch (err: any) {
      showResult({ type: 'error', title: 'Reset Failed', message: err.response?.data?.message || 'Could not reset this user\'s password.', actionLabel: 'Try Again' });
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleStatus = async (c: ICustomer) => {
    const nextStatus = c.status === 'active' ? 'suspended' : 'active';
    setStatusBusyId(c._id);
    try {
      await api.put(`/admin/users/${c._id}/status`, { status: nextStatus });
      load();
      showResult({
        type: 'success',
        title: nextStatus === 'active' ? 'Account Enabled' : 'Account Disabled',
        message:
          nextStatus === 'active'
            ? `${c.firstName} ${c.lastName} can now log in again.`
            : `${c.firstName} ${c.lastName} will no longer be able to log in.`,
      });
    } catch (err: any) {
      showResult({ type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Could not update this account\'s status.', actionLabel: 'Try Again' });
    } finally {
      setStatusBusyId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner label="Loading customers..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-bark">Manage Users ({customers.length})</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="input-icon-wrap w-full sm:w-64">
            <i className="fas fa-magnifying-glass" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="input-field" />
          </div>
          {/* Oval status filter buttons instead of a dropdown */}
          <div className="flex gap-2">
            {([
              { key: 'All', label: 'All Statuses' },
              { key: 'active', label: 'Active' },
              { key: 'suspended', label: 'Disabled' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border shrink-0 ${
                  statusFilter === f.key ? 'bg-oliveDark text-paper border-oliveDark' : 'border-tan/50 text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-bark/50 border-b border-tan/30">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Orders</th>
              <th className="py-3 px-4">Spent</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-bark/50 text-sm">No users match your search.</td></tr>
            ) : filtered.map((c) => (
              <tr key={c._id} className="border-b border-tan/15">
                <td className="py-3 px-4">
                  <p className="font-medium text-ink">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-bark/50">Joined {new Date(c.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="py-3 px-4 text-bark/70">
                  <p>{c.email}</p>
                  <p className="text-xs text-bark/50">{c.phone || '—'}</p>
                </td>
                <td className="py-3 px-4 text-bark/70">{c.orderCount}</td>
                <td className="py-3 px-4 text-bark/70">₱{(c.totalSpending || 0).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'active' ? 'bg-oliveDark/15 text-oliveDark' : 'bg-red-50 text-red-500'}`}>
                    {c.status === 'active' ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-3 text-xs font-semibold">
                    <button onClick={() => setViewing(c)} className="text-bark/70">View</button>
                    <button onClick={() => openEdit(c)} className="text-oliveDark">Edit</button>
                    <button onClick={() => setResetting(c)} className="text-bark/60">Reset Password</button>
                    <button
                      disabled={statusBusyId === c._id}
                      onClick={() => toggleStatus(c)}
                      className={c.status === 'active' ? 'text-red-500' : 'text-oliveDark'}
                    >
                      {c.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit user modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit User Details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">First Name</label>
              <input className="input-field" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Last Name</label>
              <input className="input-field" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="input-field" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Phone Number</label>
              <input className="input-field" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Gender</label>
              <select className="input-field !rounded-full !w-auto" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Transgender</option>
                <option>Genderqueer</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>
          <button disabled={savingEdit} onClick={saveEdit} className="btn-primary w-full">
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal open={!!resetting} onClose={() => { setResetting(null); setNewPassword(''); }} title="Reset Password">
        <div className="space-y-4">
          <p className="text-sm text-bark/60">
            Set a new password for <span className="font-semibold text-ink">{resetting?.firstName} {resetting?.lastName}</span>.
            Use this when a customer forgot their password.
          </p>
          <div>
            <label className="field-label">New Password</label>
            <input type="text" className="input-field" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button disabled={savingPassword} onClick={savePassword} className="btn-primary w-full">
            {savingPassword ? 'Saving...' : 'Reset Password'}
          </button>
        </div>
      </Modal>

      {/* View full user details modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="User Details" maxWidth="max-w-lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg text-bark">{viewing.firstName} {viewing.lastName}</p>
                <p className="text-xs text-bark/50">User ID: {viewing._id}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${viewing.status === 'active' ? 'bg-oliveDark/15 text-oliveDark' : 'bg-red-50 text-red-500'}`}>
                {viewing.status === 'active' ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-cream/40 rounded-soft p-4">
              <div>
                <p className="text-xs text-bark/50">Email</p>
                <p className="text-ink font-medium break-all">{viewing.email}</p>
              </div>
              <div>
                <p className="text-xs text-bark/50">Phone Number</p>
                <p className="text-ink font-medium">{viewing.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-bark/50">Gender</p>
                <p className="text-ink font-medium">{viewing.gender || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-bark/50">Date Joined</p>
                <p className="text-ink font-medium">{new Date(viewing.createdAt).toLocaleDateString()}</p>
              </div>
              {viewing.updatedAt && (
                <div>
                  <p className="text-xs text-bark/50">Last Updated</p>
                  <p className="text-ink font-medium">{new Date(viewing.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-bark/50">Total Orders</p>
                <p className="text-ink font-medium">{viewing.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-bark/50">Total Spending</p>
                <p className="text-ink font-medium">₱{(viewing.totalSpending || 0).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-bark/50 mb-1.5">Saved Addresses ({viewing.addresses?.length || 0})</p>
              {!viewing.addresses || viewing.addresses.length === 0 ? (
                <p className="text-bark/40 text-xs italic">No saved addresses.</p>
              ) : (
                <div className="space-y-2">
                  {viewing.addresses.map((a: any, i: number) => (
                    <div key={a._id || i} className="border border-tan/30 rounded-soft px-3 py-2">
                      <p className="font-semibold text-ink text-xs">{a.fullName} {a.isDefault && <span className="text-oliveDark">(Default)</span>}</p>
                      <p className="text-bark/60 text-xs">{a.street}, {a.barangay}, {a.city}, {a.province}</p>
                      <p className="text-bark/50 text-xs">{a.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
