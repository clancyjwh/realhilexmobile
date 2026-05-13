import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface Fight {
  fighter_1: { id: string; name: string; headshot?: string };
  fighter_2: { id: string; name: string; headshot?: string };
  weight_class: string;
  is_title_fight: boolean;
}

export default function UFCFightList() {
  const location = useLocation();
  const navigate = useNavigate();
  const fights: Fight[] = location.state?.fights || [];
  const eventName: string = location.state?.eventName || 'Fight Card';
  
  const [analyzingFightId, setAnalyzingFightId] = useState<string | null>(null);

  const handleAnalyze = async (fight: Fight) => {
    const fightId = `${fight.fighter_1.id}-${fight.fighter_2.id}`;
    setAnalyzingFightId(fightId);
    try {
      const res = await fetch('https://hilex-nhl-production.up.railway.app/ufc/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fighter_1_id: fight.fighter_1.id,
          fighter_2_id: fight.fighter_2.id
        })
      });
      const analysisData = await res.json();
      
      navigate('/sports/ufc/fight', { 
        state: { 
          analysis: analysisData,
          headshots: { f1: fight.fighter_1.headshot, f2: fight.fighter_2.headshot }
        } 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingFightId(null);
    }
  };

  return (
    <div className="flex-grow p-4 bg-[#0a0a0f] text-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-[#12121a] rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Fight Card</h2>
          <h1 className="text-xl font-black italic uppercase tracking-tighter mt-1 leading-tight line-clamp-1">{eventName}</h1>
        </div>
      </div>

      {fights.length === 0 ? (
        <div className="text-center text-slate-500 font-bold italic mt-20">No fights available for this event.</div>
      ) : (
        <div className="space-y-3">
          {fights.map((fight, idx) => {
            const fightId = `${fight.fighter_1.id}-${fight.fighter_2.id}`;
            const isAnalyzing = analyzingFightId === fightId;

            return (
              <div key={idx} className="bg-[#12121a] border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-lg">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{fight.weight_class}</span>
                    {fight.is_title_fight && <span className="text-[10px]" title="Title Fight">🏆</span>}
                  </div>
                  <span className="font-black text-sm italic tracking-tight leading-tight block">
                    {fight.fighter_1.name} <br/>
                    <span className="text-slate-500">vs</span> {fight.fighter_2.name}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleAnalyze(fight)}
                  disabled={isAnalyzing}
                  className="bg-[#00D8FF] text-[#0a0a0f] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 min-w-[100px] flex justify-center items-center shadow-[0_0_15px_rgba(0,216,255,0.4)] shrink-0"
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
