import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
  const { register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referredByCode, setReferredByCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(null);

  const googleBtnRef = useRef(null);

  // Fetch Public Config (Google Client ID, Enabled flag)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load public config:', err);
      }
    };
    fetchConfig();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Google GSI Button Mount Handler
  useEffect(() => {
    if (config?.googleAuthEnabled && config?.googleClientId && window.google) {
      const handleGoogleCallback = async (response) => {
        setSubmitting(true);
        setError('');
        try {
          await loginWithGoogle(response.credential);
          navigate('/');
        } catch (err) {
          setError(err.message || 'Google signup authentication failed.');
        } finally {
          setSubmitting(false);
        }
      };

      try {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: handleGoogleCallback,
          auto_select: false
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '320',
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.error('Google accounts SDK initialize error:', err);
      }
    }
  }, [config, loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setSubmitting(false);
    setError('');
    setSubmitting(true);
    try {
      await register(email, password, 'user', referredByCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '40px 24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            Register Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Join Himalix Labs. Enter a referral code to claim rewards.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-light fa-sharp fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={submitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Referral Inviter Code (Optional)
            </label>
            <input
              type="text"
              value={referredByCode}
              onChange={(e) => setReferredByCode(e.target.value)}
              placeholder="HMX-REF-XXXXXX"
              disabled={submitting}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: '8px' }}>
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-light fa-sharp fa-spinner fa-spin"></i> Registering...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {config?.googleAuthEnabled && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0',
              color: 'var(--border-color)',
              fontSize: '12px'
            }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <span style={{ padding: '0 12px', color: 'var(--text-secondary)' }}>OR</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={googleBtnRef} id="google-signin-btn"></div>
            </div>
          </>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/signin" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
