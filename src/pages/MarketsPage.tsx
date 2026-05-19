import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2, Newspaper } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHeatScoreColor, formatScore, formatMarketQuestion } from '../utils/format';

interface MarketData {
  question: string;
  our_signal_score: number;
  polymarket_yes_prob: number;
  gap: number;
  polymarket_matched: boolean;
}

const MarketPulseCard = ({ question, initialData, type = 'trending' }: { question: string; initialData?: any; type?: 'trending' | 'pulse' }) => {
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate('/markets/analyze', { state: { question, slug: initialData?.slug || null } });
  };

  return (
    <div className="mb-4">
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 shadow-xl flex justify-between items-center gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-sm text-white leading-snug line-clamp-2">{question}</h3>
          
          <div className="flex items-center gap-4">
            {type === 'pulse' && initialData?.week_change !== undefined && (
              <div className={`flex items-center gap-1 text-[10px] font-black italic ${initialData.direction === 'up' ? 'text-[#00D8FF]' : 'text-red-500'}`}>
                {initialData.direction === 'up' ? '▲' : '▼'} {Math.abs(initialData.week_change * 100).toFixed(1)}%
              </div>
            )}
            {type === 'pulse' && initialData?.yes_prob !== undefined && (
              <div className="text-cyan-400 text-[10px] font-black italic">
                {(initialData.yes_prob * 100).toFixed(1)}% YES
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleAnalyze}
          className="bg-[#00D8FF] text-[#0a0a0f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 min-w-[80px] flex justify-center items-center shrink-0"
        >
          ANALYZE
        </button>
      </div>
    </div>
  );
};

export default function MarketsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const [pulseOpen, setPulseOpen] = useState(true); // Expanded by default
  
  const [pulse, setPulse] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('event_forecasting_examples')
      .select('id, question, batch_id, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('[MarketsPage] Supabase Fetch Data:', data);
    if (error) {
      console.error('[MarketsPage] Supabase Error:', error);
    }

    if (data && data.length > 0) {
      const trendingArr: any[] = [];
      const moversArr: any[] = [];

      data.forEach(row => {
        const q = row.question || '';
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(q);
          // If it has a slug it's a mover
          if (parsed.slug) {
            moversArr.push({
              id: row.id,
              question: parsed.question,
              slug: parsed.slug,
              yes_prob: parseFloat(parsed.yes_prob) || 0,
              week_change: parseFloat(parsed.week_change) || 0,
              direction: parsed.direction || 'up'
            });
          } else if (parsed.question) {
            // Has question but no slug - treat as trending
            trendingArr.push({
              id: row.id,
              question: parsed.question
            });
          }
        } catch(e) {
          // Plain string - treat as trending question
          if (q.length > 5) {
            trendingArr.push({
              id: row.id,
              question: q
            });
          }
        }
      });
      
      // Deduplicate to prevent repeating cards
      const uniqueMovers: any[] = [];
      const seen = new Set();
      
      for (const mover of moversArr) {
        const identifier = mover.slug || mover.question;
        if (!seen.has(identifier)) {
          seen.add(identifier);
          uniqueMovers.push(mover);
        }
      }

      console.log('Movers:', uniqueMovers.length);
      setPulse(uniqueMovers);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate('/markets/analyze', { state: { question: search, slug: null } });
  };

  return (
    <div className="flex-grow p-5 pb-10 flex flex-col">
      {/* Header */}
      <div className="mb-6 pt-4 shrink-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Prediction Hub</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Markets</h1>
      </div>

      {/* Institutional Search */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute left-4 top-[2.2rem] -translate-y-1/2 text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any event or question..."
          className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-[#00D8FF] text-sm font-medium transition-all text-white placeholder:text-slate-700"
        />
      </form>

      <div className="space-y-6">


        {/* Pulse Section */}
        <div>
          <button 
            onClick={() => setPulseOpen(!pulseOpen)}
            className="w-full flex items-center justify-between p-2 mb-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">⚡ Trending on Polymarket</span>
            <ChevronDown size={16} className={`text-slate-700 transition-transform ${pulseOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {pulseOpen && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              {pulse.length === 0 ? (
                <div className="text-center text-slate-500 font-bold italic py-4 text-[10px] uppercase tracking-widest">No market movers available</div>
              ) : (
                pulse.map((q, idx) => (
                  <MarketPulseCard key={idx} question={q.question} initialData={q} type="pulse" />
                ))
              )}
            </div>
          )}
        </div>

        {/* Large AI News Button */}
        <div className="mt-8 mb-4">
          <button 
            onClick={() => navigate('/newsfeed/predictions')}
            className="w-full flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-[#00D8FF]/20 to-transparent border border-[#00D8FF]/30 active:scale-[0.98] transition-transform relative overflow-hidden group shadow-[0_0_20px_rgba(0,216,255,0.15)]"
          >
            <div className="absolute inset-0 bg-[#00D8FF]/5 group-active:bg-[#00D8FF]/10 transition-colors" />
            <div className="relative z-10 flex flex-col items-start gap-1">
              <h3 className="text-lg font-black italic uppercase tracking-widest text-white">AI Newsfeed</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D8FF]">Market Intelligence</span>
            </div>
            <div className="relative z-10 bg-[#00D8FF] p-3 rounded-full shadow-[0_0_15px_rgba(0,216,255,0.5)]">
              <Newspaper className="w-6 h-6 text-black" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
