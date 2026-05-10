import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreBgColor } from '../utils/format';
import AnalysisModal from './AnalysisModal';

interface WatchlistItem {
  name: string;
  symbol: string;
  signal: number;
  price: number;
  indicators: any;
}

export default function FinancePage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_watchlist')
        .select('symbol, name, signal, price, indicators')
        .eq('user_id', user.id)
        .order('signal', { ascending: false });

      if (data) {
        const sorted = [...data].sort((a, b) => Math.abs(b.signal) - Math.abs(a.signal));
        setItems(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (symbol: string) => {
    const { data: details } = await supabase
      .from('entity_scores')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (details) {
      setSelectedEntity(details);
      
      const { data: finData } = await supabase
        .from('asset_daily_analysis')
        .select('*')
        .eq('symbol', symbol)
        .order('run_date', { ascending: false })
        .limit(1)
        .single();
        
      setFinancialData(finData);
    }
  };

  return (
    <div className="flex-grow p-4 pb-10 overflow-x-hidden flex flex-col min-h-[calc(100vh-80px)]">
      <div className="mb-8 pt-4 shrink-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Hub</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">My Watchlist</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-center p-8">
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Add assets to your watchlist in the HiLEX desktop app to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item.symbol}
              onClick={() => handleCardClick(item.symbol)}
              className="rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center aspect-square shadow-2xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer select-none"
              style={{ backgroundColor: getHeatScoreBgColor(item.signal) }}
            >
              <div className="absolute top-4 left-4 text-[10px] font-black text-white bg-black/20 px-2 py-1 rounded-lg uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-sm">
                {item.symbol}
              </div>
              <div className="space-y-3 mt-4">
                <h3 className="font-black text-2xl text-white leading-tight uppercase italic tracking-tighter drop-shadow-sm">
                  {item.name}
                </h3>
                <div className="text-4xl font-black italic tracking-tighter drop-shadow-md text-white">
                  {item.signal > 0 ? '+' : ''}{formatScore(item.signal, 1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntity && (
        <AnalysisModal 
          entity={selectedEntity} 
          financialData={financialData}
          onClose={() => setSelectedEntity(null)} 
        />
      )}
    </div>
  );
}
