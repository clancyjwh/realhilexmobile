import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { UserContext } from '../App';
import { formatScore, getSignalColors } from '../utils/format';
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
  'Vancouver Canucks': 'VAN',
  'Paris Saint-Germain': 'PSG',
  'Paris Saint-Germain FC': 'PSG',
  'Paris Saint-Germain Football Club': 'PSG'
};

const getShorthand = (name: string) => {
  if (SHORTHANDS[name]) return SHORTHANDS[name];
  if (name.length > 12 && name.includes(' ')) {
    const parts = name.split(' ');
    return parts[parts.length - 1];
  }
  return name;
};

export const getEntityImageUrl = (entity: any) => {
  if (entity.headshot_url) return entity.headshot_url;
  if (entity.logo_url) return entity.logo_url;
  if (entity.type === 'team') {
    const name = entity.name || "";
    const sport = entity.sport?.toLowerCase();
    
    if (sport === 'nhl' && name.length <= 3) return `https://assets.nhle.com/logos/nhl/svg/${name.toUpperCase()}_light.svg`;
    if (sport === 'nba' && name.length <= 3) return `https://a.espncdn.com/i/teamlogos/nba/500/${name.toLowerCase()}.png`;
    
    if (sport === 'soccer') {
      const WC_MAP: Record<string, string> = {
        "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czech Republic": "cz",
        "Canada": "ca", "Bosnia and Herzegovina": "ba", "Qatar": "qa", "Switzerland": "ch",
        "Brazil": "br", "Morocco": "ma", "Haiti": "ht", "Scotland": "gb-sct",
        "United States": "us", "USA": "us", "Paraguay": "py", "Australia": "au",
        "Turkey": "tr", "Germany": "de", "Curacao": "cw", "Curaçao": "cw",
        "Ivory Coast": "ci", "Côte d'Ivoire": "ci", "Ecuador": "ec", "Netherlands": "nl",
        "Japan": "jp", "Sweden": "se", "Tunisia": "tn", "Belgium": "be",
        "Egypt": "eg", "Iran": "ir", "New Zealand": "nz", "Spain": "es",
        "Cape Verde": "cv", "Saudi Arabia": "sa", "Uruguay": "uy", "France": "fr",
        "Senegal": "sn", "Iraq": "iq", "Norway": "no", "Argentina": "ar",
        "Algeria": "dz", "Austria": "at", "Jordan": "jo", "Portugal": "pt",
        "DR Congo": "cd", "Democratic Republic of the Congo": "cd", "Uzbekistan": "uz",
        "Colombia": "co", "England": "gb-eng", "Croatia": "hr", "Ghana": "gh",
        "Panama": "pa", "Korea Republic": "kr", "Czechia": "cz"
      };
      const code = WC_MAP[name] || WC_MAP[name.replace(' Republic', '')];
      if (code) return `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/world-cup/${code}.png`;
      
      const lowerName = name.toLowerCase();
      const isPSG = lowerName.includes('paris saint-germain') || lowerName.includes('psg');
      const slug = isPSG ? 'psg' : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/ucl/${slug}.png`;
    }
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

      const [stocksResult, caStocksResult, cryptoResult, forexResult, commoditiesResult, etfsRawResult] = await Promise.all([
        supabase.from('stocks_top_picks').select('*').in('symbol', americanStocks),
        supabase.from('ca_stocks_top_picks').select('*').in('symbol', caStockSymbols),
        supabase.from('crypto_top_picks').select('*').in('symbol', cryptoSymbols),
        supabase.from('forex_top_picks').select('*').in('symbol', forexSymbols),
        supabase.from('commodities_top_picks').select('*').in('symbol', commoditySymbols),
        supabase.from('etf_analytical_data').select('*').order('run_date', { ascending: false }).order('updated_at', { ascending: false })
      ]);

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const entityResult = await supabase
        .from('entity_scores')
        .select('id, name, type, sport, org, score, score_color, headshot_url, logo_url, position, why, updated_at')
        .gte('updated_at', twentyFourHoursAgo)
        .order('score', { ascending: false })
        .limit(100);

      const mapAsset = (row: any, orgLabel: string, nameField: string, symbolField: string, scoreField: string = 'signal'): UnifiedItem => ({
        id: row[symbolField] || row.symbol,
        name: row[nameField] || row.symbol,
        symbol: row.symbol,
        unifiedScore: Number(row[scoreField]) || 0,
        itemType: 'asset',
        org: orgLabel,
        score_color: row.score_color || '#1c1c24',
        headshot_url: null,
        logo_url: null,
        updated_at: row.updated_at
      });

      const latestEtfsMap = new Map();
      (etfsRawResult.data || []).forEach((item: any) => {
        if (!latestEtfsMap.has(item.symbol)) {
          latestEtfsMap.set(item.symbol, item);
        }
      });
      const sortedEtfs = Array.from(latestEtfsMap.values())
        .sort((a: any, b: any) => parseFloat(b.final_score || 0) - parseFloat(a.final_score || 0));
      const top3Etfs = sortedEtfs.slice(0, 3);
      const bottom2Etfs = sortedEtfs.slice(-2);
      const selectedEtfs = [...top3Etfs, ...bottom2Etfs];

      const allAssets = [
        ...(stocksResult.data || []).map(r => mapAsset(r, 'American Stock', 'stock_name', 'symbol')),
        ...(caStocksResult.data || []).map(r => mapAsset(r, 'Canadian Stock', 'stock_name', 'symbol')),
        ...(cryptoResult.data || []).map(r => mapAsset(r, 'Cryptocurrency', 'crypto_name', 'symbol')),
        ...(forexResult.data || []).map(r => mapAsset(r, 'Foreign Exchange', 'pair_name', 'symbol')),
        ...(commoditiesResult.data || []).map(r => mapAsset(r, 'Commodity', 'commodity_name', 'symbol')),
        ...selectedEtfs.map(r => mapAsset(r, 'ETF', 'etf_name', 'symbol', 'final_score')),
      ];

      const assetMap = new Map();
      allAssets.forEach(a => {
        if (!assetMap.has(a.symbol) || (a.updated_at && assetMap.get(a.symbol).updated_at && a.updated_at > assetMap.get(a.symbol).updated_at)) {
          assetMap.set(a.symbol, a);
        }
      });
      const uniqueAssets = Array.from(assetMap.values());

      const rawEntities = (entityResult.data || [])
        .filter(e => 
          !e.name?.startsWith('UFC_') && 
          !/^[0-9a-f-]{36}$/.test(e.name) && 
          e.org !== 'World Cup' && 
          e.sport !== 'World Cup'
        );

      const athletes = rawEntities.filter(e => e.type === 'athlete');
      const teams = rawEntities.filter(e => e.type === 'team');

      // Combine all fetched items
      const allFetchedItems = [
        ...uniqueAssets.map(item => ({ ...item, unifiedScore: Number(item.unifiedScore) || 0 })),
        ...athletes.map(e => ({ ...e, unifiedScore: e.score, itemType: 'entity' })),
        ...teams.map(e => ({ ...e, unifiedScore: e.score, itemType: 'entity' }))
      ];

      // Filter by Tier first
      let filtered = allFetchedItems;
      if (tier === 'Sports') filtered = allFetchedItems.filter(item => item.itemType === 'entity');
      else if (tier === 'Finance') filtered = allFetchedItems.filter(item => item.itemType === 'asset');
      else if (tier === 'Markets') filtered = allFetchedItems.filter(item => item.itemType === 'market');

      // Deduplicate
      const seen = new Set();
      filtered = filtered.filter(item => {
        const key = item.symbol || item.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by score
      const fullySorted = filtered.sort((a, b) => b.unifiedScore - a.unifiedScore);

      // Select extreme values: Top 15 and Bottom 15
      let finalItems = [];
      if (fullySorted.length <= 30) {
        finalItems = fullySorted;
      } else {
        const top15 = fullySorted.slice(0, 15);
        const bottom15 = fullySorted.slice(-15);
        finalItems = [...top15, ...bottom15];
      }

      // Final sort for display
      finalItems.sort((a, b) => b.unifiedScore - a.unifiedScore);

      setEntities(finalItems);
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
      if (entity.org === 'ETF') {
        const { data } = await supabase
          .from('etf_analytical_data')
          .select('*')
          .eq('symbol', entity.symbol)
          .order('run_date', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setFinancialData(data);
      } else {
        const { data } = await supabase
          .from('asset_daily_analysis')
          .select('*')
          .eq('symbol', entity.symbol)
          .order('run_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        setFinancialData(data);
      }
    } else {
      setFinancialData(null);
    }
  };

  return (
    <div className="flex-grow p-4 pb-10 overflow-x-hidden">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Intelligence Feed</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Top Movers</h1>
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
                    <div className={`${colors.subtext} text-xs font-bold`}>#{index + 1}</div>
                    <span className={`${colors.subtextDark} text-[10px] font-medium truncate`}>{entity.org || entity.itemType}</span>
                  </div>
                  {(() => {
                    const url = getEntityImageUrl(entity);
                    if (url && (url.startsWith('http') || url.startsWith('/'))) {
                      return (
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center relative">
                          <span className={`text-[10px] font-black ${colors.isGold ? 'text-black/30' : 'text-white/30'} uppercase absolute inset-0 flex items-center justify-center z-0`}>
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
                  <div className={`${entity.unifiedScore >= 9 ? 'text-black' : 'text-white'} text-xl font-bold truncate pr-2`}>
                    {entity.itemType === 'asset' ? entity.symbol : (entity.type === 'athlete' ? entity.name : (entity.name.toUpperCase().includes('PARIS SAINT-GERMAIN') ? 'PSG' : getShorthand(entity.name)))}
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
