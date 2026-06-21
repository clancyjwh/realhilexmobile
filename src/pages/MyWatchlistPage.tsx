import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  Search, 
  Filter, 
  RefreshCw, 
  Bell, 
  Star,
  Plus,
  X,
  Bitcoin,
  DollarSign,
  BarChart3,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTierPermissions } from '../utils/tierAccess';
import { supabase } from '../lib/supabase';
import { calculateMarketSentiment } from '../utils/marketSentiment';
import { COMMODITY_SUGGESTIONS } from '../utils/assetSuggestions';
import { useEventTracker } from '../hooks/useAnalytics';
import Disclaimer from '../components/Disclaimer';
import LivePriceCard from '../components/LivePriceCard';
import LivePriceSearchModal from '../components/LivePriceSearchModal';
import LivePriceBanner from '../components/LivePriceBanner';
import PremiumBadge from '../components/PremiumBadge';

interface SearchResult {
  symbol: string;
  instrument_name: string;
  exchange: string;
  country: string;
  currency: string;
  instrument_type: string;
}

interface WatchlistAsset {
  id: string;
  symbol: string;
  name: string;
  signal: number | null;
  price: number | null;
  roc_signal: number | null;
  roc_value: number | null;
  indicators: any;
  optimized_parameters: any;
  hasWebhookData: boolean;
  category?: string;
}

interface LivePriceItem {
  id: string;
  ticker: string;
  company_name: string;
  slot_position: number;
  asset_class: string;
  current_price?: number;
  price_change?: number;
  price_change_percent?: number;
}

