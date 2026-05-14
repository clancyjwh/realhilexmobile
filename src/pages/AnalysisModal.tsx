import React from 'react';
import { X, Info } from 'lucide-react';
import { formatScore, getHeatScoreBgColor, getSignalColors } from '../utils/format';
import { getEntityImageUrl } from './HomePage';

interface AnalysisModalProps {
  entity: any;
  financialData?: any;
  onClose: () => void;
}

const IndicatorTile = ({ label, score, definition, onShowDef }: { label: string; score: number; definition: string; onShowDef: (t: string, d: string) => void }) => {
  const colors = getSignalColors(score);
  return (
    <div 
      onClick={() => onShowDef(label, definition)}
      className={`${colors.bg} ${colors.border} border-2 rounded-xl p-3 flex items-center justify-between shadow-md active:scale-95 transition-all cursor-pointer`}
    >
      <span className={`text-[10px] font-black uppercase tracking-widest ${colors.subtext}`}>{label}</span>
      <div className={`text-xl font-bold italic tracking-tighter ${colors.text}`}>
        {score > 0 ? '+' : ''}{formatScore(score, 1)}
      </div>
    </div>
  );
};

const DefinitionModal = ({ title, definition, onClose }: { title: string; definition: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-black italic uppercase text-[#22c55e] tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
          {definition}
        </p>
      </div>
    </div>
  );
};

const BreakdownRow = ({ label, value }: { label: string; value: any }) => {
  const numValue = parseFloat(value) || 0;
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label.replace(/_/g, ' ')}</span>
        </div>
        <span className="text-xs font-black italic text-[#22c55e]">{formatScore(numValue, 1)}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#22c55e] rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, (numValue + 10) * 5))}%` }}
        />
      </div>
    </div>
  );
};

