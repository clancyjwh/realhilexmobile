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
  // If player name too long, use last name only
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
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('entity_scores')
        .select('id, name, type, sport, org, score, score_color, logo_url, headshot_url, updated_at')
        .not('score', 'is', null)
        .gt('updated_at', sevenDaysAgo.toISOString());

      if (data) {
        // Sort by abs(score) desc and limit to 35
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
    if (!entity.breakdown) {
      const { data: details } = await supabase
        .from('entity_scores')
        .select('breakdown, why, symbol')
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
    <div className="flex-grow p-5 pb-12 overflow-x-hidden bg-[#0a0a0f]">
      <div className="mb-10 pt-4 px-2">
        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">Institutional Pulse</h2>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Top Movers</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[5/4] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-1">
          {entities.map((entity) => {
            return (
              <div 
                key={entity.id} 
                onClick={() => handleCardClick(entity)}
                className="rounded-2xl p-5 flex flex-col justify-center items-center text-center aspect-[5/4] shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden transition-all active:scale-[0.97] cursor-pointer border border-white/5 group"
                style={{ backgroundColor: entity.score_color }}
              >
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                
                <div className="relative z-10 space-y-2">
                  <h3 className="font-black text-xl text-white leading-none uppercase italic tracking-tighter drop-shadow-xl">
                    {getShorthand(entity.name)}
                  </h3>
                  <div className="text-4xl font-black italic tracking-tighter text-white drop-shadow-2xl">
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