const getSignalColors = (signal: number) => {
  if (signal >= 9) return { bg: 'bg-[linear-gradient(145deg,#FFFDF5_0%,#FFF3CC_35%,#EBD48E_70%,#C9A43B_100%)] bg-[length:200%_200%] animate-[shimmer_4s_linear_infinite] shadow-[0_0_20px_rgba(201,164,59,0.8),0_0_40px_rgba(235,212,142,0.4),0_0_60px_rgba(255,253,245,0.2)]', border: 'border-yellow-400', text: 'text-black' };
  if (signal >= 7) return { bg: 'bg-green-900', border: 'border-green-700', text: 'text-green-300' };
  if (signal >= 4) return { bg: 'bg-green-700', border: 'border-green-600', text: 'text-green-200' };
  if (signal >= 1) return { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-100' };
  if (signal > -1) return { bg: 'bg-slate-600', border: 'border-slate-500', text: 'text-slate-200' };
  if (signal >= -4) return { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-100' };
  if (signal >= -7) return { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-100' };
  if (signal <= -9) return { bg: 'bg-gradient-to-br from-red-900 to-red-950', border: 'border-red-600', text: 'text-red-200' };
  return { bg: 'bg-red-900', border: 'border-red-700', text: 'text-red-300' };
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const updated = new Date(timestamp);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const calculateAverageSignal = (asset: WatchlistAsset): number => {
  if (asset.signal !== undefined && asset.signal !== null) {
    return asset.signal;
  }

  const signals: number[] = [];

  if (asset.roc_signal !== undefined && asset.roc_signal !== null) {
    signals.push(asset.roc_signal);
  }

  if (asset.indicators) {
    Object.values(asset.indicators).forEach((indicator: any) => {
      if (indicator.signal !== undefined) {
        signals.push(indicator.signal);
      }
    });
  }

  if (signals.length === 0) return 0;

  const sum = signals.reduce((acc, val) => acc + val, 0);
  return sum / signals.length;
};

const WatchlistLoadingCard = ({ 
  asset, 
  onRemove 
}: { 
  asset: WatchlistAsset; 
  onRemove: (id: string) => void 
}) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const startTime = new Date(asset.last_updated).getTime();
    
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const threeMinutes = 3 * 60 * 1000;
      
      if (elapsed < threeMinutes) {
        const currentProgress = (elapsed / threeMinutes) * 90;
        setProgress(Math.max(0, currentProgress));
      } else {
        const slowElapsed = (elapsed - threeMinutes) / 1000;
        const crawl = 90 + (10 * (1 - 1 / (slowElapsed / 60 + 1))); 
        setProgress(crawl);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [asset.last_updated]);

  const createdTime = new Date(asset.last_updated).getTime();
  const currentTime = new Date().getTime();
  const minutesElapsed = (currentTime - createdTime) / (1000 * 60);
  const hasTimedOut = minutesElapsed > 10;

  return (
    <div
      className="relative group bg-slate-900 border-2 border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200 h-56"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(asset.id);
        }}
        className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold text-white mb-2">{asset.symbol}</div>
        <div className="text-sm text-slate-400 text-center mb-4 truncate w-full px-2">{asset.name}</div>
        {hasTimedOut ? (
          <div className="text-sm font-semibold text-red-400">Error: Asset not found</div>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00D8FF' }} />
              <div className="text-sm font-semibold" style={{ color: '#00D8FF' }}>Analyzing...</div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-[#00D8FF] to-blue-500 h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,216,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              Processing market data ({Math.round(progress)}%)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyWatchlistPage() {
  const { user, tier, aiNewsfeedPaid, aiNewsfeedStartedAt, isPremium } = useAuth();
  const permissions = getTierPermissions(tier, aiNewsfeedPaid, aiNewsfeedStartedAt);
  const track = useEventTracker();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!permissions.canAccessWatchlist) {
      navigate('/', { state: { upgradeRequired: 'Finance', featureName: 'Personal Watchlists' } });
      return;
    }
  }, [permissions.canAccessWatchlist, navigate]);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [watchlistAssets, setWatchlistAssets] = useState<WatchlistAsset[]>([]);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<LivePriceItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLivePriceSearchOpen, setIsLivePriceSearchOpen] = useState(false);
  const [bannerData, setBannerData] = useState<{ ticker: string; companyName: string } | null>(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string | null>(null);
  const [addingLivePrice, setAddingLivePrice] = useState(false);
  const [livePriceError, setLivePriceError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWatchlistAssets();
      fetchLivePrices();

      const watchlistChannel = supabase
        .channel('user_watchlist_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_watchlist',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchWatchlistAssets();
          }
        )
        .subscribe();

      const livePricesChannel = supabase
        .channel('live_prices_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_prices_watchlist',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchLivePrices();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(watchlistChannel);
        supabase.removeChannel(livePricesChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.length >= 1 && selectedAssetClass) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedAssetClass]);

  const fetchWatchlistAssets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('signal', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const formattedData: WatchlistAsset[] = (data || []).map((item: any) => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        signal: item.signal ? parseFloat(item.signal) : null,
        price: item.price ? parseFloat(item.price) : null,
        roc_signal: item.roc_signal ? parseFloat(item.roc_signal) : null,
        roc_value: item.roc_value ? parseFloat(item.roc_value) : null,
        indicators: item.indicators || null,
        optimized_parameters: item.optimized_parameters || null,
        last_updated: item.last_updated || item.created_at,
        hasWebhookData: item.signal !== null && item.indicators !== null,
        category: item.category,
      }));

      setWatchlistAssets(formattedData);
    } catch (error) {
      console.error('Error fetching watchlist assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedAssetClass) return;

    setSearching(true);
    try {
      let filteredResults = [];

      if (selectedAssetClass === 'commodities') {
        const commodityMatches = COMMODITY_SUGGESTIONS.filter(commodity =>
          commodity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          commodity.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          commodity.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredResults = commodityMatches.map(commodity => ({
          symbol: commodity.symbol,
          instrument_name: commodity.name,
          exchange: 'TwelveData',
          country: 'Global',
          currency: 'USD',
          instrument_type: commodity.category
        }));
      } else {
        const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
        const response = await fetch(
          `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(searchQuery)}&outputsize=30&apikey=${apiKey}`
        );
        const data = await response.json();

        if (data.status === 'error') {
          console.error('Twelve Data API error:', data.message);
          setSearchResults([]);
          return;
        }

        switch (selectedAssetClass) {
          case 'stocks':
            filteredResults = data.data?.filter((item: SearchResult) =>
              item.instrument_type === 'Common Stock' ||
              item.instrument_type === 'Equity' ||
              item.instrument_type === 'ADR'
            ) || [];
            break;

          case 'crypto':
            filteredResults = data.data?.filter((item: SearchResult) =>
              item.instrument_type === 'Digital Currency' && item.symbol.endsWith('/USD')
            ) || [];
            break;

          case 'forex':
            filteredResults = data.data?.filter((item: SearchResult) =>
              item.instrument_type === 'Physical Currency'
            ) || [];
            break;

          default:
            filteredResults = [];
        }
      }

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddAsset = async (symbol: string, name: string) => {
    if (watchlistAssets.length >= userMaxSlots) {
      return;
    }

    if (!user || !selectedAssetClass) {
      alert('You must be logged in to add assets');
      return;
    }

    setAddingTicker(symbol);
    try {
      const { error: insertError } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: user.id,
          symbol: symbol,
          name: name,
          category: selectedAssetClass,
          signal: null,
          price: null,
          indicators: null,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          alert('This asset is already in your watchlist');
        } else {
          throw insertError;
        }
        return;
      }

      await fetchWatchlistAssets();

      fetch('https://hook.us2.make.com/8kuomvnr2exdq8se2dw1hqa5cdgozaoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: /[&+/?:=%#\s]/.test(symbol) ? encodeURIComponent(symbol) : symbol,
          name: name,
          user_id: user.id,
          asset_class: selectedAssetClass,
          action: 'add_to_watchlist'
        }),
      }).catch(console.error);

      track({
        eventType: 'watchlist_action',
        assetClass: selectedAssetClass,
        assetSymbol: symbol,
        metadata: { action: 'add' }
      });

      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedAssetClass(null);
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('Asset not found');
    } finally {
      setAddingTicker(null);
    }
  };

  const handleRemoveAsset = async (assetId: string) => {
    if (!user) return;

    try {
      const asset = watchlistAssets.find(a => a.id === assetId);

      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (asset) {
        fetch('https://hook.us2.make.com/ff1802r1g2nt8l1en4d879h5vq8ldlj0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Asset: asset.symbol,
            UserID: user.id,
          }),
        }).catch(err => console.error('Webhook error:', err));
      }

      track({
        eventType: 'watchlist_action',
        assetClass: asset?.category || 'unknown',
        assetSymbol: asset?.symbol || 'unknown',
        metadata: { action: 'remove' }
      });

      await fetchWatchlistAssets();
    } catch (error) {
      console.error('Error removing asset:', error);
      alert('Asset not found');
    }
  };

  const fetchLivePrices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('live_prices_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('slot_position', { ascending: true });

      if (error) throw error;
      setLivePrices(data || []);
    } catch (error) {
      console.error('Error fetching live prices:', error);
    }
  };

  const handleAddLivePrice = (slotPosition: number) => {
    setSelectedSlot(slotPosition);
    setIsLivePriceSearchOpen(true);
  };

  const handleSelectStock = async (ticker: string, companyName: string, assetClass: string) => {
    if (!user || selectedSlot === null) return;

    setAddingLivePrice(true);
    setLivePriceError(null);

    try {
      const webhookUrl = `https://hook.us2.make.com/9po4hnkkxxkkupff5vbvvylugaqrz3uj?user_id=${user.id}&asset_class=${assetClass}&ticker=${ticker}`;
      console.log('Calling webhook:', webhookUrl);

      const response = await fetch(webhookUrl);
      const priceData = await response.text();
      console.log('Response:', priceData);

      const priceMatch = priceData.match(/Price:\s*([\d.]+)/);
      console.log('Match:', priceMatch);

      const currentPrice = parseFloat(priceMatch[1]);
      console.log('Parsed price:', currentPrice);

      await supabase
        .from('live_prices_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('slot_position', selectedSlot);

      const { data, error } = await supabase
        .from('live_prices_watchlist')
        .insert({
          user_id: user.id,
          ticker,
          company_name: companyName,
          asset_class: assetClass,
          slot_position: selectedSlot,
          current_price: currentPrice,
          price_change: 0,
          price_change_percent: 0,
        })
        .select();

      console.log('Insert result:', { data, error });

      await fetchLivePrices();
      setIsLivePriceSearchOpen(false);
    } catch (error) {
      console.error('Error:', error);
      setLivePriceError('Failed to fetch price data. Please try again.');
    } finally {
      setAddingLivePrice(false);
    }
  };

  const handleRemoveLivePrice = async (slotPosition: number) => {
    if (!user) return;

    try {
      const priceItem = livePrices.find(p => p.slot_position === slotPosition);

      const { error } = await supabase
        .from('live_prices_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('slot_position', slotPosition);

      if (error) throw error;

      if (priceItem) {
        fetch('https://hook.us2.make.com/gcpdxxdy6wobhqj512t9vuqw1wjfcq77', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            type: 'price',
            asset: {
              ticker: priceItem.ticker,
              company_name: priceItem.company_name,
              asset_class: priceItem.asset_class,
            }
          }),
        }).catch(err => console.error('Webhook error:', err));
      }

      await fetchLivePrices();
    } catch (error) {
      console.error('Error removing live price:', error);
    }
  };

  const handleAssetClick = (asset: WatchlistAsset) => {
    if (asset.hasWebhookData) {
      navigate(`/watchlist/${encodeURIComponent(asset.symbol)}`);
    }
  };



  const assetsWithData = watchlistAssets.filter(a => a.hasWebhookData);
  const assetsWithoutData = watchlistAssets.filter(a => !a.hasWebhookData);

  const sortedAssetsWithData = [...assetsWithData].sort((a, b) => {
    const avgA = calculateAverageSignal(a);
    const avgB = calculateAverageSignal(b);
    return avgB - avgA;
  });

  const maxSlots = 6;
  const userMaxSlots = isPremium ? 6 : 1;
  const emptySlotCount = Math.max(0, userMaxSlots - watchlistAssets.length);
  const lockedSlotCount = isPremium ? 0 : Math.max(0, maxSlots - userMaxSlots - watchlistAssets.length);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full overflow-x-hidden">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(0,216,255,0.1)' }}>
              <Star className="w-6 h-6" style={{ color: '#00D8FF' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">My Watchlist</h1>
              <p className="text-slate-400 text-sm">Track your favorite assets</p>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            disabled={watchlistAssets.length >= userMaxSlots}
            className="flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-black disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            style={{ background: watchlistAssets.length >= userMaxSlots ? 'rgba(255,255,255,0.08)' : '#00D8FF', boxShadow: watchlistAssets.length >= userMaxSlots ? 'none' : '0 0 20px rgba(0,216,255,0.3)', color: watchlistAssets.length >= userMaxSlots ? '#64748b' : '#000' }}
          >
            <Plus className="w-5 h-5" />
            Add Assets
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <p className="text-slate-400 text-sm">
          {watchlistAssets.length} / {userMaxSlots} slots filled {!isPremium && <span className="text-amber-500">(Free tier)</span>}
        </p>
        {!isPremium && (
          <p className="text-amber-500 text-xs font-medium">
            Upgrade to Premium for 6 asset slots
          </p>
        )}
        <p className="text-slate-500 text-xs">
          Assets refresh with new analyses every 12 hours
        </p>
        <p className="text-slate-500 text-xs">
          Note: some assets can take up to five minutes to finish loading
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white text-xl">Loading watchlist...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssetsWithData.map((asset, index) => {
            const averageSignal = calculateAverageSignal(asset);
            const colors = getSignalColors(averageSignal);
            const sentiment = calculateMarketSentiment(averageSignal);
            const signalPosition = ((averageSignal + 10) / 20) * 100;

            return (
              <button
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-left relative group h-56 flex flex-col justify-between`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAsset(asset.id);
                  }}
                  className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white/60 text-xs font-bold mb-0.5">#{index + 1}</div>
                      <div className="text-white text-xl font-bold">{asset.symbol}</div>
                      <div className="text-white/80 text-xs line-clamp-1">{asset.name}</div>
                    </div>
                    <div className="p-1.5 bg-white/20 rounded-full">
                      {averageSignal > 0 ? (
                        <TrendingUp className="w-5 h-5 text-white" />
                      ) : averageSignal < 0 ? (
                        <TrendingDown className="w-5 h-5 text-white" />
                      ) : (
                        <Activity className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-2">
                    <div className={`text-3xl font-bold ${colors.text}`}>
                      {averageSignal > 0 ? '+' : ''}{averageSignal.toFixed(1)}
                    </div>
                    <div className="text-white/70 text-xs">{sentiment.label}</div>
                  </div>
                </div>

                <div>
                  <div className="relative h-6 bg-gradient-to-r from-red-500 via-slate-400 to-green-500 rounded-full overflow-hidden mb-1">
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-black"
                      style={{ left: `${signalPosition}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-white/60 text-[10px] mb-1">
                    <span>-10</span>
                    <span>0</span>
                    <span>+10</span>
                  </div>
                  <div className="text-white/50 text-[10px] text-center">
                    Last updated: {formatTimeAgo(asset.last_updated)}
                  </div>
                </div>
              </button>
            );
          })}

          {assetsWithoutData.map((asset) => (
            <WatchlistLoadingCard 
              key={asset.id} 
              asset={asset} 
              onRemove={handleRemoveAsset} 
            />
          ))}

          {Array.from({ length: emptySlotCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              onClick={() => setShowSearch(true)}
              className="rounded-xl p-6 cursor-pointer transition-all duration-200 h-56 border-2 border-dashed"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,216,255,0.2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,216,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,216,255,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,216,255,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="p-3 bg-slate-800 rounded-full mb-3">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-slate-500 text-sm text-center">Empty Slot</div>
                <div className="text-slate-600 text-xs mt-1">Click to add</div>
              </div>
            </div>
          ))}

          {Array.from({ length: lockedSlotCount }).map((_, index) => (
            <div
              key={`locked-${index}`}
              className="relative bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-6 opacity-60 cursor-not-allowed h-56"
            >
              <PremiumBadge />
              <div className="flex flex-col items-center justify-center h-full">
                <div className="p-3 bg-slate-800 rounded-full mb-3">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-slate-500 text-sm text-center">Locked Slot</div>
                <div className="text-slate-600 text-xs mt-1">Premium required</div>
              </div>
            </div>
          ))}
        </div>
      )}



      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {!selectedAssetClass ? (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-2xl font-bold text-white">Select Asset Class</h2>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                      setSelectedAssetClass(null);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedAssetClass('stocks')}
                      className="p-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all text-left group"
                    >
                      <TrendingUp className="w-8 h-8 text-slate-400 group-hover:text-white mb-3 transition-colors" />
                      <div className="text-white font-semibold text-lg">Stocks</div>
                      <div className="text-slate-400 text-sm mt-1">Equities</div>
                    </button>
                    <button
                      onClick={() => setSelectedAssetClass('crypto')}
                      className="p-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all text-left group"
                    >
                      <Bitcoin className="w-8 h-8 text-slate-400 group-hover:text-white mb-3 transition-colors" />
                      <div className="text-white font-semibold text-lg">Crypto</div>
                      <div className="text-slate-400 text-sm mt-1">Digital assets</div>
                    </button>
                    <button
                      onClick={() => setSelectedAssetClass('forex')}
                      className="p-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all text-left group"
                    >
                      <DollarSign className="w-8 h-8 text-slate-400 group-hover:text-white mb-3 transition-colors" />
                      <div className="text-white font-semibold text-lg">Forex</div>
                      <div className="text-slate-400 text-sm mt-1">Currency pairs</div>
                    </button>
                    <button
                      onClick={() => setSelectedAssetClass('commodities')}
                      className="p-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all text-left group"
                    >
                      <BarChart3 className="w-8 h-8 text-slate-400 group-hover:text-white mb-3 transition-colors" />
                      <div className="text-white font-semibold text-lg">Commodities</div>
                      <div className="text-slate-400 text-sm mt-1">Raw materials</div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        setSelectedAssetClass(null);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        setSelectedAssetClass(null);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Search {selectedAssetClass === 'stocks' ? 'Stocks' : selectedAssetClass === 'crypto' ? 'Cryptocurrency' : selectedAssetClass === 'forex' ? 'Forex' : 'Commodities'}
                  </h2>
                  <div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          let value = e.target.value.toUpperCase();

                          if (selectedAssetClass === 'forex') {
                            value = value.replace(/[^A-Z]/g, '');

                            if (value.length > 3 && !value.includes('/')) {
                              value = value.slice(0, 3) + '/' + value.slice(3, 6);
                            }

                            if (value.length > 7) {
                              value = value.slice(0, 7);
                            }
                          }

                          setSearchQuery(value);
                        }}
                        placeholder={
                          selectedAssetClass === 'stocks' ? 'Search by ticker or company name...' :
                            selectedAssetClass === 'crypto' ? 'e.g., BTC, ETH, SOL' :
                              selectedAssetClass === 'forex' ? 'e.g., EURUSD, GBPUSD' :
                                'e.g., XAU/USD, WTI/USD, NG/USD, HG1'
                        }
                        autoFocus
                        className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    {selectedAssetClass === 'forex' && (
                      <button
                        type="submit"
                        disabled={searchQuery.length !== 7 || addingTicker}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {addingTicker ? 'Adding...' : 'Add to Watchlist'}
                      </button>
                    )}
                  </div>
                  {selectedAssetClass === 'stocks' && (
                    <p className="text-xs text-slate-500 mt-2">Search for US stocks</p>
                  )}
                  {selectedAssetClass === 'crypto' && (
                    <p className="text-xs text-slate-500 mt-2">Showing only USD pairs</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {searching && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}

                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No results found</p>
                      <p className="text-slate-500 text-sm mt-1">Try a different search term</p>
                    </div>
                  )}

                  {!searching && !searchQuery && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Start typing to search</p>
                    </div>
                  )}

                  {!searching && searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((result, idx) => (
                        <button
                          key={`${result.symbol}-${result.exchange}-${idx}`}
                          onClick={() => handleAddAsset(result.symbol, result.instrument_name)}
                          disabled={watchlistAssets.length >= userMaxSlots || addingTicker === result.symbol}
                          className="w-full p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold text-lg">{result.symbol}</div>
                              <div className="text-slate-400 text-sm">{result.instrument_name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs text-slate-500">{result.exchange}</div>
                                {result.country && <div className="text-xs text-slate-500">• {result.country}</div>}
                                {result.currency && <div className="text-xs text-slate-500">• {result.currency}</div>}
                              </div>
                            </div>
                            {addingTicker === result.symbol && (
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}





      <Disclaimer />
    </div>
  );
}
