import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { UserContext } from '../App';
import { formatScore } from '../utils/format';
import AnalysisModal from './AnalysisModal';

interface UnifiedItem {
  id: string;
  name: string;
  symbol?: string | null;
  unifiedScore: number;
  itemType: string;
  org: string;
  score_color: string;
  logo_url: string | null;
  headshot_url: string | null;
  updated_at?: string;
  type?: string;
  sport?: string;
  breakdown?: any;
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

export const getSignalColors = (signal: number) => {
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

export const getEntityImageUrl = (entity: any) => {
  if (entity.headshot_url) return entity.headshot_url;
  if (entity.logo_url) return entity.logo_url;
  if (entity.type === 'team' && entity.name?.length <= 3) {
    if (entity.sport?.toLowerCase() === 'nhl') return `https://assets.nhle.com/logos/nhl/svg/${entity.name.toUpperCase()}_light.svg`;
    if (entity.sport?.toLowerCase() === 'nba') return `https://a.espncdn.com/i/teamlogos/nba/500/${entity.name.toLowerCase()}.png`;
  }
  return null;
};

export default function HomePage() {
  const { tier } = useContext(UserContext);
  const [entities, setEntities] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<UnifiedItem | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    fetchEntities();
  }, [tier]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const americanStocks = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META'];
      const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'LINK'];
      const forexSymbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD'];
      const commoditySymbols = ['XAU/USD', 'XAG/USD', 'WTI/USD', 'NG/USD', 'HG1'];
      const caStockSymbols = ['SHOP', 'CSU', 'LSPD', 'CLS', 'SPAI'];

      const [stocksResult, caStocksResult, cryptoResult, forexResult, commoditiesResult] = await Promise.all([
        supabase.from('stocks_top_picks').select('*').in('symbol', americanStocks),
        supabase.from('ca_stocks_top_picks').select('*').in('symbol', caStockSymbols),
        supabase.from('crypto_top_picks').select('*').in('symbol', cryptoSymbols),
        supabase.from('forex_top_picks').select('*').in('symbol', forexSymbols),
        supabase.from('commodities_top_picks').select('*').in('symbol', commoditySymbols),
      ]);

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const entityResult = await supabase
        .from('entity_scores')
        .select('id, name, type, sport, org, score, score_color, headshot_url, logo_url, position, why, updated_at')
        .gte('updated_at', twentyFourHoursAgo)
        .order('score', { ascending: false })
        .limit(100);

      const mapAsset = (row: any, orgLabel: string, nameField: string, symbolField: string): UnifiedItem => ({
        id: row[symbolField] || row.symbol,
        name: row[nameField] || row.symbol,
        symbol: row.symbol,
        unifiedScore: Number(row.signal) || 0,
        itemType: 'asset',
        org: orgLabel,
        score_color: row.score_color || '#1c1c24',
        headshot_url: null,
        logo_url: null,
        updated_at: row.updated_at
      });

      const allAssets = [
        ...(stocksResult.data || []).map(r => mapAsset(r, 'American Stock', 'stock_name', 'symbol')),
        ...(caStocksResult.data || []).map(r => mapAsset(r, 'Canadian Stock', 'stock_name', 'symbol')),
        ...(cryptoResult.data || []).map(r => mapAsset(r, 'Cryptocurrency', 'crypto_name', 'symbol')),
        ...(forexResult.data || []).map(r => mapAsset(r, 'Foreign Exchange', 'pair_name', 'symbol')),
        ...(commoditiesResult.data || []).map(r => mapAsset(r, 'Commodity', 'commodity_name', 'symbol')),
      ];

      const assetMap = new Map();
      allAssets.forEach(a => {
        if (!assetMap.has(a.symbol) || (a.updated_at && assetMap.get(a.symbol).updated_at && a.updated_at > assetMap.get(a.symbol).updated_at)) {
          assetMap.set(a.symbol, a);
        }
      });
      const uniqueAssets = Array.from(assetMap.values());

      const getTop3Bottom2 = (list: any[]) => {
        if (list.length <= 5) return [...list].sort((a, b) => b.score - a.score);
        const sorted = [...list].sort((a, b) => b.score - a.score);
        return [...sorted.slice(0, 3), ...sorted.slice(-2)];
      };

      const rawEntities = (entityResult.data || [])
        .filter(e => !e.name?.startsWith('UFC_') && !/^[0-9a-f-]{36}$/.test(e.name));

      const athletes = rawEntities.filter(e => e.type === 'athlete');
      const teams = rawEntities.filter(e => e.type === 'team');

      const topAthletes = getTop3Bottom2(athletes).map(e => ({ ...e, unifiedScore: e.score, itemType: 'entity' }));
      const topTeams = getTop3Bottom2(teams).map(e => ({ ...e, unifiedScore: e.score, itemType: 'entity' }));
      const entityItems = [...topAthletes, ...topTeams];

      const combined = [...uniqueAssets, ...entityItems]
        .map(item => ({ ...item, unifiedScore: Number(item.unifiedScore) || 0 }))
        .sort((a, b) => b.unifiedScore - a.unifiedScore);

      let finalCombined = combined;
      if (tier === 'Sports') {
        finalCombined = combined.filter(item => item.itemType === 'entity');
      } else if (tier === 'Finance') {
        finalCombined = combined.filter(item => item.itemType === 'asset');
      } else if (tier === 'Markets') {
        finalCombined = combined.filter(item => item.itemType === 'market');
      }

      setEntities(finalCombined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (entity: UnifiedItem) => {
    if (entity.itemType === 'entity' && !entity.breakdown) {
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
    if (entity.symbol) {
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
        <div className="grid grid-cols-2 gap-2.5">
          {entities.map((entity, index) => {
            const colors = getSignalColors(entity.unifiedScore);
            return (
              <button 
                key={`${entity.id}-${entity.itemType}`} 
                onClick={() => handleCardClick(entity)}
                className={`${colors.bg} ${colors.border} border-2 rounded-lg p-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-left relative overflow-hidden`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-2 w-full">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="text-white/60 text-xs font-bold">#{index + 1}</div>
                    <span className="text-white/70 text-[10px] font-medium truncate">{entity.org || entity.itemType}</span>
                  </div>
                  {(() => {
                    const url = getEntityImageUrl(entity);
                    if (url && (url.startsWith('http') || url.startsWith('/'))) {
                      return (
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center relative">
                          <span className="text-[10px] font-black text-white/30 uppercase absolute inset-0 flex items-center justify-center z-0">
                            {entity.name.charAt(0)}
                          </span>
                          <img 
                            src={url} 
                            alt="" 
                            className="w-full h-full object-contain relative z-10 bg-black/20"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                <div className="flex items-center justify-between w-full mt-2">
                  <div className="text-white text-xl font-bold truncate pr-2">
                    {entity.itemType === 'asset' ? entity.symbol : (entity.type === 'athlete' ? entity.name : getShorthand(entity.name))}
                  </div>
                  <div className={`text-3xl font-bold ${colors.text} flex-shrink-0 ml-1`}>
                    {entity.unifiedScore > 0 ? '+' : ''}{formatScore(entity.unifiedScore, 1)}
                  </div>
                </div>
              </button>
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
