import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore, getHeatScoreBgColor } from '../utils/format';
import AnalysisModal from './AnalysisModal';

interface EntityScore {
  id: string;
  name: string;
  type: string;
  sport: string;
  org: string;
  score: number;
  score_color: string;
  logo_url: string | null;
  headshot_url: string | null;
  breakdown: any;
  why: string;
  symbol: string | null;
}

export default function HomePage() {
  const [entities, setEntities] = useState<EntityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityScore | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      // Data Fix: Score not null and updated within 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('entity_scores')
        .select('*')
        .not('score', 'is', null)
        .gt('updated_at', sevenDaysAgo.toISOString())
        .order('score', { ascending: false });

      if (data) {
        // Sort by absolute score descending
        const sorted = [...data].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
        setEntities(sorted.slice(0, 40));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (entity: EntityScore) => {
    setSelectedEntity(entity);
    if (!entity.sport && entity.symbol) {
      // Fetch latest financial data
      const { data } = await supabase
        .from('asset_daily_analysis')
        .select('*')
        .eq('symbol', entity.symbol)
        .order('run_date', { ascending: false })
        .limit(1)
        .single();
      
      setFinancialData(data);
    } else {
      setFinancialData(null);
    }
  };

  return (
    <div className="flex-grow p-4 pb-10 overflow-x-hidden">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Global Intelligence</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Institutional Pulse</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {entities.map((entity) => {
            const bgColor = getHeatScoreBgColor(entity.score);
            const image = entity.headshot_url || entity.logo_url;
            
            return (
              <div 
                key={entity.id} 
                onClick={() => handleCardClick(entity)}
                className="rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square shadow-2xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer"
                style={{ backgroundColor: bgColor }}
              >
                {/* Top Row: Badge & Image */}
                <div className="flex justify-between items-start gap-2">
                  <div className="text-[9px] font-black text-white bg-black/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/10 backdrop-blur-md">
                    {entity.org || entity.sport || 'HiLEX'}
                  </div>
                  {image && (
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-black/10 shrink-0 shadow-xl">
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Bottom Row: Name & Score */}
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-white leading-tight uppercase italic tracking-tighter line-clamp-2 drop-shadow-sm">
                    {entity.name}
                  </h3>
                  <div className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
                    {entity.score > 0 ? '+' : ''}{formatScore(entity.score, 1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
