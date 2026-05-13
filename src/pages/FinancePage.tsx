import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreBgColor, getSignalColors } from '../utils/format';
import WatchlistDetailModal from './WatchlistDetailModal';

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
        .select('symbol, name, signal, price, indicators, optimized_parameters')
        .eq('user_id', user.id)
        .order('signal', { ascending: false });

      if (data) {
        const sorted = [...data]
          .map(item => ({ ...item, signal: Number(item.signal) || 0 }))
          .sort((a, b) => b.signal - a.signal);
        setItems(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item: any) => {
    setSelectedEntity(item);
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
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item, index) => {
            const colors = getSignalColors(item.signal);
            return (
              <button 
                key={item.symbol}
                onClick={() => handleCardClick(item)}
                className={`${colors.bg} ${colors.border} border-2 rounded-lg p-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-2 w-full">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className={`${colors.subtext} text-xs font-bold`}>#{index + 1}</div>
                    <span className={`${colors.subtextDark} text-[10px] font-medium truncate`}>WATCHLIST</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full">
                  <div className={`${colors.isGold ? 'text-black' : 'text-white'} text-xl font-bold truncate pr-2`}>
                    {item.symbol}
                  </div>
                  <div className={`text-3xl font-bold ${colors.text} flex-shrink-0`}>
                    {item.signal > 0 ? '+' : ''}{formatScore(item.signal, 1)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntity && (
        <WatchlistDetailModal 
          item={selectedEntity} 
          onClose={() => setSelectedEntity(null)} 
        />
      )}
    </div>
  );
}
