import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { login, verifyMfa } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2: admin-only Authenticator App (TOTP) verification. mfaToken
  // proves step 1 (email+password) already passed; qrCode/manualEntryKey
  // are only present the very first time an admin logs in, so they can
  // scan the code into Google Authenticator / Authy / Microsoft
  // Authenticator before confirming.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaSetup, setMfaSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.mfaRequired) {
        setMfaToken(result.mfaToken || null);
        setMfaSetup(!!result.mfaSetup);
        setQrCode(result.qrCode || null);
        setManualEntryKey(result.manualEntryKey || null);
        return;
      }
      const user = result.user!;
      showToast(`Welcome back, ${user.firstName}!`, 'success');
      navigate(user.role === 'admin' ? '/admin' : '/shop');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setError('');
    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    try {
      const user = await verifyMfa(mfaToken, code.trim());
      showToast(`Welcome back, ${user.firstName}!`, 'success');
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const backToLogin = () => {
    setMfaToken(null);
    setMfaSetup(false);
    setQrCode(null);
    setManualEntryKey(null);
    setCode('');
    setError('');
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
          Welcome back to<br />your Nappa account.
        </h2>
        <p className="animate-fade-in-up" style={{ animationDelay: '.08s' }}>
          Log in to shop handwoven abaca crafts, authentic Bicolano pasalubong, and track every
          order from your shopping cart to your doorstep.
        </p>
        <ul className="auth-feature-list">
          <li className="animate-fade-in-left" style={{ animationDelay: '.08s' }}>
            <i className="fas fa-bag-shopping" /> Shop authentic Bicolano crafts & food
          </li>
          <li className="animate-fade-in-left" style={{ animationDelay: '.16s' }}>
            <i className="fas fa-truck-fast" /> Track every order in real time
          </li>
          <li className="animate-fade-in-left" style={{ animationDelay: '.24s' }}>
            <i className="fas fa-heart" /> Support local Bicolano artisans
          </li>
        </ul>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="auth-form-wrap">
        <div className="auth-card animate-fade-in-up">
          {!mfaToken ? (
            <>
              <h1>Log In</h1>
              <p className="sub">Enter your credentials to access your account.</p>

              {error && (
                <div className="alert-banner alert-danger">
                  <i className="fas fa-circle-exclamation" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="field-label">Email Address</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-envelope" />
                    <input
                      type="email"
                      className="input-field"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="field-label">Password</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-lock" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <i
                      className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`}
                      onClick={() => setShowPassword((v) => !v)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Logging in...' : 'Log In'} <i className="fas fa-arrow-right" />
                </button>
              </form>

              <p className="auth-switch">
                Don't have an account? <Link to="/register">Sign up here</Link>
              </p>
              <p className="auth-switch">
                <Link to="/"><i className="fas fa-arrow-left" /> Back to homepage</Link>
              </p>
            </>
          ) : (
            <>
              {/* ===== ADMIN MFA STEP (Authenticator App / TOTP) ===== */}
              <h1><i className="fas fa-shield-halved mr-2 text-oliveDark" />Two-Factor Verification</h1>
              <p className="sub">
                {mfaSetup
                  ? 'Set up your authenticator app to finish securing this admin account.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>

              {error && (
                <div className="alert-banner alert-danger">
                  <i className="fas fa-circle-exclamation" />
                  {error}
                </div>
              )}

              {mfaSetup && (
                <div className="mb-5 text-center">
                  <p className="text-sm text-bark/70 mb-3">
                    Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator:
                  </p>
                  {qrCode && (
                    <img src={qrCode} alt="MFA QR code" className="w-40 h-40 mx-auto rounded-soft border border-tan/40 bg-white p-2" />
                  )}
                  {manualEntryKey && (
                    <p className="text-xs text-bark/50 mt-3">
                      Can't scan? Enter this key manually:<br />
                      <span className="font-mono font-semibold text-ink break-all">{manualEntryKey}</span>
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleVerifyCode}>
                <div className="mb-5">
                  <label className="field-label">6-Digit Code</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-key" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="input-field tracking-[0.4em] text-center font-semibold"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>

                <button type="submit" disabled={verifying} className="btn-primary w-full">
                  {verifying ? 'Verifying...' : mfaSetup ? 'Confirm & Enable' : 'Verify & Log In'} <i className="fas fa-arrow-right" />
                </button>
              </form>

              <p className="auth-switch">
                <button type="button" onClick={backToLogin} className="text-oliveDark font-semibold">
                  <i className="fas fa-arrow-left" /> Back to log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
