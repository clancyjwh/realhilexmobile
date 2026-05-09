import React from 'react';
import { Trophy } from 'lucide-react';

export default function SportsPage() {
  const sports = [
    { name: 'NHL', path: '/sports/nhl' },
    { name: 'NBA', path: '/sports/nba' },
    { name: 'UFC', path: '/sports/ufc' },
    { name: 'Soccer', path: '/sports/soccer' }
  ];

  return (
    <div className="flex-grow p-5 pb-10">
      <div className="mb-8 pt-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Hub</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-1">Sports</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <div 
            key={sport.name}
            className="bg-[#12121a] border border-white/5 rounded-2xl p-6 aspect-square flex flex-col justify-between shadow-xl active:bg-white/5 transition-all group"
          >
            <div className="flex justify-end">
              <Trophy size={20} className="text-slate-700 group-active:text-[#00C853] transition-colors" />
            </div>
            <h3 className="text-2xl font-black italic uppercase text-white leading-none">
              {sport.name}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
