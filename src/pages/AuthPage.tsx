import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      setError('Check your email for the confirmation link.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center px-8 pt-24 font-sans">
      {/* Logo & Brand */}
      <div className="flex flex-col items-center gap-4 mb-16">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
          <img src="/logo.png" alt="" className="w-10 h-10 object-contain opacity-90" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">HiLEX</h1>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-sm flex border-b border-white/5 mb-10">
        <button 
          onClick={() => { setActiveTab('login'); setError(null); }}
          className={`flex-1 pb-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'login' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-600'}`}
        >
          Log In
        </button>
        <button 
          onClick={() => { setActiveTab('signup'); setError(null); }}
          className={`flex-1 pb-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'signup' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-600'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Forms */}
      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:outline-none focus:border-[#00C853] transition-colors text-sm placeholder:text-slate-700"
            />
            <input 
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:outline-none focus:border-[#00C853] transition-colors text-sm placeholder:text-slate-700"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#00C853] hover:bg-[#00C853]/90 text-[#0a0a0f] py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(0,200,83,0.2)]"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <input 
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:outline-none focus:border-[#00C853] transition-colors text-sm placeholder:text-slate-700"
            />
            <input 
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:outline-none focus:border-[#00C853] transition-colors text-sm placeholder:text-slate-700"
            />
            <input 
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:outline-none focus:border-[#00C853] transition-colors text-sm placeholder:text-slate-700"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#00C853] hover:bg-[#00C853]/90 text-[#0a0a0f] py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(0,200,83,0.2)]"
            >
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
