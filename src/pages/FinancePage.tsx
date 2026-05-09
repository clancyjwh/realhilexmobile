import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreColor } from '../utils/format';

interface WatchlistItem {
  name: string;
  symbol: string;
  signal: number;
  price: number;
}

export default function FinancePage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('symbol, name, signal, price')
        .eq('user_id', user.id);

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

  return (
    <div className="flex-grow p-5 pb-10 flex flex-col">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Hub</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">My Watchlist</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 flex-grow">
          {[1, 2].map(i => (
            <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-slate-600 font-bold italic text-sm">Your watchlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {items.map((item, idx) => (
            <div key={idx} className="bg-[#12121a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-[4/3] shadow-xl">
              <div className="space-y-1">
                <div className="text-[8px] font-black text-[#00C853] bg-[#00C853]/10 px-2 py-1 rounded inline-block uppercase tracking-widest border border-[#00C853]/20">
                  {item.symbol}
                </div>
                <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight uppercase italic tracking-tight pt-1">
                  {item.name}
                </h3>
              </div>
              <div className="text-2xl font-black italic tracking-tighter" style={{ color: getHeatScoreColor(item.signal) }}>
                {item.signal > 0 ? '+' : ''}{formatScore(item.signal, 1)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full border-2 border-[#00C853] text-[#00C853] py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-auto">
        <Plus size={16} />
        Add Asset
      </button>
    </div>
  );
}
