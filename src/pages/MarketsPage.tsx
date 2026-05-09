import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHeatScoreColor, formatScore } from '../utils/format';

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
    navigate('/markets/analyze', { state: { question } });
  };

  return (
    <div className="mb-4">
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 shadow-xl flex justify-between items-center gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-sm text-white leading-snug line-clamp-2">{question}</h3>
          
          <div className="flex items-center gap-4">
            {type === 'pulse' && initialData?.week_change !== undefined && (
              <div className={`flex items-center gap-1 text-[10px] font-black italic ${initialData.direction === 'up' ? 'text-[#00C853]' : 'text-red-500'}`}>
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
          className="bg-[#00C853] text-[#0a0a0f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 min-w-[80px] flex justify-center items-center shrink-0"
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
  
  const [trendingOpen, setTrendingOpen] = useState(false); // Collapsed by default
  const [pulseOpen, setPulseOpen] = useState(true); // Expanded by default
  
  const [trending, setTrending] = useState<any[]>([]);
  const [pulse, setPulse] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: tData, error } = await supabase
      .from('event_forecasting_examples')
      .select('id, question, batch_id')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    console.log('[MarketsPage] Supabase Fetch Data:', tData);
    if (error) {
      console.error('[MarketsPage] Supabase Error:', error);
    }
    
    if (tData && tData.length > 0) {
      const latestBatchId = tData[0].batch_id;

      const trendingFiltered = tData
        .filter(q => q.batch_id === latestBatchId && q.question.startsWith('[TRENDING]'))
        .map(q => ({ ...q, question: q.question.replace('[TRENDING] ', '').replace('[TRENDING]', '') }));
      setTrending(trendingFiltered);

      const pulseFiltered = tData
        .filter(q => q.batch_id === latestBatchId && q.question.startsWith('[MOVER]'))
        .map(q => {
          let parsed = {};
          try {
            const rawJson = q.question.replace('[MOVER] ', '').replace('[MOVER]', '');
            parsed = JSON.parse(rawJson);
          } catch (e) {}
          return { ...q, ...parsed };
        });
      setPulse(pulseFiltered);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate('/markets/analyze', { state: { question: search } });
  };

  return (
    <div className="flex-grow p-5 pb-10 flex flex-col">
      {/* Institutional Search */}
      <form onSubmit={handleSearch} className="relative mb-6 pt-4">
        <div className="absolute left-4 top-[2.2rem] -translate-y-1/2 text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any event or question..."
          className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-[#00C853] text-sm font-medium transition-all text-white placeholder:text-slate-700"
        />
      </form>

      <div className="space-y-6">
        {/* Trending Section */}
        <div>
          <button 
            onClick={() => setTrendingOpen(!trendingOpen)}
            className="w-full flex items-center justify-between p-2 mb-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">✦ Trending Questions</span>
            <ChevronDown size={16} className={`text-slate-700 transition-transform ${trendingOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {trendingOpen && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              {trending.map((q, idx) => (
                <MarketPulseCard key={idx} question={q.question} initialData={q} type="trending" />
              ))}
            </div>
          )}
        </div>

        {/* Pulse Section */}
        <div>
          <button 
            onClick={() => setPulseOpen(!pulseOpen)}
            className="w-full flex items-center justify-between p-2 mb-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">⚡ Market Pulse</span>
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
      </div>
    </div>
  );
}
