import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { formatScore } from '../utils/format';

const NHL_KEYS: Record<string, string> = {
  points_pct: 'Points %',
  last_10: 'Last 10',
  goal_diff: 'Goal Diff',
  home_away: 'Venue Edge',
  streak: 'Streak',
  goalie: 'Goalie',
  pp_pk: 'PP/PK',
  h2h: 'H2H',
  rest: 'Rest',
  series: 'Series'
};

const getLabel = (key: string, isNHL: boolean) => {
  if (isNHL && NHL_KEYS[key]) return NHL_KEYS[key];
  return key.replace(/_/g, ' ');
};

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

const TeamPanel = ({ team, type, isNHL }: { team: any; type: 'AWAY' | 'HOME'; isNHL: boolean }) => {
  const isPositive = team.score > 0;
  const bgColor = isPositive ? 'bg-green-900/40' : 'bg-red-900/40';
  const markerPos = ((team.score + 10) / 20) * 100;

  // Derive Logo URL
  let logoUrl = '/logo.png';
  if (isNHL && team.code) {
    logoUrl = `https://assets.nhle.com/logos/nhl/svg/${team.code.toUpperCase()}_light.svg`;
  } else if (team.code) {
    // Default to NBA if not NHL
    logoUrl = `https://cdn.nba.com/logos/nba/${team.code}/global/L/logo.svg`;
  } else if (team.logo_url) {
    logoUrl = `https://hilex-nhl-production.up.railway.app/proxy/image?url=${encodeURIComponent(team.logo_url)}`;
  }

  return (
    <div className={`flex-1 flex flex-col items-center p-4 border-r border-white/5 last:border-r-0 ${bgColor}`}>
      <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-6 block">{type}</span>
      
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center p-2 mb-3 shadow-xl border border-white/10">
        {team.code || team.abbreviation ? (
           <img 
             src={logoUrl} 
             alt={team.code || team.abbreviation} 
             className="w-full h-full object-contain drop-shadow-md" 
             onError={(e) => {
               console.error(`Matchup Logo failed to load for ${team.name}:`, e.currentTarget.src);
               e.currentTarget.style.display = 'none';
             }} 
           />
        ) : (
          <span className="text-xl font-black italic text-white/50">{team.name?.substring(0, 3)}</span>
        )}
      </div>

      <h3 className="text-sm font-black italic uppercase text-center leading-tight mb-1">{team.name}</h3>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{team.code || team.abbreviation}</span>
        {isNHL && team.series_wins !== undefined && (
          <span className="text-[9px] font-bold text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
            {team.series_wins} WINS
          </span>
        )}
      </div>

      {/* HeatScore Slider */}
      <div className="w-full relative h-2 rounded-full mb-2 bg-gradient-to-r from-[#B71C1C] via-gray-500 to-[#00C853]">
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-3.5 bg-white rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${markerPos}% - 5px)` }}
        />
      </div>
      <div className="w-full h-4 mb-4" /> {/* Spacer */}

      <div className={`text-4xl font-black italic tracking-tighter mb-8 ${isPositive ? 'text-[#00C853]' : 'text-red-500'} drop-shadow-lg`}>
        {isPositive ? '+' : ''}{formatScore(team.score, 1)}
      </div>

      <div className="w-full">
        <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-4 text-center border-b border-white/10 pb-2">Indicators</h4>
        {Object.entries(team.breakdown || {}).map(([key, val]) => (
          <BreakdownRow key={key} label={getLabel(key, isNHL)} value={Number(val)} />
        ))}
      </div>
    </div>
  );
};

export default function MatchupDetail() {
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

  // Determine if NHL based on presence of series_wins in request body/response or team fields
  const isNHL = analysis.home_team?.series_wins !== undefined || analysis.home_team?.abbreviation?.length === 3 || analysis.home_team?.code?.length === 3;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col text-white">
      <div className="p-4 bg-[#12121a] border-b border-white/5 flex items-center justify-between shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Matchup Intelligence</span>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="flex-grow flex overflow-y-auto">
        <TeamPanel team={analysis.away_team} type="AWAY" isNHL={isNHL} />
        <TeamPanel team={analysis.home_team} type="HOME" isNHL={isNHL} />
      </div>
    </div>
  );
}
