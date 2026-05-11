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
    if (sport === 'soccer') return 'https://hilex-nhl-production.up.railway.app/soccer/schedule'; // Or UCL
    return '';
  };

  const getAnalyzeUrl = () => {
    if (sport === 'nhl') return 'https://hilex-nhl-production.up.railway.app/nhl/analyze';
    if (sport === 'nba') return 'https://hilex-nhl-production.up.railway.app/nba/analyze';
    if (sport === 'soccer') return 'https://hilex-nhl-production.up.railway.app/soccer/analyze'; // Assuming standard
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
      const gameList = data.games || [];
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
      const body: any = { home_team: game.home_team, away_team: game.away_team };
      if (sport === 'nhl' && game.home_series_wins !== undefined) {
        body.home_series_wins = game.home_series_wins;
        body.away_series_wins = game.away_series_wins;
      }

      const res = await fetch(getAnalyzeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const analysisData = await res.json();
      
      // Navigate to detail screen, passing data in state
      navigate(`/sports/${sport}/matchup`, { state: { analysis: analysisData } });
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
          <Loader2 className="animate-spin text-[#00E5FF]" size={32} />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center text-slate-500 font-bold italic mt-20">No games scheduled for today.</div>
      ) : (
        <div className="space-y-3">
          {games.map((game, idx) => {
            const isAnalyzing = analyzingGameId === game.game_id;

            const awayLogoUrl = sport === 'nhl' 
              ? `https://assets.nhle.com/logos/nhl/svg/${game.away_team}_light.svg` 
              : `https://a.espncdn.com/i/teamlogos/nba/500/${game.away_team.toLowerCase()}.png`;
              
            const homeLogoUrl = sport === 'nhl' 
              ? `https://assets.nhle.com/logos/nhl/svg/${game.home_team}_light.svg` 
              : `https://a.espncdn.com/i/teamlogos/nba/500/${game.home_team.toLowerCase()}.png`;

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
                  className="bg-[#00E5FF] text-[#0a0a0f] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 min-w-[100px] flex justify-center items-center shadow-[0_0_15px_rgba(0,200,83,0.15)]"
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
