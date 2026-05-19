import React from 'react';
import { Trophy, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SportsPage() {
  const navigate = useNavigate();
  const sports = [
    { name: 'NHL', path: '/sports/nhl' },
    { name: 'NBA', path: '/sports/nba' },
    { name: 'UFC', path: '/sports/ufc' },
    { name: 'Soccer', path: '/sports/soccer' }
  ];

  return (
    <div className="flex-grow p-5 pb-10 bg-[#0a0a0f]">
      <div className="mb-10 pt-4 px-2">
        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">Platform Hub</h2>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Sports</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 px-1">
        {sports.map((sport) => (
          <div 
            key={sport.name}
            onClick={() => navigate(sport.path)}
            className="bg-[#12121a] border border-white/5 rounded-2xl p-6 aspect-[5/4] flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.4)] active:scale-[0.97] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
            
            <div className="relative z-10 flex justify-end w-full">
              <Trophy size={20} className="text-slate-600 group-active:text-[#00D8FF] transition-colors" />
            </div>
            <h3 className="relative z-10 text-3xl font-black italic uppercase text-white leading-none tracking-tighter">
              {sport.name}
            </h3>
          </div>
        ))}
      </div>

      {/* Large AI News Button */}
      <div className="mt-8 px-1">
        <button 
          onClick={() => navigate('/newsfeed/sports')}
          className="w-full flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-[#00D8FF]/20 to-transparent border border-[#00D8FF]/30 active:scale-[0.98] transition-transform relative overflow-hidden group shadow-[0_0_20px_rgba(0,216,255,0.15)]"
        >
          <div className="absolute inset-0 bg-[#00D8FF]/5 group-active:bg-[#00D8FF]/10 transition-colors" />
          <div className="relative z-10 flex flex-col items-start gap-1">
            <h3 className="text-lg font-black italic uppercase tracking-widest text-white">AI Newsfeed</h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D8FF]">Sports Intelligence</span>
          </div>
          <div className="relative z-10 bg-[#00D8FF] p-3 rounded-full shadow-[0_0_15px_rgba(0,216,255,0.5)]">
            <Newspaper className="w-6 h-6 text-black" />
          </div>
        </button>
      </div>
    </div>
  );
}
