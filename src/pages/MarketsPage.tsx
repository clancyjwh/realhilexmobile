import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHeatScoreColor, formatScore } from '../utils/format';

interface MarketData {
  question: string;
  our_signal_score: number;
  polymarket_yes_prob: number;
  gap: number;
  misprice_flag: boolean;
  week_change?: number;
}

const ResultCard = ({ data, isExpanded = true }: { data: MarketData; isExpanded?: boolean }) => {
  const heatScore = data.our_signal_score * 10;
  const ourProb = ((data.our_signal_score + 1) / 2) * 100;
  const polyProb = data.polymarket_yes_prob * 100;

  return (
    <div className={`bg-[#12121a] border border-white/5 rounded-2xl p-5 mb-4 shadow-2xl transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 py-0 border-0'}`}>
      <div className="space-y-6">
        {isExpanded && <h3 className="font-bold text-base text-white leading-snug">{data.question}</h3>}
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">HeatScore</span>
            <div className="text-3xl font-black italic tracking-tighter" style={{ color: getHeatScoreColor(heatScore) }}>
              {heatScore > 0 ? '+' : ''}{formatScore(heatScore, 1)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Probability</span>
            <div className="text-3xl font-black italic tracking-tighter text-[#00C853]">
              {formatScore(ourProb, 0)}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Polymarket</span>
              <span className="text-sm font-black italic text-cyan-400">{formatScore(polyProb, 0)}% YES</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Gap</span>
              <span className="text-sm font-black italic text-white">{formatScore(data.gap, 1)}</span>
            </div>
          </div>
          {data.misprice_flag && (
            <div className="bg-yellow-400 text-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <span>⚡</span> MISPRICE
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MarketPulseCard = ({ question, initialData, type = 'trending' }: { question: string; initialData?: any; type?: 'trending' | 'pulse' }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketData | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://hook.us2.make.com/5qbkt4iyi3e52o8auyjssk4bxar6f8ay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_description: question, source: 'mobile' })
      });
      const data = await response.json();
      setAnalysis({ question, ...data });
    } catch (err) {
      // Fire-and-forget: swallow errors as requested
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 shadow-xl flex justify-between items-center gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-sm text-white leading-snug line-clamp-2">{question}</h3>
          
          <div className="flex items-center gap-4">
            {type === 'pulse' && initialData?.week_change !== undefined && (
              <div className={`flex items-center gap-1 text-[10px] font-black italic ${initialData.week_change > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                {initialData.week_change > 0 ? '▲' : '▼'} {Math.abs(initialData.week_change * 100).toFixed(1)}%
              </div>
            )}
            <div className="text-cyan-400 text-[10px] font-black italic">
              {( (initialData?.polymarket_yes_prob || initialData?.yes_prob || 0) * 100).toFixed(0)}% YES
            </div>
          </div>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-[#00C853] text-[#0a0a0f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 min-w-[80px] flex justify-center items-center"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'ANALYZE'}
        </button>
      </div>
      
      {analysis && <ResultCard data={analysis} />}
    </div>
  );
};

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<MarketData | null>(null);
  
  const [trendingOpen, setTrendingOpen] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(true);
  
  const [trending, setTrending] = useState<any[]>([]);
  const [pulse, setPulse] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: tData } = await supabase
      .from('event_forecasting_examples')
      .select('*')
      .eq('active', true);
    
    if (tData) {
      const filtered = tData
        .filter(q => q.question.startsWith('[TRENDING]'))
        .map(q => ({ ...q, question: q.question.replace('[TRENDING] ', '').replace('[TRENDING]', '') }))
        .slice(0, 5);
      setTrending(filtered);
    }

    const { data: pData } = await supabase
      .from('prediction_market_movers')
      .select('*')
      .eq('active', true);
    
    if (pData) {
      const sorted = [...pData].sort((a, b) => Math.abs(b.week_change || 0) - Math.abs(a.week_change || 0));
      setPulse(sorted);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch('https://hook.us2.make.com/5qbkt4iyi3e52o8auyjssk4bxar6f8ay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_description: search, source: 'mobile' })
      });
      const data = await response.json();
      setSearchResult({ question: search, ...data });
    } catch (err) {
      // Fire-and-forget
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="flex-grow p-5 pb-10 flex flex-col">
      {/* Institutional Search */}
      <form onSubmit={handleSearch} className="relative mb-8 pt-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {searchLoading ? <Loader2 size={18} className="animate-spin text-[#00C853]" /> : <Search size={18} />}
        </div>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any event or question..."
          className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-[#00C853] text-sm font-medium transition-all text-white placeholder:text-slate-700"
        />
      </form>

      {/* Search Result Card */}
      {searchResult && <ResultCard data={searchResult} />}

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
              {pulse.map((q, idx) => (
                <MarketPulseCard key={idx} question={q.question} initialData={q} type="pulse" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
