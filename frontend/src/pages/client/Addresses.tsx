import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResultModal } from '../../context/ResultModalContext';
import api from '../../services/api';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import LocationPicker from '../../components/LocationPicker';

const regions = ['Metro Manila', 'North Luzon', 'South Luzon', 'Visayas', 'Mindanao'];

// Local government region codes from OpenStreetMap (ISO 3166-2:PH), grouped
// into the five choices the address form offers.
const REGION_BY_ISO: Record<string, string> = {
  'PH-00': 'Metro Manila',
  'PH-01': 'North Luzon', 'PH-02': 'North Luzon', 'PH-03': 'North Luzon', 'PH-15': 'North Luzon',
  'PH-05': 'South Luzon', 'PH-40': 'South Luzon', 'PH-41': 'South Luzon',
  'PH-06': 'Visayas', 'PH-07': 'Visayas', 'PH-08': 'Visayas', 'PH-18': 'Visayas',
  'PH-09': 'Mindanao', 'PH-10': 'Mindanao', 'PH-11': 'Mindanao', 'PH-12': 'Mindanao',
  'PH-13': 'Mindanao', 'PH-14': 'Mindanao',
};

// Fallback for points where OpenStreetMap only gives names, not ISO codes.
const regionFromAddress = (a: any): string => {
  const iso = a['ISO3166-2-lvl3'] || a['ISO3166-2-lvl4'];
  if (iso && REGION_BY_ISO[iso]) return REGION_BY_ISO[iso];

  const text = `${a.region || ''} ${a.state || ''} ${a.province || ''}`.toLowerCase();
  if (/metro manila|national capital|\bncr\b/.test(text)) return 'Metro Manila';
  if (/ilocos|cagayan valley|central luzon|cordillera|batanes|isabela|quirino|nueva vizcaya|abra|apayao|benguet|ifugao|kalinga|mountain province|aurora|bataan|bulacan|nueva ecija|pampanga|tarlac|zambales/.test(text)) return 'North Luzon';
  if (/calabarzon|mimaropa|bicol|quezon|rizal|laguna|batangas|cavite|romblon|marinduque|palawan|albay|camarines|sorsogon|masbate/.test(text)) return 'South Luzon';
  if (/visayas|iloilo|antique|capiz|guimaras|negros|bohol|cebu|siquijor|leyte|samar|biliran/.test(text)) return 'Visayas';
  if (/mindanao|zamboanga|misamis|davao|soccsksargen|cotabato|sarangani|sultan kudarat|agusan|surigao|dinagat|bukidnon|lanao|bangsamoro|barmm|basilan|sulu|tawi/.test(text)) return 'Mindanao';
  return '';
};

const emptyForm = {
  fullName: '', phone: '', region: '', province: '', city: '', barangay: '', street: '', postalCode: '', instructions: '', isDefault: false,
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
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
  const [locating, setLocating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const addresses = user?.addresses || [];

  const openAdd = () => {
    if (addresses.length >= 3) {
      showToast('You can only save up to 3 addresses.', 'error');
      return;
    }
    setForm({
      ...emptyForm,
      fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      phone: user?.phone || '',
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const addr = addresses.find((a) => a._id === id);
    if (!addr) return;
    setForm({
      ...emptyForm,
      ...addr,
      instructions: addr.instructions || '',
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    setEditingId(id);
    setModalOpen(true);
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  // Reverse geocode so a map pin can fill the fields the customer still gets
  // to edit. Photon first (one request; it knows PH streets/towns well), then
  // Nominatim only for whatever Photon left blank.
  const applyLocation = async (latitude: number, longitude: number) => {
    let street = '';
    let houseNumber = '';
    let barangay = '';
    let city = '';
    let province = '';
    let postalCode = '';

    try {
      const res = await fetch(
        `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=en`
      );
      if (res.ok) {
        const props = (await res.json())?.features?.[0]?.properties || {};
        street = props.street || '';
        houseNumber = props.housenumber || '';
        const locality = String(props.locality || '');
        const isPurok = /^(zone|purok|sitio)\b/i.test(locality);
        barangay = (isPurok ? props.district || locality : locality || props.district) || '';
        city = props.city || props.county || '';
        province = props.state || '';
        postalCode = props.postcode || '';
      }
    } catch {
      // Fall through to Nominatim.
    }

    if (!street || !city || !barangay) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=${latitude}&lon=${longitude}`
        );
        if (res.ok) {
          const a = (await res.json()).address || {};
          street = street || a.road || a.pedestrian || '';
          houseNumber = houseNumber || a.house_number || '';
          barangay = barangay || a.neighbourhood || a.quarter || a.suburb || a.village || a.hamlet || a.city_district || '';
          city = city || a.city || a.town || a.municipality || a.county || '';
          province = province || a.state || a.province || a.state_district || a.region || '';
          postalCode = postalCode || a.postcode || '';
        }
      } catch {
        // Keep what Photon already gave us.
      }
    }

    const filled = street || city || barangay || postalCode;
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
      street: [houseNumber, street].filter(Boolean).join(' ') || prev.street,
      barangay: barangay || prev.barangay,
      city: city || prev.city,
      province: province || prev.province,
      region: regionFromAddress({ state: province, province }) || prev.region,
      postalCode: postalCode || prev.postalCode,
    }));
    showToast(
      filled
        ? 'Address filled from the pin — please check it before saving.'
        : 'Pin saved, but no address was found. Please type it.',
      filled ? 'success' : 'error'
    );
  };

  // Geolocation Web API: start the pin at the phone's GPS position.
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('This browser cannot get your location. Tap the map instead.', 'error');
      return;
    }
    // Browsers block location on plain http:// (except localhost).
    if (!window.isSecureContext) {
      showToast('Location needs HTTPS (or localhost). You can still tap the map to pin your address.', 'error');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await applyLocation(position.coords.latitude, position.coords.longitude);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        const messages: Record<number, string> = {
          1: 'Location permission denied. You can still tap the map to pin your address.',
          2: 'Your location is unavailable right now. Tap the map instead.',
          3: 'Location lookup timed out. Tap the map instead.',
        };
        showToast(messages[error.code] || 'Could not get your location.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
                  {a.latitude != null && a.longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-oliveDark mt-1 inline-flex items-center gap-1"
                    >
                      <i className="fas fa-location-dot" /> View pinned location
                    </a>
                  )}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Address' : 'Add Address'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onPick={(lat, lng) => { void applyLocation(lat, lng); }}
          />
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn-secondary w-full text-sm">
            <i className="fas fa-location-crosshairs mr-2" />
            {locating ? 'Getting your location...' : 'Use my current location'}
          </button>
          <input className="input-field" placeholder="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          <input className="input-field" placeholder="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="input-field !rounded-full !w-auto" value={form.region} onChange={(e) => update('region', e.target.value)}>
              <option value="" disabled>Select Region</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input className="input-field" placeholder="Province" value={form.province} onChange={(e) => update('province', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
