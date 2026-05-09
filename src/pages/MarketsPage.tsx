import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MarketCardProps {
  question: string;
  week_change: number;
  yes_prob: number;
}

const MarketCard = ({ question, week_change, yes_prob }: MarketCardProps) => {
  const isUp = week_change > 0;

  const handleAnalyze = () => {
    fetch('https://hook.us2.make.com/5qbkt4iyi3e52o8auyjssk4bxar6f8ay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_description: question,
        source: 'mobile'
      })
    }).catch(() => {});
  };

  return (
    <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 mb-4 shadow-xl">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-4">
          <h3 className="font-bold text-base text-white leading-snug">{question}</h3>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-1 font-black text-lg italic ${isUp ? 'text-[#00C853]' : 'text-red-500'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(week_change * 100).toFixed(1)}%
            </div>
            <div className="text-[#00C853] font-black text-lg italic">
              {(yes_prob * 100).toFixed(0)}% YES
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleAnalyze}
          className="bg-[#00C853] text-[#0a0a0f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(0,200,83,0.15)]"
        >
          ANALYZE
        </button>
      </div>
    </div>
  );
};

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [trendingOpen, setTrendingOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(true);
  
  const [trending, setTrending] = useState<any[]>([]);
  const [pulse, setPulse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('event_forecasting_examples').select('*').eq('active', true),
        supabase.from('prediction_market_movers').select('*').eq('active', true).order('week_change', { ascending: false })
      ]);

      setTrending(tRes.data || []);
      setPulse(pRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = (list: any[]) => {
    return list.filter(q => q.question.toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <div className="flex-grow p-5 pb-10">
      {/* Search Bar */}
      <div className="relative mb-8 pt-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets..."
          className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-[#00C853] text-sm font-medium transition-all"
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Trending Section */}
        <div>
          <button 
            onClick={() => setTrendingOpen(!trendingOpen)}
            className="w-full flex items-center justify-between p-4 bg-[#12121a] border border-white/5 rounded-2xl active:bg-white/5 transition-all"
          >
            <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Trending Questions</span>
            <ChevronDown size={20} className={`text-slate-600 transition-transform duration-300 ${trendingOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {trendingOpen && (
            <div className="pt-4 animate-in slide-in-from-top-2 duration-300">
              {filterQuestions(trending).map((q, idx) => (
                <MarketCard 
                  key={idx}
                  question={q.question}
                  week_change={q.week_change || 0}
                  yes_prob={q.yes_prob || 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pulse Section */}
        <div>
          <button 
            onClick={() => setPulseOpen(!pulseOpen)}
            className="w-full flex items-center justify-between p-4 bg-[#12121a] border border-white/5 rounded-2xl active:bg-white/5 transition-all"
          >
            <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Market Pulse</span>
            <ChevronDown size={20} className={`text-slate-600 transition-transform duration-300 ${pulseOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {pulseOpen && (
            <div className="pt-4 animate-in slide-in-from-top-2 duration-300">
              {filterQuestions(pulse).map((q, idx) => (
                <MarketCard 
                  key={idx}
                  question={q.question}
                  week_change={q.week_change || 0}
                  yes_prob={q.yes_prob || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
