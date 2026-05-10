import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

export default function HomePage() {
  const [entities, setEntities] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<UnifiedItem | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    fetchEntities();
  }, []);

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
        unifiedScore: row.signal || 0,
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
        .sort((a, b) => b.unifiedScore - a.unifiedScore);

      setEntities(combined);
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
    } else if (entity.itemType === 'asset') {
      const { data: assetDetails } = await supabase
        .from('entity_scores')
        .select('*')
        .eq('symbol', entity.symbol)
        .single();
      if (assetDetails) {
        entity = { ...entity, ...assetDetails };
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
        <div className="grid grid-cols-2 gap-3">
          {entities.map((entity) => {
            return (
              <div 
                key={`${entity.id}-${entity.itemType}`} 
                onClick={() => handleCardClick(entity)}
                className="rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all active:scale-[0.96] cursor-pointer"
                style={{ backgroundColor: entity.score_color }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{entity.org || entity.itemType}</span>
                  </div>
                  {(entity.headshot_url || entity.logo_url) && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/20 shadow-sm flex-shrink-0">
                      <img 
                        src={entity.headshot_url || entity.logo_url!} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col mt-auto">
                  <h3 className="font-black text-xl text-white leading-tight uppercase italic tracking-tighter drop-shadow-sm truncate w-full mb-1">
                    {getShorthand(entity.name)}
                  </h3>
                  <div className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
                    {entity.unifiedScore > 0 ? '+' : ''}{formatScore(entity.unifiedScore, 1)}
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
