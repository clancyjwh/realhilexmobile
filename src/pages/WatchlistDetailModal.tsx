import React from 'react';
import { X } from 'lucide-react';
import { getHeatScoreBgColor, formatScore } from '../utils/format';

interface WatchlistDetailModalProps {
  item: any; // The full user_watchlist row or the webhook response 'data'
  onClose: () => void;
}

export default function WatchlistDetailModal({ item, onClose }: WatchlistDetailModalProps) {
  const signal = item.signal || 0;
  
  // Parse optimized parameters if they are strings
  const rawParams = item.optimized_parameters || {};
  const params: any[] = [];
  
  Object.keys(rawParams).forEach(key => {
    try {
      const parsed = typeof rawParams[key] === 'string' ? JSON.parse(rawParams[key]) : rawParams[key];
      params.push({ days: parseInt(key), ...parsed });
    } catch (e) {
      console.error('Failed to parse param:', key);
    }
  });
  
  params.sort((a, b) => a.days - b.days);

  const indicators = item.indicators || {};
  const roc = indicators.Rate_of_Change?.rate_of_change || {};

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between p-6 pb-2 shrink-0">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded-lg inline-block uppercase tracking-widest">
            {item.symbol}
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            {item.name}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-32">
        
        {/* HeatScore Section */}
        <div className="flex flex-col items-center justify-center space-y-2 py-6 bg-[#12121a] border border-white/5 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(to bottom right, transparent, ${getHeatScoreBgColor(signal)})` }} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">HeatScore</span>
          <div className="text-6xl font-black italic tracking-tighter drop-shadow-md relative z-10" style={{ color: getHeatScoreBgColor(signal) }}>
            {signal > 0 ? '+' : ''}{formatScore(signal, 1)}
          </div>
        </div>

        {/* Indicators Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Technical Indicators</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CCI', value: parseFloat(indicators.CCI?.signal) },
              { label: 'RSI', value: parseFloat(indicators.RSI?.signal) },
              { label: 'SMA', value: parseFloat(indicators.SMA?.signal) },
              { label: 'BOLL', value: parseFloat(indicators.BOLL?.signal) },
              { label: 'MACD', value: parseFloat(indicators.MACD?.signal) },
              { label: 'ROC', value: parseFloat(roc.signal) }
            ].map((ind, idx) => (
              <div 
                key={idx}
                className="rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 shadow-lg"
                style={{ backgroundColor: getHeatScoreBgColor(ind.value) }}
              >
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{ind.label}</span>
                <span className="text-2xl font-black text-white drop-shadow-sm">
                  {!isNaN(ind.value) ? ind.value : 'NaN'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimized Parameters Backtest */}
        {params.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Optimized Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              {params.map((p, idx) => (
                <div 
                  key={idx}
                  className="rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center aspect-square shadow-2xl relative overflow-hidden transition-all"
                  style={{ backgroundColor: getHeatScoreBgColor(p.Signal) }}
                >
                  <div className="space-y-4 flex flex-col items-center relative z-10">
                    <div className="text-[10px] font-black text-white bg-black/20 px-3 py-1.5 rounded-xl uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-sm">
                      {p.Daysback || p.days} DAYS
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter drop-shadow-md text-white">
                      {parseFloat(p.Signal) > 0 ? '+' : ''}{formatScore(p.Signal, 1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
