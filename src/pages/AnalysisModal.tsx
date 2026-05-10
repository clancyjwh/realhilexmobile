import React from 'react';
import { X, Info } from 'lucide-react';
import { formatScore, getHeatScoreBgColor } from '../utils/format';

interface AnalysisModalProps {
  entity: any;
  financialData?: any;
  onClose: () => void;
}

const IndicatorTile = ({ label, score }: { label: string; score: number }) => (
  <div 
    className="rounded-xl p-4 flex flex-col justify-between aspect-square border border-white/5"
    style={{ backgroundColor: getHeatScoreBgColor(score) }}
  >
    <div className="flex justify-between items-start">
      <span className="text-[9px] font-black uppercase tracking-widest text-white opacity-80">{label}</span>
      <Info size={12} className="text-white opacity-40" />
    </div>
    <div className="text-xl font-black italic tracking-tighter text-white">
      {score > 0 ? '+' : ''}{formatScore(score, 1)}
    </div>
  </div>
);

const BreakdownRow = ({ label, value }: { label: string; value: any }) => {
  const numValue = parseFloat(value) || 0;
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label.replace(/_/g, ' ')}</span>
          <Info size={10} className="text-slate-600" />
        </div>
        <span className="text-xs font-black italic text-[#00C853]">{formatScore(numValue, 1)}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#00C853] rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, (numValue + 10) * 5))}%` }}
        />
      </div>
    </div>
  );
};

export default function AnalysisModal({ entity, financialData, onClose }: AnalysisModalProps) {
  const isFinancial = !entity.sport;
  const isUFC = entity.sport?.toLowerCase() === 'ufc';
  
  // HeatScore Slider Marker Position (-10 to +10)
  const scoreToUse = typeof entity.unifiedScore !== 'undefined' ? entity.unifiedScore : (entity.score || 0);
  const markerPos = ((scoreToUse + 10) / 20) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-6 flex justify-between items-start">
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400">
          <X size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto px-6 pb-12">
        {/* Top Entity Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div 
            className="w-28 h-28 rounded-full border-4 mb-4 flex items-center justify-center p-1 bg-black/20 overflow-hidden"
            style={{ borderColor: entity.score_color || '#00C853' }}
          >
            {(() => {
              const url = entity.headshot_url || entity.logo_url;
              const isValid = url && (url.startsWith('http') || url.startsWith('/'));
              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-black text-white/30 uppercase absolute inset-0 flex items-center justify-center z-0">
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
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
            {entity.name}
          </h1>
          <div className="text-[10px] font-black text-[#00C853] bg-[#00C853]/10 px-3 py-1 rounded-full border border-[#00C853]/20 uppercase tracking-widest">
            {entity.org || entity.sport || 'Financial'}
          </div>
        </div>

        {/* HeatScore Slider Section */}
        <div className="bg-[#12121a] border border-white/5 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="relative h-2 w-full rounded-full mb-4 overflow-visible bg-gradient-to-r from-[#B71C1C] via-[#9E9E9E] to-[#00C853]">
            {/* White Marker */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-black rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
              style={{ left: `calc(${markerPos}% - 6px)` }}
            />
            {/* Labels */}
            <div className="absolute -top-6 left-0 text-[8px] font-black text-slate-500">-10</div>
            <div className="absolute -top-6 right-0 text-[8px] font-black text-slate-500">+10</div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Global HeatScore</span>
            <div className="text-6xl font-black italic tracking-tighter" style={{ color: entity.score_color || '#00C853' }}>
              {scoreToUse > 0 ? '+' : ''}{formatScore(scoreToUse, 1)}
            </div>
          </div>
        </div>

        {/* Breakdown / Indicators */}
        <div className="mb-8 px-2">
          <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">
            {isFinancial || isUFC ? 'Institutional Indicators' : 'Performance Breakdown'}
          </h2>

          {isFinancial && financialData ? (
            <div className="space-y-8">
              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                <IndicatorTile label="SMA" score={financialData.indicator_json?.SMA?.signal || 0} />
                <IndicatorTile label="RSI" score={financialData.indicator_json?.RSI?.signal || 0} />
                <IndicatorTile label="CCI" score={financialData.indicator_json?.CCI?.signal || 0} />
                <IndicatorTile label="MACD" score={financialData.indicator_json?.MACD?.signal || 0} />
              </div>

              {/* Accuracy Horizon */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Historical Accuracy</h3>
                  <span className="text-[8px] font-black text-[#00C853] uppercase tracking-widest opacity-60">
                    {financialData.dominant_indicator}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(financialData.optimized_parameters || {})
                    .filter(([key]) => !['Analysis', 'Win Rate', 'Parameters'].includes(key))
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([key, rawVal]: [string, any]) => {
                      let val = rawVal;
                      if (typeof rawVal === 'string') {
                        try { val = JSON.parse(rawVal); } catch (e) {}
                      }
                      const isCorrect = val && (val.Correct === true || val.Correct === 'true' || val.correct === true || val.Correct === 'True');
                      return (
                        <div key={key} className={`rounded-lg p-2 text-center border ${isCorrect ? 'bg-[#00C853]/10 border-[#00C853]/20 text-[#00C853]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                          <div className="text-[8px] font-black uppercase mb-1">{key}</div>
                          <div className="text-[7px] font-bold uppercase tracking-tighter">{isCorrect ? 'Accurate' : 'Miss'}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(entity.breakdown || {}).map(([key, val]) => (
                <BreakdownRow key={key} label={key} value={val} />
              ))}
            </div>
          )}
        </div>

        {/* Intelligence Quote */}
        {entity.why && (
          <div className="bg-[#12121a] border-l-4 border-[#00C853] p-6 rounded-r-2xl shadow-xl">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Scouting Intelligence</span>
            <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
              "{entity.why}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
