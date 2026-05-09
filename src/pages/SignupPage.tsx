import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', desc: 'Basic trends access' },
  { id: 'sports', name: 'Sports', price: '$29', desc: 'Full sports intelligence' },
  { id: 'finance', name: 'Finance', price: '$49', desc: 'Advanced financial tools' },
  { id: 'prediction', name: 'Prediction', price: '$79', desc: 'Alpha signals & markets' },
  { id: 'premium', name: 'Premium', price: '$1000', desc: 'Full institutional access' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'Bespoke solutions' },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            plan: selectedPlan,
          },
        },
      });

      if (signUpError) throw signUpError;
      
      if (data.user && !data.session) {
        setError('Confirmation email sent. Please verify to login.');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col p-6 font-sans text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step === 1 ? navigate('/login') : setStep(1)} className="p-2 -ml-2 text-slate-400 active:text-[#00D8FF]">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#00D8FF]' : 'bg-white/10'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#00D8FF]' : 'bg-white/10'}`} />
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup} className="flex-grow flex flex-col">
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00D8FF]"
                placeholder="name@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00D8FF]"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00D8FF]"
                placeholder="Repeat password"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Select Subscription Tier</label>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[50vh] pr-2">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                    selectedPlan === plan.id 
                      ? 'border-[#00D8FF] bg-[#00D8FF]/10' 
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-slate-400">{plan.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#00D8FF]">{plan.price}</span>
                      <p className="text-[10px] text-slate-500">/month</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 mb-8">
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D8FF] text-black font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(0,216,255,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              step === 1 ? 'Continue to Plans' : 'Complete Registration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
