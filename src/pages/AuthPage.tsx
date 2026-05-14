import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStoredCreds, setHasStoredCreds] = useState(false);
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
        setHasStoredCreds(true);
        // Automatically attempt biometric auth on open if creds exist
        handleBiometricAuth();
      }
    } catch (e) {
      console.error('Error checking stored creds:', e);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const available = await BiometricAuth.checkBiometry();
      if (!available.isAvailable) return;

      const result = await BiometricAuth.authenticate({
        reason: 'Authorize access to HilEX Intelligence',
        cancelTitle: 'Cancel',
      });

      if (result) {
        setLoading(true);
        const { value } = await Preferences.get({ key: 'user_creds' });
        if (value) {
          const { email: storedEmail, password: storedPassword } = JSON.parse(value);
          const { error } = await supabase.auth.signInWithPassword({ 
            email: storedEmail, 
            password: storedPassword 
          });

          if (error) {
            setError(error.message);
            setLoading(false);
          } else {
            navigate('/home', { replace: true });
          }
        }
      }
    } catch (e) {
      console.error('Biometric auth failed:', e);
      setLoading(false);
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
      // Save credentials for future biometric login
      await Preferences.set({
        key: 'user_creds',
        value: JSON.stringify({ email, password })
      });
      navigate('/home', { replace: true });
    }
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

                {hasStoredCreds && !loading && (
                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    className="w-full font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-white text-sm bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    <Fingerprint className="w-5 h-5 text-[#00D8FF]" />
                    <span>Use Face ID</span>
                  </button>
                )}
              </div>
            </form>

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
