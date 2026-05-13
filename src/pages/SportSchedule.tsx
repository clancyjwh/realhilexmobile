import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';


interface Game {
  game_id: string | number;
  home_team: string;
  away_team: string;
  home_series_wins?: number;
  away_series_wins?: number;
  date?: string;
}

export default function SportSchedule() {
  const { sport } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingGameId, setAnalyzingGameId] = useState<string | number | null>(null);

  const getScheduleUrl = () => {
    if (sport === 'nhl') return 'https://hilex-nhl-production.up.railway.app/nhl/schedule';
    if (sport === 'nba') return 'https://hilex-nhl-production.up.railway.app/nba/schedule';
    if (sport === 'soccer') return 'https://hilex-nhl-production.up.railway.app/ucl/schedule'; // Primary soccer is UCL
    return '';
  };

  const getAnalyzeUrl = () => {
    if (sport === 'nhl') return 'https://hilex-nhl-production.up.railway.app/nhl/analyze';
    if (sport === 'nba') return 'https://hilex-nhl-production.up.railway.app/nba/analyze';
    if (sport === 'soccer') return 'https://hilex-nhl-production.up.railway.app/ucl/analyze';
    return '';
  };

  useEffect(() => {
    fetchSchedule();
  }, [sport]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const url = getScheduleUrl();
      if (!url) return;

      const res = await fetch(url);
      const data = await res.json();
      let gameList: any[] = [];

      if (sport === 'soccer') {
        // Handle UCL Matches
        if (data.matches) {
          data.matches.forEach((m: any) => {
            gameList.push({
              game_id: m.match_id,
              home_team: m.home_team.name,
              away_team: m.away_team.name,
              home_team_id: m.home_team.id,
              away_team_id: m.away_team.id,
              home_crest: m.home_team.crest,
              away_crest: m.away_team.crest,
              date: m.utc_date,
              type: 'UCL',
              stage: (m.stage || '').replace(/_/g, ' ')
            });
          });
        }

        // Fetch and Handle World Cup
        try {
          const wcRes = await fetch('https://hilex-nhl-production.up.railway.app/soccer/wc/schedule');
          if (wcRes.ok) {
            const wcData = await wcRes.json();
            // Groups
            Object.entries(wcData.groups || {}).forEach(([groupName, groupMatches]: [string, any]) => {
              groupMatches.forEach((m: any) => {
                gameList.push({
                  game_id: m.id,
                  home_team: m.home_team || 'TBD',
                  away_team: m.away_team || 'TBD',
                  home_team_code: m.home_team_code,
                  away_team_code: m.away_team_code,
                  date: m.kickoff_utc,
                  type: 'WC',
                  stage: `Group ${groupName}`,
                  status: m.status
                });
              });
            });
            // Knockout
            (wcData.knockout || []).forEach((m: any) => {
              gameList.push({
                game_id: m.id,
                home_team: m.home_team || 'TBD',
                away_team: m.away_team || 'TBD',
                home_team_code: m.home_team_code,
                away_team_code: m.away_team_code,
                date: m.kickoff_utc,
                type: 'WC',
                stage: m.round,
                status: m.status
              });
            });
          }
        } catch (e) {
          console.warn("WC schedule fetch failed", e);
        }
      } else {
        gameList = data.games || [];
      }

      setGames(gameList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (game: Game) => {
    setAnalyzingGameId(game.game_id);
    try {
      let body: any = {};
      let endpoint = getAnalyzeUrl();

      if (sport === 'soccer') {
        const isWC = (game as any).type === 'WC';
        if (isWC) {
          endpoint = 'https://hilex-nhl-production.up.railway.app/soccer/wc/analyze';
          body = {
            home_team: game.home_team,
            away_team: game.away_team,
            home_team_code: (game as any).home_team_code,
            away_team_code: (game as any).away_team_code,
            stage: (game as any).stage,
            match_id: game.game_id.toString()
          };
        } else {
          endpoint = 'https://hilex-nhl-production.up.railway.app/ucl/analyze';
          body = {
            home_team_id: (game as any).home_team_id,
            away_team_id: (game as any).away_team_id,
            home_team_name: game.home_team,
            away_team_name: game.away_team,
            stage: (game as any).stage,
            match_date: game.date
          };
        }
      } else {
        body = { home_team: game.home_team, away_team: game.away_team };
        if (sport === 'nhl' && game.home_series_wins !== undefined) {
          body.home_series_wins = game.home_series_wins;
          body.away_series_wins = game.away_series_wins;
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const analysisData = await res.json();
      
      navigate(`/sports/${sport}/matchup`, { state: { analysis: analysisData, game: game } });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingGameId(null);
    }
  };

  return (
    <div className="flex-grow p-4 bg-[#0a0a0f] text-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button onClick={() => navigate('/sports')} className="p-2 bg-[#12121a] rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Schedule</h2>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter mt-1">{sport}</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-[#00D8FF]" size={32} />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center text-slate-500 font-bold italic mt-20">No games scheduled for today.</div>
      ) : (
        <div className="space-y-3">
          {games.map((game, idx) => {
            const isAnalyzing = analyzingGameId === game.game_id;

            let awayLogoUrl = '';
            let homeLogoUrl = '';

            if (sport === 'nhl') {
              awayLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${game.away_team}_light.svg`;
              homeLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${game.home_team}_light.svg`;
            } else if (sport === 'nba') {
              awayLogoUrl = `https://a.espncdn.com/i/teamlogos/nba/500/${game.away_team.toLowerCase()}.png`;
              homeLogoUrl = `https://a.espncdn.com/i/teamlogos/nba/500/${game.home_team.toLowerCase()}.png`;
            } else if (sport === 'soccer') {
              // Try to find TLA or slug for logo
              const getSoccerLogo = (teamName: string) => {
                const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                return `https://avijzlkdukanneylvtrd.supabase.co/storage/v1/object/public/images/football/ucl/${slug}.png`;
              };
              awayLogoUrl = getSoccerLogo(game.away_team);
              homeLogoUrl = getSoccerLogo(game.home_team);
            }

            return (
              <div key={idx} className="bg-[#12121a] border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                     <img src={awayLogoUrl} alt={game.away_team} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <span className="font-black text-lg italic tracking-tight">{game.away_team} @ {game.home_team}</span>
                  <div className="w-8 h-8 flex items-center justify-center">
                     <img src={homeLogoUrl} alt={game.home_team} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                </div>
                
                <button 
                  onClick={() => handleAnalyze(game)}
                  disabled={isAnalyzing}
                  className="bg-[#00D8FF] text-[#0a0a0f] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 min-w-[100px] flex justify-center items-center shadow-[0_0_15px_rgba(0,216,255,0.4)]"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : 'ANALYZE'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
