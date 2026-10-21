// client/src/pages/Register.tsx
import { useState, useContext } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UWLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#6366f1"/>
      </linearGradient>
    </defs>
    <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" fill="url(#rg1)" opacity="0.9"/>
    <path d="M16 7L23 11V19L16 23L9 19V11L16 7Z" fill="rgba(255,255,255,0.08)"/>
    <path d="M11 12V18.5C11 19.88 12.12 21 13.5 21C14.88 21 16 19.88 16 18.5V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 12V18.5C16 19.88 17.12 21 18.5 21C19.88 21 21 19.88 21 18.5V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M11 12H21" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round"/>
    <circle cx="16" cy="10" r="1.5" fill="url(#rg2)"/>
  </svg>
);

const FieldIcon = ({ icon }: { icon: 'user' | 'email' | 'lock' }) => {
  const icons = {
    user: <><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 10-16 0"/></>,
    email: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[icon]}
    </svg>
  );
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const isError = status && (status.toLowerCase().includes('fail') || status.toLowerCase().includes('exist') || status.toLowerCase().includes('error'));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      auth?.login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (error: any) {
      setStatus(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setStatus('');
    setGoogleLoading(true);

    try {
      const { getSupabaseClient } = await import('../services/supabase');
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google Auth Error:', error.message);
        setStatus(`Google sign-in failed: ${error.message}`);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      setStatus(
        `Google sign-in failed: ${
          error instanceof Error
            ? error.message
            : 'Please try again.'
        }`
      );
      setGoogleLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px 10px 38px',
    background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fafafa', fontSize: '13px',
    fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 150ms, box-shadow 150ms',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '700px', height: '700px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: '30%', left: '50%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'rgba(18,18,20,0.80)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '20px', padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'slideUp 300ms cubic-bezier(0.34,1.56,0.64,1) both',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: '12px' }}>
          <div style={{
            width: '64px', height: '64px', background: 'rgba(99,102,241,0.12)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(99,102,241,0.25)',
          }}>
            <UWLogo size={40} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
              Create your account
            </h1>
            <p style={{ fontSize: '13px', color: '#71717a' }}>
              Join your team on Unified Workspace
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>Full name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><FieldIcon icon="user"/></span>
              <input type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><FieldIcon icon="email"/></span>
              <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><FieldIcon icon="lock"/></span>
              <input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ ...inputStyle, paddingRight: '38px' }}
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Status message */}
          {status && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: isError ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)',
              border: `1px solid ${isError ? 'rgba(239,68,68,0.20)' : 'rgba(34,197,94,0.20)'}`,
              color: isError ? '#f87171' : '#4ade80',
              fontSize: '12px', fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isError ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> : <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
              </svg>
              {status}
            </div>
          )}

          <button type="submit" disabled={loading || googleLoading}
            style={{
              width: '100%', padding: '11px 0', marginTop: '4px',
              background: loading || googleLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, fontFamily: "'Inter', sans-serif",
              cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
              boxShadow: loading || googleLoading ? 'none' : '0 2px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
              transition: 'all 200ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
            onMouseEnter={(e) => { if (!loading && !googleLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading || googleLoading ? 'none' : '0 2px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.12)'; }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Creating account…
              </>
            ) : 'Create account'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          margin: '20px 0', color: '#52525b', fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
          OR CONTINUE WITH
          <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          style={{
            width: '100%', padding: '11px 0',
            background: '#fff', color: '#18181b',
            border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600, fontFamily: "'Inter', sans-serif",
            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
            opacity: loading || googleLoading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
          }}
        >
          {googleLoading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Connecting to Google…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.25 5.48-4.73 7.18l7.63 5.91c4.46-4.13 7.17-10.21 7.17-17.56Z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.89l-7.63-5.91c-2.13 1.43-4.86 2.27-8.28 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div style={{
          marginTop: '24px', paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center', fontSize: '13px', color: '#71717a',
          fontFamily: "'Inter', sans-serif",
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
          >
            Sign in
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}