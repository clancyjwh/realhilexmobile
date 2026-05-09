import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { formatScore } from '../utils/format';

const UFC_KEYS = [
  { key: 'recent_form', label: 'Recent Form' },
  { key: 'striking_accuracy', label: 'Striking Acc' },
  { key: 'striking_defense', label: 'Striking Def' },
  { key: 'takedown_defense', label: 'TD Defense' },
  { key: 'finish_rate', label: 'Finish Rate' }
];

const BreakdownRow = ({ label, value }: { label: string; value: number }) => {
  const isPositive = value > 0;
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-black italic ${isPositive ? 'text-[#00C853]' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{formatScore(value, 1)}
        </span>
      </div>
      <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isPositive ? 'bg-[#00C853]' : 'bg-red-500'}`}
          style={{ width: `${Math.min(100, Math.max(0, (value + 10) * 5))}%` }}
        />
      </div>
    </div>
  );
};

const FighterPanel = ({ fighter, type }: { fighter: any; type: 'RED CORNER' | 'BLUE CORNER' }) => {
  const isRed = type === 'RED CORNER';
  const markerPos = ((fighter.score + 10) / 20) * 100;
  
  // Use heatscore color for numbers, but ring color based on corner
  const scoreColor = fighter.score > 0 ? 'text-[#00C853]' : 'text-red-500';
  const ringColor = isRed ? 'border-red-500' : 'border-blue-500';

  const headshotUrl = fighter.headshot 
    ? `https://hilex-nhl-production.up.railway.app/proxy/image?url=${encodeURIComponent(fighter.headshot)}`
    : '';
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 border-r border-white/5 last:border-r-0 bg-[#0a0a0f]">
      <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 block ${isRed ? 'text-red-500/70' : 'text-blue-500/70'}`}>
        {type}
      </span>
      
      <div className={`w-20 h-20 bg-white/5 rounded-full flex items-center justify-center p-1 mb-3 shadow-xl border-2 ${ringColor}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-black/20 flex items-center justify-center">
          {fighter.headshot ? (
            <img 
              src={headshotUrl} 
              alt={fighter.name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                console.error(`UFC Headshot failed to load for ${fighter.name}:`, e.currentTarget.src);
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-black italic text-white/50">${getInitials(fighter.name)}</span>`;
              }} 
            />
          ) : (
            <span className="text-xl font-black italic text-white/50">{getInitials(fighter.name)}</span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-black italic uppercase text-center leading-tight mb-8">{fighter.name}</h3>

      {/* HeatScore Slider */}
      <div className="w-full relative h-2 rounded-full mb-2 bg-gradient-to-r from-[#B71C1C] via-gray-500 to-[#00C853]">
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-3.5 bg-white rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${markerPos}% - 5px)` }}
        />
      </div>
      <div className="w-full h-4 mb-4" /> {/* Spacer */}

      <div className={`text-4xl font-black italic tracking-tighter mb-8 ${scoreColor} drop-shadow-lg`}>
        {fighter.score > 0 ? '+' : ''}{formatScore(fighter.score, 1)}
      </div>

      <div className="w-full">
        <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-4 text-center border-b border-white/10 pb-2">Indicators</h4>
        {UFC_KEYS.map((item) => (
          <BreakdownRow 
            key={item.key} 
            label={item.label} 
            value={Number(fighter.breakdown?.[item.key] || 0)} 
          />
        ))}
      </div>
    </div>
  );
};

export default function FightDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  if (!analysis) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0a0a0f] text-slate-500 font-bold italic">
        No analysis data available.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col text-white">
      <div className="p-4 bg-[#12121a] border-b border-white/5 flex items-center justify-between shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Combat Intelligence</span>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="flex-grow flex overflow-y-auto">
        <FighterPanel fighter={analysis.fighter_1} type="RED CORNER" />
        <FighterPanel fighter={analysis.fighter_2} type="BLUE CORNER" />
      </div>
    </div>
  );
}
