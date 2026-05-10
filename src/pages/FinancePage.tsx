import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
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

export default function FinancePage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotLimit, setSlotLimit] = useState(0);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
        
      const rawTier = profile?.subscription_tier;
      const tier = (rawTier || 'Pro Tier').toLowerCase();
      
      let limit = 0;
      if (tier.includes('pro') || tier.includes('premium') || tier.includes('finance')) limit = 6;
      else if (tier.includes('free')) limit = 1;
      
      setSlotLimit(limit);

      const { data } = await supabase
        .from('user_watchlist')
        .select('symbol, name, signal, price, indicators, optimized_parameters')
        .eq('user_id', user.id)
        .order('signal', { ascending: false }); // order by abs(signal) desc is harder in raw supabase JS without rpc, so we fetch and sort in JS

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newName.trim()) return;
    
    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const res = await fetch('https://avijzlkdukanneylvtrd.supabase.co/functions/v1/user-watchlist-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ticker: newSymbol.trim().toUpperCase(),
          name: newName.trim(),
          user_id: user.id,
          source: 'mobile'
        })
      });

      const responseData = await res.json();

      setNewSymbol('');
      setNewName('');
      setShowAddModal(false);
      await fetchWatchlist();
      
      // Auto-open detail modal if webhook returns the item data
      if (responseData?.data) {
        setSelectedEntity(responseData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async (symbol: string) => {
    if (window.confirm(`Remove ${symbol} from watchlist?`)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
          
        fetchWatchlist();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCardClick = (item: any) => {
    setSelectedEntity(item);
  };

  // Mobile long press logic
  let pressTimer: any;
  const startPress = (symbol: string) => {
    pressTimer = setTimeout(() => {
      confirmDelete(symbol);
    }, 600);
  };
  const clearPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
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
        <div className="flex-grow flex items-center justify-center">
          <p className="text-slate-500 font-bold italic text-sm">Your watchlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item.symbol}
              onClick={() => handleCardClick(item)}
              onTouchStart={() => startPress(item.symbol)}
              onTouchEnd={clearPress}
              onTouchMove={clearPress}
              onContextMenu={(e) => { e.preventDefault(); confirmDelete(item.symbol); }}
              className="rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square shadow-2xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer select-none"
              style={{ backgroundColor: getHeatScoreBgColor(item.signal) }}
            >
              <div className="relative z-10 flex justify-between items-start">
                <div className="text-[10px] font-black text-white bg-black/20 px-3 py-1.5 rounded-xl inline-block uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-sm">
                  {item.symbol}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); confirmDelete(item.symbol); }}
                  className="p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="text-5xl font-black italic tracking-tighter drop-shadow-lg relative z-10 text-white">
                {item.signal > 0 ? '+' : ''}{formatScore(item.signal, 1)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-8 shrink-0 pb-4">
        {items.length >= slotLimit ? (
          <div className="w-full border-2 border-slate-700 text-slate-500 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 bg-slate-800/20">
            Slot Limit Reached ({items.length}/{slotLimit})
          </div>
        ) : (
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-[#00C853] text-[#00C853] py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#00C853]/5"
          >
            <Plus size={16} />
            Add Asset ({slotLimit - items.length} slots left)
          </button>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0a0f]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#12121a] border border-white/10 rounded-[2rem] w-full max-w-sm p-6 relative shadow-2xl overflow-hidden">
            <button 
              onClick={() => !adding && setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 z-20"
              disabled={adding}
            >
              <X size={20} />
            </button>
            
            {adding ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00C853]/20 to-transparent opacity-50" />
                  <Loader2 className="animate-spin text-[#00C853] relative z-10" size={36} />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm font-black italic text-white uppercase tracking-widest">Deploying Agent...</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generating Initial Analysis</div>
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Add to Watchlist</h3>
                <form onSubmit={handleAddSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Ticker Symbol</label>
                    <input
                      type="text"
                      required
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g. AAPL, BTC"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#00C853] transition-colors uppercase"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Asset Full Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Apple Inc, Bitcoin"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#00C853] transition-colors"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newSymbol.trim() || !newName.trim()}
                    className="w-full bg-[#00C853] text-[#0a0a0f] py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-2"
                  >
                    Deploy Engine
                  </button>
                </form>
              </div>
            )}
          </div>
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
