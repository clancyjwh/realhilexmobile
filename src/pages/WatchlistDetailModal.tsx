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
            
            {indicators.CCI && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">CCI</span>
                  <span className={`text-xs font-black italic ${parseFloat(indicators.CCI.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {indicators.CCI.signal > 0 ? '+' : ''}{indicators.CCI.signal}
                  </span>
                </div>
                {indicators.CCI.analysis && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{indicators.CCI.analysis}</p>}
              </div>
            )}

            {indicators.RSI && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">RSI</span>
                  <span className={`text-xs font-black italic ${parseFloat(indicators.RSI.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {indicators.RSI.signal > 0 ? '+' : ''}{indicators.RSI.signal}
                  </span>
                </div>
                {indicators.RSI.analysis && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{indicators.RSI.analysis}</p>}
              </div>
            )}

            {indicators.SMA && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2 col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">SMA ({indicators.SMA.fast_period}/{indicators.SMA.slow_period})</span>
                  <span className={`text-xs font-black italic ${parseFloat(indicators.SMA.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {indicators.SMA.signal > 0 ? '+' : ''}{indicators.SMA.signal}
                  </span>
                </div>
                {indicators.SMA.explanation && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{indicators.SMA.explanation}</p>}
              </div>
            )}

            {indicators.BOLL && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2 col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">Bollinger Bands</span>
                  <span className={`text-xs font-black italic ${parseFloat(indicators.BOLL.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {indicators.BOLL.signal > 0 ? '+' : ''}{indicators.BOLL.signal}
                  </span>
                </div>
                {indicators.BOLL.analysis && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{indicators.BOLL.analysis}</p>}
              </div>
            )}

            {indicators.MACD && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2 col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">MACD</span>
                  <span className={`text-xs font-black italic ${parseFloat(indicators.MACD.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {indicators.MACD.signal > 0 ? '+' : ''}{indicators.MACD.signal}
                  </span>
                </div>
                {indicators.MACD.analysis && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{indicators.MACD.analysis}</p>}
              </div>
            )}

            {roc.signal && (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-2 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded uppercase">Rate of Change</span>
                  <span className={`text-xs font-black italic ${parseFloat(roc.signal) > 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {roc.signal > 0 ? '+' : ''}{roc.signal}
                  </span>
                </div>
                {roc.current_roc && <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">Current ROC: {roc.current_roc}</p>}
              </div>
            )}
            
          </div>
        </div>

        {/* Optimized Parameters Backtest */}
        {params.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Optimized Parameters Backtest</h3>
            <div className="bg-[#12121a] border border-white/5 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Days</th>
                    <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Prediction</th>
                    <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {params.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-4 text-xs font-bold text-slate-400">{p.Daysback || p.days}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${p.Prediction === 'UP' ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-red-500/10 text-red-500'}`}>
                          {p.Prediction}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`text-xs font-black italic ${p.Correct === 'true' || p.Correct === true ? 'text-[#00C853]' : 'text-red-500'}`}>
                            {p.Result}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
