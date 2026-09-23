import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      showToast('Please enter a phone number.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/phone', { phone });
      await refreshUser();
      showToast('Phone number updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not update phone number.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-nappa py-8 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-bark/60 hover:text-oliveDark mb-4">
        <i className="fas fa-arrow-left" /> Back
      </button>
      <h1 className="font-display text-2xl text-bark mb-6">Edit Profile</h1>
      <div className="card-surface p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-1 text-ink">First Name</label>
          <input className="input-field bg-cream/30" value={user?.firstName} disabled />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1 text-ink">Last Name</label>
          <input className="input-field bg-cream/30" value={user?.lastName} disabled />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1 text-ink">Email</label>
          <input className="input-field bg-cream/30" value={user?.email} disabled />
        </div>
        <form onSubmit={handleSave}>
          <label className="text-sm font-semibold block mb-1 text-ink">Phone Number</label>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" />
          <button type="submit" disabled={saving} className="btn-primary w-full mt-4">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
