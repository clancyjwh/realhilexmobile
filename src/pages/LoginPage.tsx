import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col p-6 font-sans text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#00D8FF]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#00D8FF]/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header / Logo */}
      <div className="flex flex-col items-center mt-12 mb-10">
        <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 p-4 mb-4 backdrop-blur-md shadow-2xl">
          <img src="/logo.png" alt="HiLEX" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">HiLEX</h1>
        <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-mono">Mobile App</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-6 flex-grow">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00D8FF] focus:ring-1 focus:ring-[#00D8FF] transition-all"
            placeholder="name@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00D8FF] focus:ring-1 focus:ring-[#00D8FF] transition-all"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 active:text-[#00D8FF]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm animate-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00D8FF] text-black font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(0,216,255,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              Sign In
            </>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-[#00D8FF] text-sm font-medium"
          >
            Forgot your password?
          </button>
        </div>
      </form>

      {/* Footer Links */}
      <div className="pb-8 space-y-4">
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="w-full py-4 border border-white/10 rounded-xl font-medium text-slate-300 active:bg-white/5"
        >
          Don't have an account? <span className="text-[#00D8FF]">Sign Up</span>
        </button>
      </div>
    </div>
  );
}
