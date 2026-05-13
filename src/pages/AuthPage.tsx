import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home', { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
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
        style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.1) 0%, transparent 65%)', filter: 'blur(60px)' }}
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
                <img src="/logo.png" alt="HiLEX Logo" className="w-20 h-20 object-contain rounded-xl" />
              </div>
            </div>

            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white text-center mb-2">
              Welcome to HiLEX
            </h1>
            <p className="text-slate-500 text-center mb-10 font-bold uppercase tracking-[0.2em] text-[10px]">
              Hylex Intelligence
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

              <button
                type="submit"
                disabled={loading}
                className="w-full font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-[#0a0a0f] text-sm mt-4 shadow-[0_0_30px_rgba(0,216,255,0.2)]"
                style={{
                  background: loading ? 'rgba(0,216,255,0.5)' : '#00D8FF',
                }}
              >
                {loading ? (
                  <span className="animate-pulse">Authorizing...</span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Access Terminal</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
              <a
                href="https://landing.hilex.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-[#00D8FF] text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
              >
                <Eye className="w-4 h-4" />
                Hylex Portal
              </a>

              <p className="text-slate-800 text-[8px] font-black uppercase tracking-[0.3em] text-center italic">
                HiLEX Mobile Intelligence v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
