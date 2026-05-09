import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreBgColor } from '../utils/format';

interface EntityScore {
  id: string;
  name: string;
  type: string;
  sport: string;
  org: string;
  score: number;
  logo_url: string | null;
  headshot_url: string | null;
}

export default function HomePage() {
  const [entities, setEntities] = useState<EntityScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('entity_scores')
        .select('id, name, type, sport, org, score, logo_url, headshot_url')
        .limit(40);

      if (data) {
        // Sort by absolute score descending
        const sorted = [...data].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
        setEntities(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-5 pb-10">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Global Intelligence</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Institutional Pulse</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {entities.map((entity) => {
            const bgColor = getHeatScoreBgColor(entity.score);
            const image = entity.headshot_url || entity.logo_url;
            
            return (
              <div 
                key={entity.id} 
                className="rounded-2xl p-4 flex flex-col justify-between aspect-[4/3] shadow-2xl relative overflow-hidden transition-transform active:scale-[0.98]"
                style={{ backgroundColor: bgColor }}
              >
                {/* Top Row: Badge & Image */}
                <div className="flex justify-between items-start gap-2">
                  <div className="text-[8px] font-black text-white bg-black/20 px-2 py-1 rounded uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                    {entity.org || 'HiLEX'}
                  </div>
                  {image && (
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-black/10 shrink-0 shadow-lg">
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Bottom Row: Name & Score */}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white leading-tight uppercase italic tracking-tight line-clamp-2 drop-shadow-sm">
                    {entity.name}
                  </h3>
                  <div className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
                    {entity.score > 0 ? '+' : ''}{formatScore(entity.score, 1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
