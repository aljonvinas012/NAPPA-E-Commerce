import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResultModal } from '../context/ResultModalContext';

const Register = () => {
  const { register } = useAuth();
  const { showResult } = useResultModal();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', gender: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return 'Please fill in all required fields.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      showResult({
        type: 'success',
        title: 'Account Created!',
        message: `Welcome, ${user.firstName}! Please log in to continue.`,
        actionLabel: 'Go to Log In',
        onAction: () => navigate('/login'),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ===== LEFT SIDE ===== */}
      <div className="auth-side">
        <Link to="/" className="brand">
          <img src="/images/logo.png" alt="Nappa logo" />
          Nappa Food & Crafts
        </Link>
        <h2 className="animate-fade-in-up">
          Join the Nappa<br />pasalubong family.
        </h2>
        <p className="animate-fade-in-up" style={{ animationDelay: '.08s' }}>
          Create your account to shop handwoven abaca crafts, authentic Bicolano pasalubong, and
          exclusive finds from local artisans in Camalig, Albay.
        </p>
        <ul className="auth-feature-list">
          <li className="animate-fade-in-left" style={{ animationDelay: '.08s' }}>
            <i className="fas fa-bolt" /> Fast, easy checkout
          </li>
          <li className="animate-fade-in-left" style={{ animationDelay: '.16s' }}>
            <i className="fas fa-box-open" /> Save up to 3 delivery addresses
          </li>
          <li className="animate-fade-in-left" style={{ animationDelay: '.24s' }}>
            <i className="fas fa-shield-halved" /> Transparent order tracking
          </li>
        </ul>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="auth-form-wrap">
        <div className="auth-card animate-fade-in-up">
          <h1>Create Your Account</h1>
          <p className="sub">Join us and shop authentic Bicolano crafts.</p>

          {error && (
            <div className="alert-banner alert-danger">
              <i className="fas fa-circle-exclamation" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <div className="mb-4">
                <label className="field-label">First Name</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-user" />
                  <input className="input-field" placeholder="Juan" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                </div>
              </div>
              <div className="mb-4">
                <label className="field-label">Last Name</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-user" />
                  <input className="input-field" placeholder="Dela Cruz" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="field-label">Email Address</label>
              <div className="input-icon-wrap">
                <i className="fas fa-envelope" />
                <input type="email" className="input-field" placeholder="you@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-4">
              <div className="mb-4">
                <label className="field-label">Phone Number</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-phone" />
                  <input className="input-field" placeholder="09xxxxxxxxx" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="mb-4">
                <label className="field-label">Gender</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-venus-mars" />
                  <select className="input-field !rounded-full" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
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
            </div>

            <div className="grid sm:grid-cols-2 gap-x-4">
              <div className="mb-4">
                <label className="field-label">Password</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-lock" />
                  <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} />
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`} onClick={() => setShowPassword((v) => !v)} />
                </div>
              </div>
              <div className="mb-5">
                <label className="field-label">Confirm Password</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-lock" />
                  <input type={showConfirm ? 'text' : 'password'} className="input-field" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
                  <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`} onClick={() => setShowConfirm((v) => !v)} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Sign Up'} <i className="fas fa-arrow-right" />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p className="auth-switch">
            <Link to="/"><i className="fas fa-arrow-left" /> Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
