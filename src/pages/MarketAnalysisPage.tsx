import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { getHeatScoreColor, formatScore } from '../utils/format';

export default function MarketAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const question = location.state?.question || 'Unknown Question';
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const analyze = async () => {
      try {
        const response = await fetch('https://hook.us2.make.com/5qbkt4iyi3e52o8auyjssk4bxar6f8ay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_description: question, source: 'mobile' })
        });
        const data = await response.json();
        if (mounted) {
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    };
    analyze();
    return () => { mounted = false; };
  }, [question]);

  if (loading) {
    return (
      <div className="flex-grow bg-[#0a0a0f] text-white min-h-screen flex flex-col justify-center items-center relative p-5">
        <div className="absolute top-0 left-0 w-full p-4 pt-6">
          <button onClick={() => navigate('/markets')} className="p-2 bg-[#12121a] rounded-full text-slate-400 active:bg-white/10 transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#12121a] border border-white/5 shadow-2xl flex items-center justify-center p-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[#00C853]/20 to-transparent opacity-50" />
             <img src="/logo.png" alt="HiLEX" className="w-full h-full object-contain relative z-10" />
          </div>
          <Loader2 className="animate-spin text-[#00C853]" size={32} />
          <div className="text-sm font-black italic tracking-widest text-slate-400 uppercase animate-pulse">Analyzing...</div>
        </div>
      </div>
    );
  }

  // Calculation Logic
  const raw = (
    parseFloat(result?.["News & Sentiment score"] || 0) * 0.25 +
    parseFloat(result?.["Recent Momentum"] || 0) * 0.20 +
    parseFloat(result?.["Expert Consensus Score"] || 0) * 0.20 +
    parseFloat(result?.["Historical Pattern Match"] || 0) * 0.15 +
    parseFloat(result?.["Structural Edge"] || 0) * 0.10 +
    parseFloat(result?.["Time Pressure/Deadline Effect"] || 0) * 0.10
  );
  const signal = Math.max(-1, Math.min(1, raw * 2 - 1));
  const heatscore = parseFloat((signal * 10).toFixed(1));
  const our_probability = parseFloat((((signal + 1) / 2) * 100).toFixed(1));
  
  const polyMatched = result?.polymarket_slug != null;
  const polyProb = result?.polymarket_yes_prob ? parseFloat((result.polymarket_yes_prob * 100).toFixed(1)) : 0;
  const gap = result?.gap ? parseFloat(result.gap.toFixed(1)) : 0;

  return (
    <div className="flex-grow p-4 bg-[#0a0a0f] text-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button onClick={() => navigate('/markets')} className="p-2 bg-[#12121a] rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Market Analysis</h2>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white leading-tight">{question}</h1>
      </div>

      <div className="bg-[#12121a] border border-white/5 rounded-[2rem] p-8 shadow-2xl space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">HeatScore</span>
            <div className="text-5xl font-black italic tracking-tighter" style={{ color: getHeatScoreColor(heatscore) }}>
              {heatscore > 0 ? '+' : ''}{formatScore(heatscore, 1)}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Our Odds</span>
            <div className="text-5xl font-black italic tracking-tighter text-[#00C853]">
              {our_probability}%
            </div>
          </div>
        </div>

        {polyMatched ? (
          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Polymarket</span>
              <div className="text-2xl font-black italic tracking-tighter text-cyan-400">
                {polyProb}% <span className="text-sm font-bold text-cyan-400/50 ml-1">YES</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Gap</span>
              <div className="text-2xl font-black italic tracking-tighter text-white">
                {gap > 0 ? '+' : ''}{gap}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-6 border-t border-white/5 text-center">
            <span className="text-xs font-black italic text-slate-600 uppercase tracking-widest">No Polymarket market found</span>
          </div>
        )}
      </div>
    </div>
  );
}
