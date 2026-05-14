import React from 'react';
import { X } from 'lucide-react';
import { getHeatScoreBgColor, formatScore, getSignalColors } from '../utils/format';

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
    if (['Analysis', 'Parameters', 'Win Rate'].includes(key)) return;
    try {
      const parsed = typeof rawParams[key] === 'string' ? JSON.parse(rawParams[key]) : rawParams[key];
      params.push({ days: parseInt(key), ...parsed });
    } catch (e) {
      // Ignore parse errors silently
    }
  });
  
  params.sort((a, b) => a.days - b.days);

  const indicators = item.indicators || {};
  const roc = indicators.Rate_of_Change?.rate_of_change || {};

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-xl z-50 p-6 flex items-center justify-between border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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

      <div className="flex-grow overflow-y-auto p-6 space-y-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
        
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
            ].map((ind, idx) => {
              const colors = getSignalColors(ind.value);
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 shadow-lg ${colors.bg} border-2 ${colors.border}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${colors.subtext}`}>{ind.label}</span>
                  <span className={`text-2xl font-black ${colors.text} drop-shadow-sm`}>
                    {!isNaN(ind.value) ? ind.value : 'NaN'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimized Parameters Backtest */}
        {params.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pl-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Top Historical Parameter: Monthly Snapshots</h3>
            </div>
            
            <div className="flex flex-col bg-[#12121a] p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Indicator</span>
                <span className="text-sm font-black text-white">{rawParams.Analysis || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parameters</span>
                <span className="text-sm font-black text-white">{rawParams.Parameters || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy Rate</span>
                <span className="text-sm font-black text-[#22c55e]">{rawParams['Win Rate'] || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {params.map((p, idx) => {
                const isCorrect = p.Correct === 'true' || p.Correct === true;
                return (
                  <div 
                    key={idx}
                    className={`rounded-2xl p-5 flex flex-col justify-center items-center text-center border aspect-square ${isCorrect ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}
                  >
                    <span className={`text-3xl font-black ${isCorrect ? 'text-[#10b981]' : 'text-red-500'}`}>
                      {p.Daysback || p.days}
                    </span>
                    <span className={`text-[10px] mt-1 font-black uppercase tracking-widest ${isCorrect ? 'text-[#10b981]/70' : 'text-red-500/70'}`}>
                      days
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Relative Value Section */}
        {(() => {
          const indicators = item.indicators || {};
          let relativeValueNum = null;
          let isUp = false;
          
          const rawRel = item.relative_value_analysis || item.relative_value_json || item.relative_value;
          if (rawRel) {
            try {
              const parsed = typeof rawRel === 'string' ? JSON.parse(rawRel) : rawRel;
              relativeValueNum = parsed.relative_value ?? parsed.value ?? parsed.diff ?? parsed.result ?? parsed.Result;
            } catch (e) {}
          }
          
          if (relativeValueNum === null && indicators['JSON 1']) {
            try {
              const json1 = typeof indicators['JSON 1'] === 'string' ? JSON.parse(indicators['JSON 1']) : indicators['JSON 1'];
              if (json1['RELATIVE VALUE']) {
                const relData = typeof json1['RELATIVE VALUE'] === 'string' ? JSON.parse(json1['RELATIVE VALUE']) : json1['RELATIVE VALUE'];
                relativeValueNum = relData.relative_value ?? relData.value;
              }
            } catch (e) {}
          }

          if (relativeValueNum === null || isNaN(relativeValueNum)) {
            const txt = String(rawRel?.Summary || rawRel?.summary || '');
            const match = txt.match(/by\s+([-+]?\d+\.?\d*)\s*%/);
            if (match) {
              const val = parseFloat(match[1]);
              if (txt.toLowerCase().includes('outperformed')) relativeValueNum = Math.abs(val);
              else if (txt.toLowerCase().includes('underperformed')) relativeValueNum = -Math.abs(val);
              else relativeValueNum = val;
            }
          }

          if (relativeValueNum !== null && !isNaN(relativeValueNum)) {
            isUp = relativeValueNum >= 0;
            return (
              <div className="pt-2">
                <div className={`rounded-3xl p-6 border-2 flex items-center justify-between shadow-xl ${isUp ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Relative Value to Index</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Benchmark Comparison</span>
                  </div>
                  <span className={`text-4xl font-black italic tracking-tighter ${isUp ? 'text-[#10b981]' : 'text-red-500'} drop-shadow-md`}>
                    {isUp ? '+' : ''}{Number(relativeValueNum).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Mobile Disclaimer */}
        <div className="pt-8 text-center pb-4">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] italic max-w-[200px] mx-auto leading-relaxed">
            Mobile analysis limited; check desktop app for more in-depth information
          </p>
        </div>
      </div>
    </div>
  );
}