export default function AnalysisModal({ entity, financialData, onClose }: AnalysisModalProps) {
  const [activeDef, setActiveDef] = React.useState<{ title: string; def: string } | null>(null);
  const isFinancial = !entity.sport;
  const isUFC = entity.sport?.toLowerCase() === 'ufc';
  
  const scoreToUse = typeof entity.unifiedScore !== 'undefined' ? entity.unifiedScore : (entity.score || 0);
  const markerPos = ((scoreToUse + 10) / 20) * 100;
  const signalColors = getSignalColors(scoreToUse);
  const finalColor = isFinancial ? signalColors.hex : (entity.score_color || '#22c55e');

  if (isFinancial && !financialData) return <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex items-center justify-center text-white/20 uppercase tracking-[0.2em] font-black">Loading...</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f] px-6 py-4 flex justify-between items-center border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(64px + env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <X size={24} />
        </button>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Intelligence Analysis</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-grow overflow-y-auto px-6" style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
        <div className="flex flex-col items-center text-center mb-8">
          {!isFinancial && (
            <div 
              className="w-28 h-28 rounded-full border-4 mb-4 flex items-center justify-center p-1 bg-black/20 overflow-hidden"
              style={{ borderColor: finalColor }}
            >
              {(() => {
                const url = getEntityImageUrl(entity);
                const isValid = url && (url.startsWith('http') || url.startsWith('/'));
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className={`text-4xl font-black ${signalColors.isGold ? 'text-black/30' : 'text-white/30'} uppercase absolute inset-0 flex items-center justify-center z-0`}>
                      {entity.name.charAt(0)}
                    </span>
                    {isValid && (
                      <img 
                        src={url} 
                        alt="" 
                        className="w-full h-full object-cover rounded-full shadow-2xl relative z-10 bg-black/20"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          <h1 className={`font-black italic uppercase tracking-tighter text-white mb-2 leading-none ${isFinancial ? 'text-6xl mt-4' : 'text-4xl'}`}>
            {isFinancial ? (entity.symbol || entity.name) : entity.name}
          </h1>
          <div className="text-[10px] font-black text-white bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest" style={{ color: finalColor, borderColor: finalColor, borderWidth: '1px' }}>
            {entity.org || entity.sport || 'Financial'}
          </div>
        </div>

        <div className="bg-[#12121a] border border-white/5 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="relative h-2 w-full rounded-full mb-4 overflow-visible bg-gradient-to-r from-[#B71C1C] via-[#9E9E9E] to-[#22c55e]">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-black rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
              style={{ left: `calc(${markerPos}% - 6px)` }}
            />
            <div className="absolute -top-6 left-0 text-[8px] font-black text-slate-500">-10</div>
            <div className="absolute -top-6 right-0 text-[8px] font-black text-slate-500">+10</div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Global HeatScore</span>
            <div className={`text-6xl font-black italic tracking-tighter ${isFinancial ? signalColors.text : ''}`} style={!isFinancial ? { color: finalColor } : {}}>
              {scoreToUse > 0 ? '+' : ''}{formatScore(scoreToUse, 1)}
            </div>
          </div>
        </div>

        <div className="mb-8 px-2">
          <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">
            {isFinancial || isUFC ? 'Signal Indicators' : 'Performance Breakdown'}
          </h2>

          {isFinancial && financialData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                <IndicatorTile label="CCI" score={financialData.indicator_json?.CCI?.signal || 0} definition="Commodity Channel Index" onShowDef={(t, d) => setActiveDef({ title: t, def: d })} />
                <IndicatorTile label="RSI" score={financialData.indicator_json?.RSI?.signal || 0} definition="Relative Strength Index" onShowDef={(t, d) => setActiveDef({ title: t, def: d })} />
                <IndicatorTile label="SMA" score={financialData.indicator_json?.SMA?.signal || 0} definition="Simple Moving Average" onShowDef={(t, d) => setActiveDef({ title: t, def: d })} />
                <IndicatorTile label="BOLL" score={financialData.indicator_json?.BOLL?.signal || 0} definition="Bollinger Bands" onShowDef={(t, d) => setActiveDef({ title: t, def: d })} />
                <IndicatorTile label="MACD" score={financialData.indicator_json?.MACD?.signal || 0} definition="Moving Average Convergence Divergence" onShowDef={(t, d) => setActiveDef({ title: t, def: d })} />
                <IndicatorTile 
                  label="ROC" 
                  score={financialData.indicator_json?.ROC?.signal ?? financialData.indicator_json?.Rate_of_Change?.rate_of_change?.signal ?? financialData.indicator_json?.Rate_of_Change?.signal ?? 0} 
                  definition="Rate of Change" 
                  onShowDef={(t, d) => setActiveDef({ title: t, def: d })} 
                />
              </div>

              <div className="space-y-4">
                <div 
                  onClick={() => setActiveDef({ title: "Top Historical Parameter", def: "This backtests by checking monthly points in history and measuring how prices moved over the following ten days compared to the rule's direction." })}
                  className="flex items-center justify-between active:opacity-60 transition-opacity cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Top Historical Parameter</h3>
                    <Info size={10} className="text-slate-700" />
                  </div>
                  <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-widest opacity-60">
                    Monthly Snapshots
                  </span>
                </div>
                
                <div className="flex flex-col bg-[#12121a] p-4 rounded-xl border border-white/5 space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Indicator</span>
                    <span className="text-sm font-black text-white">{financialData.horizon_json?.Analysis || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parameters</span>
                    <span className="text-sm font-black text-white">{financialData.horizon_json?.Parameters || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy Rate</span>
                    <span className="text-sm font-black text-[#22c55e]">{financialData.horizon_json?.['Win Rate'] || 'N/A'}</span>
                  </div>
                </div>

                {/* Monthly Snapshots Grid */}
                {(() => {
                  const rawParams = financialData.horizon_json || {};
                  const params: any[] = [];
                  Object.keys(rawParams).forEach(key => {
                    if (['Analysis', 'Parameters', 'Win Rate'].includes(key)) return;
                    try {
                      const parsed = typeof rawParams[key] === 'string' ? JSON.parse(rawParams[key]) : rawParams[key];
                      params.push({ days: parseInt(key), ...parsed });
                    } catch (e) {}
                  });
                  params.sort((a, b) => a.days - b.days);

                  if (params.length === 0) return null;

                  return (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {params.map((p, idx) => {
                        const isCorrect = p.Correct === 'true' || p.Correct === true;
                        return (
                          <div 
                            key={idx}
                            className={`rounded-xl p-3 flex flex-col justify-center items-center text-center border aspect-square ${isCorrect ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}
                          >
                            <span className={`text-xl font-black ${isCorrect ? 'text-[#10b981]' : 'text-red-500'}`}>
                              {p.Daysback || p.days}
                            </span>
                            <span className={`text-[8px] mt-0.5 font-black uppercase tracking-widest ${isCorrect ? 'text-[#10b981]/70' : 'text-red-500/70'}`}>
                              days
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const showRelativeValue = entity.org === 'American Stock' || entity.org === 'Canadian Stock' || entity.org === 'Cryptocurrency';
                if (!showRelativeValue) return null;

                let relativeValueNum = null;
                let isUp = false;
                if (financialData?.relative_value || financialData?.relative_value_json) {
                  let parsedData = financialData.relative_value || financialData.relative_value_json;
                  if (typeof parsedData === 'string') {
                    try { parsedData = JSON.parse(parsedData); } catch (e) {}
                  }
                  if (parsedData?.relative_value) parsedData = parsedData.relative_value;
                  
                  if (parsedData?.Result !== undefined) relativeValueNum = parseFloat(parsedData.Result);
                  else if (parsedData?.result !== undefined) relativeValueNum = parseFloat(parsedData.result);
                  
                  if (relativeValueNum === null || isNaN(relativeValueNum)) {
                    const txt = String(parsedData?.Summary || parsedData?.summary || '');
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
                      <div className="mt-6 mb-2">
                        <div 
                          onClick={() => setActiveDef({ 
                            title: "Relative Value", 
                            def: `Compare ${entity.symbol || entity.name}'s historical price movements against a selected index to observe how closely they have moved together in the past.` 
                          })}
                          className={`rounded-xl p-4 border-2 flex items-center justify-between shadow-lg active:scale-95 transition-all cursor-pointer ${isUp ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Relative Value to Index</span>
                            <Info size={10} className="text-white/40" />
                          </div>
                          <span className={`text-2xl font-black italic tracking-tighter ${isUp ? 'text-[#10b981]' : 'text-red-500'}`}>
                            {isUp ? '+' : ''}{Number(relativeValueNum).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(entity.breakdown || {}).map(([key, val]) => (
                <BreakdownRow key={key} label={key} value={val} />
              ))}
            </div>
          )}
        </div>

        {entity.why && (
          <div className="bg-[#12121a] border-l-4 border-[#22c55e] p-6 rounded-r-2xl shadow-xl">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Scouting Intelligence</span>
            <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
              "{entity.why}"
            </p>
          </div>
        )}

        {/* Mobile Disclaimer */}
        <div className="mt-12 mb-8 text-center px-4">
          <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em] italic leading-relaxed">
            Mobile analysis limited; check desktop app for more in-depth information
          </p>
        </div>
      </div>

      {activeDef && (
        <DefinitionModal 
          title={activeDef.title} 
          definition={activeDef.def} 
          onClose={() => setActiveDef(null)} 
        />
      )}
    </div>
  );
}
