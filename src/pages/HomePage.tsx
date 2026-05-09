import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreColor } from '../utils/format';

interface AssetSignal {
  name: string;
  badge: string;
  score: number;
}

export default function HomePage() {
  const [signals, setSignals] = useState<AssetSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      // 1. Query asset_daily_analysis
      const { data: assets } = await supabase
        .from('asset_daily_analysis')
        .select('asset, symbol, cumulative_score, dominant_indicator')
        .order('cumulative_score', { ascending: false }) // Use abs logic in JS
        .limit(20);

      // 2. Query entity_scores
      const { data: entities } = await supabase
        .from('entity_scores')
        .select('name, sport, score, type')
        .limit(10);

      const combined: AssetSignal[] = [
        ...(assets || []).map(a => ({
          name: a.asset || a.symbol,
          badge: (a.dominant_indicator || 'STOCK').toUpperCase(),
          score: parseFloat(a.cumulative_score || 0)
        })),
        ...(entities || []).map(e => ({
          name: e.name,
          badge: (e.sport || e.type || 'SPORT').toUpperCase(),
          score: parseFloat(e.score || 0)
        }))
      ];

      // Sort by absolute score descending
      combined.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
      setSignals(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-5 pb-10">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Pulse</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Daily Signals</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {signals.map((signal, idx) => (
            <div key={idx} className="bg-[#12121a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-[4/3] shadow-xl">
              <div className="space-y-1">
                <div className="text-[8px] font-black text-[#00C853] bg-[#00C853]/10 px-2 py-1 rounded inline-block uppercase tracking-widest border border-[#00C853]/20">
                  {signal.badge}
                </div>
                <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight uppercase italic tracking-tight pt-1">
                  {signal.name}
                </h3>
              </div>
              <div className="text-2xl font-black italic tracking-tighter" style={{ color: getHeatScoreColor(signal.score) }}>
                {signal.score > 0 ? '+' : ''}{formatScore(signal.score, 1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
