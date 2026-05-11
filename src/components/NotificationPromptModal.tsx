import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell } from 'lucide-react';

export default function NotificationPromptModal() {
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();
      
      setProfile(data);

      if (data?.notifications_enabled) {
        // Already enabled, do nothing
        return;
      }

      const now = Date.now();
      const nextPrompt = localStorage.getItem('hilex_next_prompt_time');
      
      if (!nextPrompt) {
        // First time seeing this logic. Set next prompt to 2 days from now.
        const twoDays = now + (2 * 24 * 60 * 60 * 1000);
        localStorage.setItem('hilex_next_prompt_time', twoDays.toString());
        return;
      }

      if (now > parseInt(nextPrompt, 10)) {
        // Time to prompt!
        setTimeout(() => setShow(true), 2000); // 2 second delay so it doesn't jarringly block the feed immediately
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAllow = async () => {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.Slidedown.promptPush();
      });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ notifications_enabled: true })
          .eq('id', user.id);
      }
    } catch (e) {
      console.error(e);
    }
    
    // Set to a very distant future just in case, or we can just let notifications_enabled handle it
    const veryDistant = Date.now() + (365 * 24 * 60 * 60 * 1000);
    localStorage.setItem('hilex_next_prompt_time', veryDistant.toString());
    setShow(false);
  };

  const handleLater = () => {
    // Check again in 2 days
    const twoDays = Date.now() + (2 * 24 * 60 * 60 * 1000);
    localStorage.setItem('hilex_next_prompt_time', twoDays.toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#12121a] border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00E5FF]/20 rounded-full blur-[50px] -z-10" />

        <div className="w-16 h-16 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-2xl flex items-center justify-center mb-6">
          <Bell size={28} className="text-[#00E5FF] animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
          Stay Ahead
        </h2>
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
          HilEX is better with notifications! Get instant alerts on high-confidence institutional shifts.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={handleAllow}
            className="w-full bg-[#00E5FF] text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-[0_0_20px_rgba(0,200,83,0.3)] active:scale-95 transition-all"
          >
            Allow Notifications
          </button>
          <button 
            onClick={handleLater}
            className="w-full bg-white/5 text-white/60 font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl active:scale-95 transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
