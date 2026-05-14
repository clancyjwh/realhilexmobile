import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { formatScore } from '../utils/format';
import { formatTeamName } from '../utils/text';

const NHL_KEYS: Record<string, string> = {
  points_pct: 'Points %',
  last_10: 'Last 10',
  goal_diff: 'Goal Diff',
  home_away: 'Venue Edge',
  streak: 'Streak',
  goalie: 'Goalie',
  h2h: 'H2H',
  rest: 'Rest'
};

const getLabel = (key: string, isNHL: boolean) => {
  if (isNHL && NHL_KEYS[key]) return NHL_KEYS[key];
  if (key === 'win_rate') return 'Win Rate';
  if (key === 'home_away') return 'Home/Away';
  if (key === 'recent_form') return 'Recent Form';
  if (key === 'goal_difference') return 'Goal Diff';
  return key.replace(/_/g, ' ');
};

const BreakdownRow = ({ label, value }: { label: string; value: number }) => {
  const isPositive = value >= 0;
  const barWidth = Math.abs(value) * 5; // 0 to 50%
  
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-black italic ${value > 0 ? 'text-[#22c55e]' : value < 0 ? 'text-red-500' : 'text-slate-500'}`}>
          {value > 0 ? '+' : ''}{formatScore(value, 1)}
        </span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full relative overflow-hidden">
        <div 
          className={`absolute h-full transition-all duration-1000 ${value >= 0 ? 'bg-[#22c55e]' : 'bg-red-500'}`}
          style={{ 
            left: value >= 0 ? '50%' : `${50 - barWidth}%`, 
            width: `${barWidth}%` 
          }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10" />
      </div>
    </div>
  );
};

const TeamPanel = ({ team, type, isNHL, sport, crestUrl }: { team: any; type: 'AWAY' | 'HOME'; isNHL: boolean; sport?: string; crestUrl?: string }) => {
  const isPositive = team.score > 0;
  const bgColor = isPositive ? 'bg-green-900/10' : 'bg-red-900/10';

  let logoUrl = crestUrl || '';
  const teamTla = (team.tla || '').toLowerCase();
  const teamCode = (team.code || team.abbreviation || '').toUpperCase();

  if (!logoUrl) {
    if (isNHL && teamCode) {
      logoUrl = `https://assets.nhle.com/logos/nhl/svg/${teamCode}_light.svg`;
    } else if (sport === 'nba' && teamCode) {
      logoUrl = `https://a.espncdn.com/i/teamlogos/nba/500/${teamCode.toLowerCase()}.png`;
    } else if (sport === 'soccer') {
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
      
      const teamName = team.name || "";
      const code = WC_MAP[teamName] || WC_MAP[teamName.replace(' Republic', '')];
      
      if (code) {
        logoUrl = `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/world-cup/${code}.png`;
      } else if (teamTla || teamName) {
        const lowerName = teamName.toLowerCase();
        const slug = (lowerName.includes('paris saint-germain') || teamTla?.toUpperCase() === 'PSG') ? 'psg' : (teamTla || '').toLowerCase();
        if (slug) {
          logoUrl = `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/ucl/${slug}.png`;
        }
      }
    } else if (team.logo_url) {
      logoUrl = team.logo_url.startsWith('http') 
        ? team.logo_url 
        : `https://hilex-nhl-production.up.railway.app/proxy/image?url=${encodeURIComponent(team.logo_url)}`;
    }
  }

  return (
    <div className={`flex-1 flex flex-col items-center p-4 border-r border-white/5 last:border-r-0 ${bgColor}`}>
      <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-6 block">{type}</span>
      
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center p-2 mb-3 shadow-xl border border-white/10">
        {logoUrl ? (
           <img 
             src={logoUrl} 
             alt={team.name} 
             className="w-full h-full object-contain drop-shadow-md" 
             onError={(e) => (e.currentTarget.style.display = 'none')} 
           />
        ) : (
          <span className="text-xl font-black italic text-white/50">{team.name?.substring(0, 3)}</span>
        )}
      </div>

      <h3 className="text-sm font-black italic uppercase text-center leading-tight mb-2 h-10 flex items-center">{formatTeamName(team.name)}</h3>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{team.code || team.abbreviation || teamTla?.toUpperCase()}</span>
      </div>

      <div 
        className="w-full h-2 rounded-full mb-2" 
        style={{ background: 'linear-gradient(to right, #B71C1C, #6B7280, #22c55e)' }}
      />
      <div className="w-full h-4 mb-4" /> {/* Spacer */}

      <div className={`text-4xl font-black italic tracking-tighter mb-8 ${isPositive ? 'text-[#22c55e]' : 'text-red-500'} drop-shadow-lg`}>
        {isPositive ? '+' : ''}{formatScore(team.score, 1)}
      </div>

      <div className="w-full">
        <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-4 text-center border-b border-white/10 pb-2">Indicators</h4>
        <div className="space-y-1">
          {(() => {
            const breakdown = { ...team.breakdown };
            delete breakdown.pp_pk;
            delete breakdown.series;
            delete breakdown.is_back_to_back;
            delete breakdown.days_rest;
            
            if (team.squad_strength !== undefined && breakdown.squad_strength === undefined) {
              breakdown.squad_strength = team.squad_strength;
            }
            return Object.entries(breakdown).map(([key, val]) => (
              <BreakdownRow key={key} label={getLabel(key, isNHL)} value={Number(val)} />
            ));
          })()}
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
  const game = location.state?.game;

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
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#12121a] border-b border-white/5 flex items-center justify-between shrink-0 px-4 py-4" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(64px + env(safe-area-inset-top))' }}>
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Matchup Intelligence</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-grow flex overflow-y-auto" style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
        <TeamPanel 
          team={analysis.away_team} 
          type="AWAY" 
          isNHL={isNHL} 
          sport={sport} 
          crestUrl={game?.away_crest}
        />
        <TeamPanel 
          team={analysis.home_team} 
          type="HOME" 
          isNHL={isNHL} 
          sport={sport} 
          crestUrl={game?.home_crest}
        />
      </div>

      {/* Mobile Disclaimer */}
      <div className="p-6 text-center bg-[#0a0a0f] border-t border-white/5 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.2em] italic max-w-[200px] mx-auto leading-relaxed">
          Mobile analysis limited; check desktop app for more in-depth information
        </p>
      </div>
    </div>
  );
}
