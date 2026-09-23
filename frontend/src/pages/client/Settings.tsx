import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Password changed successfully.', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not change password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-nappa py-8 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-4">
        <i className="fas fa-arrow-left" /> Back
      </button>
      <h1 className="font-display text-2xl text-bark mb-6">Settings</h1>
      <div className="card-surface p-6">
        <h2 className="font-display text-lg text-bark mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1 text-ink">Current Password</label>
            <input type="password" className="input-field" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1 text-ink">New Password</label>
            <input type="password" className="input-field" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1 text-ink">Confirm New Password</label>
            <input type="password" className="input-field" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
