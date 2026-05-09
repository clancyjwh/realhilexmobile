import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface UFCEvent {
  event_id: string;
  name: string;
  date: string;
  location: string;
  main_event?: {
    fighter_1: { name: string };
    fighter_2: { name: string };
    is_title_fight?: boolean;
  };
  fights: any[];
}

export default function UFCEventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<UFCEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://hilex-nhl-production.up.railway.app/ufc/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-4 bg-[#0a0a0f] text-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button onClick={() => navigate('/sports')} className="p-2 bg-[#12121a] rounded-full text-slate-400 active:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Upcoming</h2>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter mt-1">UFC Events</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-[#00C853]" size={32} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center text-slate-500 font-bold italic mt-20">No upcoming events found.</div>
      ) : (
        <div className="space-y-4">
          {events.map((event, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(`/sports/ufc/event/${event.event_id}`, { state: { fights: event.fights, eventName: event.name } })}
              className="bg-[#12121a] border border-white/5 rounded-2xl p-6 shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              <h3 className="text-lg font-black italic uppercase text-white mb-1 leading-tight">{event.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                {event.date} • {event.location}
              </p>
              
              {event.main_event && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-[#00C853] uppercase tracking-[0.2em] block mb-1">Main Event</span>
                    <span className="text-sm font-black italic tracking-tighter">
                      {event.main_event.fighter_1.name} vs {event.main_event.fighter_2.name}
                    </span>
                  </div>
                  {event.main_event.is_title_fight && (
                    <span className="text-xl" title="Title Fight">🏆</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
