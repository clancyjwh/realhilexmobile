import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreColor } from '../utils/format';
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
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);

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
    if (!newSymbol.trim()) return;
    
    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetch('https://hook.us2.make.com/8kuomvnr2exdq8se2dw1hqa5cdgozaoe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          user_id: user.id,
          source: 'mobile'
        })
      });

      setNewSymbol('');
      setShowAddModal(false);
      await fetchWatchlist();
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
              onClick={() => handleCardClick(item.symbol)}
              onTouchStart={() => startPress(item.symbol)}
              onTouchEnd={clearPress}
              onTouchMove={clearPress}
              onContextMenu={(e) => { e.preventDefault(); confirmDelete(item.symbol); }}
              className="rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square shadow-2xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer select-none"
              style={{ backgroundColor: getHeatScoreColor(item.signal) }}
            >
              <div>
                <div className="text-[10px] font-black text-white bg-black/20 px-2 py-1 rounded-lg inline-block uppercase tracking-widest backdrop-blur-sm">
                  {item.symbol}
                </div>
                <h3 className="font-black text-lg text-white leading-tight uppercase italic tracking-tighter drop-shadow-sm mt-3 line-clamp-2">
                  {item.name}
                </h3>
              </div>
              <div className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md">
                {item.signal > 0 ? '+' : ''}{formatScore(item.signal, 1)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-8 shrink-0 pb-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full border-2 border-[#00C853] text-[#00C853] py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#00C853]/5"
        >
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 rounded-[2rem] w-full max-w-sm p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Add to Watchlist</h3>
            
            {adding ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="animate-spin text-[#00C853]" size={32} />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adding Asset...</div>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="space-y-4">
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
                <button 
                  type="submit"
                  disabled={!newSymbol.trim()}
                  className="w-full bg-[#00C853] text-[#0a0a0f] py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
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
