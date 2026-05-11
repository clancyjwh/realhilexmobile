import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, User as UserIcon, Bell, CreditCard, LogOut } from 'lucide-react';

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export default function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({ ...data, email: user.email });
        setDisplayName(data.display_name || '');
        setPushEnabled(data.notifications_enabled === true);
        if (data.notification_preferences?.email !== undefined) {
          setEmailEnabled(data.notification_preferences.email);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePush = async () => {
    const newVal = !pushEnabled;
    setPushEnabled(newVal);
    
    if (newVal && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.Slidedown.promptPush();
      });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ notifications_enabled: newVal }).eq('id', user.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEmail = async () => {
    const newVal = !emailEnabled;
    setEmailEnabled(newVal);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newPrefs = { ...profile.notification_preferences, email: newVal };
        await supabase.from('profiles').update({ notification_preferences: newPrefs }).eq('id', user.id);
        setProfile({...profile, notification_preferences: newPrefs});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="flex-grow bg-[#0a0a0f] animate-pulse" />;

  return (
    <div className="flex-grow bg-[#0a0a0f] p-6 pb-12 flex flex-col font-sans">
      <div className="mb-10 pt-4 flex flex-col items-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
          <UserIcon size={40} className="text-[#00C853]" />
        </div>
        <h1 className="text-2xl font-black italic uppercase text-white tracking-tight">{profile?.full_name || 'Hilex User'}</h1>
        <p className="text-slate-500 text-sm font-medium tracking-tight">{profile?.email}</p>
        
        <div className="mt-4 bg-[#00C853] text-[#0a0a0f] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,200,83,0.3)]">
          {profile?.tier || 'Free Tier'}
        </div>
      </div>

      <div className="space-y-6">
        {/* Display Name Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Display Name</label>
          <div className="relative">
            <input 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleUpdateName}
              className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#00C853] transition-all"
            />
            {isSaving && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#00C853] uppercase">Saving...</div>}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Mail size={18} className="text-slate-400" />
              </div>
              <span className="text-sm font-bold text-white">Email Notifications</span>
            </div>
            <div 
              onClick={toggleEmail}
              className={`w-10 h-6 rounded-full relative p-1 shadow-inner cursor-pointer transition-colors duration-300 ${emailEnabled ? 'bg-[#00C853]' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${emailEnabled ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Bell size={18} className="text-slate-400" />
              </div>
              <span className="text-sm font-bold text-white">Push Notifications</span>
            </div>
            <div 
              onClick={togglePush}
              className={`w-10 h-6 rounded-full relative p-1 shadow-inner cursor-pointer transition-colors duration-300 ${pushEnabled ? 'bg-[#00C853]' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${pushEnabled ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-10">
        <button 
          onClick={handleSignOut}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
