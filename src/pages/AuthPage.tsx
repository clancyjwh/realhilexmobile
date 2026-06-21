import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Preferences } from '@capacitor/preferences';
import { AppleSignIn } from '@capawesome/capacitor-apple-sign-in';
import { ensureUserProfile } from '../utils/profileUtils';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home', { replace: true });
      } else {
        // 2. Check for stored credentials to show biometric option
        checkStoredCredentials();
      }
    });
  }, [navigate]);

  const checkStoredCredentials = async () => {
    try {
      const { value } = await Preferences.get({ key: 'user_creds' });
      if (value) {
        const creds = JSON.parse(value);
        if (creds.email) setEmail(creds.email);
        if (creds.password) setPassword(creds.password);
        setRememberMe(true);
      }
    } catch (e) {
      console.error('Error checking stored creds:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      if (rememberMe) {
        // Save credentials for future login
        await Preferences.set({
          key: 'user_creds',
          value: JSON.stringify({ email, password })
        });
      } else {
        await Preferences.remove({ key: 'user_creds' });
      }
      navigate('/home', { replace: true });
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await AppleSignIn.signIn({
        scopes: ['EMAIL', 'FULL_NAME'],
      });

      if (!result.idToken) {
        throw new Error('Apple authorization failed: No identity token returned.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: result.idToken,
      });

      if (signInError) throw signInError;

      if (data?.session?.user) {
        const user = data.session.user;
        
        // Ensure profile exists using the exact same logic as Google
        await ensureUserProfile(user.id);

        // Apple only provides name information during the first authorization
        const givenName = result.givenName;
        const familyName = result.familyName;
        if (givenName || familyName) {
          const fullName = `${givenName || ''} ${familyName || ''}`.trim();
          if (fullName) {
            await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
            await supabase.from('users').update({ full_name: fullName }).eq('id', user.id);
          }
        }

        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      console.error('Apple Sign In Error:', err);
      setError(err?.message || 'Failed to authenticate with Apple.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setLoading(true);
    window.location.href = `/api/auth/google?plan=premium`;
  };

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden font-sans"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Cyan glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,216,255,0.1) 0%, transparent 65%)', filter: 'blur(60px)' }}
      />

      <div className="flex items-center justify-center p-6 min-h-screen relative z-10">
        <div className="w-full max-w-sm">
          {/* Glass card */}
          <div className="rounded-3xl shadow-2xl p-8 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center mb-10">
              <div className="p-1 rounded-2xl overflow-hidden" style={{ background: 'rgba(0,216,255,0.05)', border: '1px solid rgba(0,216,255,0.1)', boxShadow: '0 0 30px rgba(0,216,255,0.05)' }}>
                <img src="/logo.png" alt="HilEX Logo" className="w-20 h-20 object-contain rounded-xl" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
              Welcome to HilEX
            </h1>
            <p className="text-slate-400 text-center mb-8 font-mono text-sm">
              Optimized Trends Platform
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00D8FF]/30 focus:border-[#00D8FF]/30 transition-all text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00D8FF]/30 focus:border-[#00D8FF]/30 transition-all text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl p-4 bg-red-500/5 border border-red-500/10">
                  <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00D8FF] focus:ring-[#00D8FF]/30 accent-[#00D8FF]"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-xs text-slate-400 font-medium">
                  Remember me
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-[#0a0a0f] text-sm shadow-[0_0_30px_rgba(0,216,255,0.2)]"
                  style={{
                    background: loading ? 'rgba(0,216,255,0.5)' : '#00D8FF',
                  }}
                >
                  {loading ? (
                    <span className="animate-pulse text-[10px]">Authorizing...</span>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Access Terminal</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#020617] px-3 text-slate-500 rounded-md py-0.5 border border-white/5">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full font-semibold py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-white border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                {loading ? (
                  <span className="animate-pulse text-[10px] uppercase tracking-widest font-black">Authorizing...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.71-1.16 1.85-1.01 2.96 1.1.09 2.23-.55 2.96-1.41z" />
                    </svg>
                    <span>Sign in with Apple</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full font-semibold py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-white border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                {loading ? (
                  <span className="animate-pulse text-[10px] uppercase tracking-widest font-black">Authorizing...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.67 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#00D8FF] hover:text-white text-sm font-medium transition-colors duration-200"
              >
                Don't have an account? Create one
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
              <p className="text-slate-800 text-[8px] font-black uppercase tracking-[0.3em] text-center italic">
                HilEX Mobile Intelligence v1.2
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
