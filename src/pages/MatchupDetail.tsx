import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, Shield, Zap, Target, Users, Brain, ListChecks } from 'lucide-react';
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

const INDICATOR_INFO: Record<string, { label: string; icon: any }> = {
  win_rate: { label: 'Win Rate', icon: Zap },
  home_away: { label: 'Home/Away', icon: Shield },
  recent_form: { label: 'Recent Form', icon: Activity },
  goal_difference: { label: 'Goal Diff', icon: Target }
};

const getLabel = (key: string, isNHL: boolean) => {
  if (isNHL && NHL_KEYS[key]) return NHL_KEYS[key];
  if (INDICATOR_INFO[key]) return INDICATOR_INFO[key].label;
  return key.replace(/_/g, ' ');
};

const getIcon = (key: string) => {
  if (INDICATOR_INFO[key]) return INDICATOR_INFO[key].icon;
  return Activity;
};

const BreakdownRow = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => {
  const isPositive = value > 0;
  return (
    <div className="space-y-1.5 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/5 text-slate-400">
            <Icon size={10} />
          </div>
          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{label}</span>
        </div>
        <span className={`text-[10px] font-black italic ${isPositive ? 'text-[#22c55e]' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{formatScore(value, 1)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isPositive ? 'bg-[#22c55e]' : 'bg-red-500'}`}
          style={{ width: `${Math.min(100, Math.max(0, (value + 10) * 5))}%` }}
        />
      </div>
    </div>
  );
};

const TeamPanel = ({ team, type, isNHL, sport }: { team: any; type: 'AWAY' | 'HOME'; isNHL: boolean; sport?: string }) => {
  const isPositive = team.score > 0;
  const bgColor = isPositive ? 'bg-green-900/10' : 'bg-red-900/10';

  let logoUrl = '';
  const teamId = team.id || '';
  const teamTla = (team.tla || '').toLowerCase();
  const teamCode = (team.code || team.abbreviation || '').toUpperCase();

  if (isNHL && teamCode) {
    logoUrl = `https://assets.nhle.com/logos/nhl/svg/${teamCode}_light.svg`;
  } else if (sport === 'nba' && teamCode) {
    logoUrl = `https://a.espncdn.com/i/teamlogos/nba/500/${teamCode.toLowerCase()}.png`;
  } else if (sport === 'soccer') {
    if (teamTla) {
      logoUrl = `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/ucl/${teamTla}.png`;
    } else {
      const slug = (team.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      logoUrl = `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/ucl/${slug}.png`;
    }
  } else if (team.logo_url) {
    logoUrl = team.logo_url.startsWith('http') 
      ? team.logo_url 
      : `https://hilex-nhl-production.up.railway.app/proxy/image?url=${encodeURIComponent(team.logo_url)}`;
  }

  const formArray = (team.form?.form_string || '').split('').slice(-5);

  return (
    <div className={`flex-1 flex flex-col items-center p-5 border-r border-white/5 last:border-r-0 ${bgColor}`}>
      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 block">{type}</span>
      
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center p-3 mb-4 shadow-2xl border border-white/10 relative overflow-hidden">
        {logoUrl ? (
           <img 
             src={logoUrl} 
             alt={team.name} 
             className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
             onError={(e) => (e.currentTarget.style.display = 'none')} 
           />
        ) : (
          <span className="text-xl font-black italic text-white/30">{team.name?.substring(0, 3)}</span>
        )}
      </div>

      <h3 className="text-sm font-black italic uppercase text-center leading-tight mb-2 h-10 flex items-center">{team.name}</h3>
      
      {formArray.length > 0 && (
        <div className="flex gap-1 mb-6">
          {formArray.map((f: string, i: number) => (
            <div key={i} className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${f === 'W' ? 'bg-green-500 text-black' : f === 'D' ? 'bg-slate-600 text-white' : 'bg-red-500 text-white'}`}>
              {f}
            </div>
          ))}
        </div>
      )}

      {/* HeatScore Slider */}
      <div className="w-full px-2 mb-6">
        <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
          <span>-10</span>
          <span>HEATSCORE</span>
          <span>+10</span>
        </div>
        <div 
          className="w-full h-1.5 rounded-full relative" 
          style={{ background: 'linear-gradient(to right, #B71C1C, #6B7280, #22c55e)' }}
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ left: `${((team.score + 10) / 20) * 100}%` }}
          />
        </div>
      </div>

      <div className={`text-4xl font-black italic tracking-tighter mb-8 ${isPositive ? 'text-[#22c55e]' : 'text-red-500'} drop-shadow-lg`}>
        {isPositive ? '+' : ''}{formatScore(team.score, 2)}
      </div>

      <div className="w-full">
        <h4 className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-5 text-center border-b border-white/5 pb-2">Indicators</h4>
        <div className="space-y-1">
          {Object.entries(team.breakdown || {}).map(([key, val]) => (
            <BreakdownRow key={key} label={getLabel(key, isNHL)} value={Number(val)} icon={getIcon(key)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MatchupDetail() {
  const { sport } = useParams();
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

  // Determine if NHL based on url param
  const isNHL = sport === 'nhl';

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col text-white">
      <div className="p-4 bg-[#12121a] border-b border-white/5 flex items-center justify-between shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Matchup Intelligence</span>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="flex shrink-0">
        <TeamPanel team={analysis.away_team} type="AWAY" isNHL={isNHL} sport={sport} />
        <TeamPanel team={analysis.home_team} type="HOME" isNHL={isNHL} sport={sport} />
      </div>

      <div className="p-6 space-y-8 pb-12">
        {/* Intelligence Summary */}
        <div className="bg-[#12121a] rounded-3xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="text-[#22c55e]" size={20} />
            <h3 className="text-sm font-black italic uppercase tracking-tighter">Platform Intelligence</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {analysis.summary || 'Strategic analysis in progress for this matchup...'}
          </p>
        </div>

        {/* Tactical Factors */}
        {analysis.intelligence?.xfactors && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <ListChecks className="text-[#22c55e]" size={18} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tactical Factors</h3>
            </div>
            <div className="space-y-3">
              {analysis.intelligence.xfactors.split(' - ').filter((i: string) => i.trim()).map((factor: string, idx: number) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex gap-4 items-start">
                   <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_#22c55e]" />
                   <p className="text-[11px] text-slate-300 font-bold leading-relaxed">{factor.replace(/^[•\-\s]+/, '').replace(/\*\*/g, '').trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Scorers / Players */}
        {(analysis.home_team.key_scorers || analysis.away_team.key_scorers) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <Users className="text-[#22c55e]" size={18} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Impact Players</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
               {[...(analysis.home_team.key_scorers || []), ...(analysis.away_team.key_scorers || [])].slice(0, 4).map((player: any, idx: number) => (
                 <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white italic uppercase tracking-tight">{player.name}</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{player.played_matches || 0} Matches Played</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-500 uppercase">G</span>
                          <span className="text-xs font-black text-emerald-400">{player.goals}</span>
                       </div>
                       <div className="flex flex-col items-center border-l border-white/5 pl-4">
                          <span className="text-[8px] font-black text-slate-500 uppercase">A</span>
                          <span className="text-xs font-black text-[#22c55e]">{player.assists}</span>
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
