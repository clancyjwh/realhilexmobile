import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, CreditCard, LogOut, Bell } from 'lucide-react';
import OneSignal from '@onesignal/capacitor-plugin';
import { Preferences } from '@capacitor/preferences';



export default function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    const { value } = await Preferences.get({ key: 'notifications_enabled' });
    setNotificationsEnabled(value === 'true');
  };

  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await Preferences.set({ key: 'notifications_enabled', value: enabled.toString() });
    
    try {
      if (enabled) {
        await OneSignal.Notifications.requestPermission(true);
      } else {
        await OneSignal.User.PushSubscription.optOut();
      }
    } catch (err) {
      console.error('OneSignal error:', err);
    }
  };

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



  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="flex-grow bg-[#0a0a0f] animate-pulse" />;

  return (
    <div className="flex-grow bg-[#0a0a0f] p-6 pb-12 flex flex-col font-sans">
      <div className="mb-10 pt-4 flex flex-col items-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
          <UserIcon size={40} className="text-[#00D8FF]" />
        </div>
        <h1 className="text-2xl font-black italic uppercase text-white tracking-tight">{profile?.full_name || 'Hilex User'}</h1>
        <p className="text-slate-500 text-sm font-medium tracking-tight">{profile?.email}</p>
        
        <div className="mt-4 bg-[#00D8FF] text-[#0a0a0f] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,216,255,0.4)]">
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
              className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#00D8FF] transition-all"
            />
            {isSaving && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#00D8FF] uppercase">Saving...</div>}
          </div>
        </div>
        {/* Notifications Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Preferences</label>
          <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#00D8FF]/10 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-[#00D8FF]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none mb-1">Push Notifications</p>
                <p className="text-[10px] text-slate-500 font-medium">Receive real-time intelligence</p>
              </div>
            </div>
            <button 
              onClick={() => toggleNotifications(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notificationsEnabled ? 'bg-[#00D8FF]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
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
