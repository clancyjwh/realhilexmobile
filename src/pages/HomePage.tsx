import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatScore } from '../utils/format';
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
  updated_at: string;
  // Details for modal - optional for initial Top Movers list
  breakdown?: any;
  why?: string;
  symbol?: string | null;
}

const SHORTHANDS: Record<string, string> = {
  'Golden State Warriors': 'GSW',
  'Los Angeles Lakers': 'LAL',
  'Los Angeles Clippers': 'LAC',
  'Milwaukee Bucks': 'MIL',
  'Boston Celtics': 'BOS',
  'Phoenix Suns': 'PHX',
  'Denver Nuggets': 'DEN',
  'Miami Heat': 'MIA',
  'Philadelphia 76ers': 'PHI',
  'New York Knicks': 'NYK',
  'Edmonton Oilers': 'EDM',
  'Colorado Avalanche': 'COL',
  'Toronto Maple Leafs': 'TOR',
  'New York Rangers': 'NYR',
  'Tampa Bay Lightning': 'TBL',
  'Vegas Golden Knights': 'VGK',
  'Florida Panthers': 'FLA',
  'Dallas Stars': 'DAL',
  'Winnipeg Jets': 'WPG',
  'Vancouver Canucks': 'VAN'
};

const getShorthand = (name: string) => {
  if (SHORTHANDS[name]) return SHORTHANDS[name];
  if (name.length > 12 && name.includes(' ')) {
    const parts = name.split(' ');
    return parts[parts.length - 1];
  }
  return name;
};

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
      // Exact Desktop Query Logic as requested
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('entity_scores')
        .select('id, name, type, sport, org, score, score_color, logo_url, headshot_url, updated_at')
        .not('score', 'is', null)
        .gt('updated_at', sevenDaysAgo.toISOString());

      if (data) {
        // Precise Desktop Sorting: Order by abs(score) desc
        const sorted = [...data]
          .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
          .slice(0, 35);
        setEntities(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (entity: EntityScore) => {
    // Fetch full entity details if missing (optimized for Top Movers list)
    if (!entity.breakdown) {
      const { data: details } = await supabase
        .from('entity_scores')
        .select('*')
        .eq('id', entity.id)
        .single();
      
      if (details) {
        entity = { ...entity, ...details };
      }
    }

    setSelectedEntity(entity);
    if (!entity.sport && entity.symbol) {
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
            return (
              <div 
                key={entity.id} 
                onClick={() => handleCardClick(entity)}
                className="rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center aspect-square shadow-2xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer"
                style={{ backgroundColor: entity.score_color }}
              >
                <div className="space-y-3">
                  <h3 className="font-black text-2xl text-white leading-tight uppercase italic tracking-tighter drop-shadow-sm">
                    {getShorthand(entity.name)}
                  </h3>
                  <div className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md">
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
