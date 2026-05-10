import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreBgColor } from '../utils/format';
import WatchlistDetailModal from './WatchlistDetailModal';

interface WatchlistItem {
  name: string;
  symbol: string;
  signal: number;
  price: number;
  indicators: any;
}

const getSignalColors = (signal: number) => {
  if (signal >= 9) return { bg: 'bg-[linear-gradient(145deg,#FFFDF5_0%,#FFF3CC_35%,#EBD48E_70%,#C9A43B_100%)] bg-[length:200%_200%] shadow-[0_0_20px_rgba(201,164,59,0.8)]', border: 'border-yellow-400', text: 'text-black' };
  if (signal >= 7) return { bg: 'bg-green-900', border: 'border-green-700', text: 'text-green-300' };
  if (signal >= 4) return { bg: 'bg-green-700', border: 'border-green-600', text: 'text-green-200' };
  if (signal >= 1) return { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-100' };
  if (signal > -1) return { bg: 'bg-slate-600', border: 'border-slate-500', text: 'text-slate-200' };
  if (signal >= -4) return { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-100' };
  if (signal >= -7) return { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-100' };
  if (signal <= -9) return { bg: 'bg-gradient-to-br from-red-900 to-red-950', border: 'border-red-600', text: 'text-red-200' };
  return { bg: 'bg-red-900', border: 'border-red-700', text: 'text-red-300' };
};

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
                    <div className="text-white/60 text-xs font-bold">#{index + 1}</div>
                    <span className="text-white/70 text-[10px] font-medium truncate">WATCHLIST</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full">
                  <div className="text-white text-xl font-bold truncate pr-2">
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
