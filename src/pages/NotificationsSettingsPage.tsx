import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, TrendingUp, Trophy, BarChart3, Clock, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [prefs, setPrefs] = useState({
    financial_enabled: true,
    sports_enabled: false,
    markets_enabled: true,
    daily_digest_enabled: true,
    daily_digest_time: '09:00'
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');
      
      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();
        
      if (data?.notification_preferences) {
        setPrefs(data.notification_preferences);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('profiles')
        .update({ notification_preferences: newPrefs })
        .eq('id', user.id);
        
      if (value === true) {
        await requestAndSubscribe(user.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrefs = { ...prefs, daily_digest_time: e.target.value };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('profiles').update({ notification_preferences: newPrefs }).eq('id', user.id);
    } catch (err) {} finally { setSaving(false); }
  };

  const requestAndSubscribe = async (userId: string) => {
    if (!('Notification' in window)) return;
    
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission === 'granted' && navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // MUST BE REPLACED WITH ACTUAL KEY IN PRODUCTION
        });

        // Insert subscription object
        await supabase.from('push_subscriptions').insert({
          user_id: userId,
          subscription_json: JSON.parse(JSON.stringify(subscription))
        });
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] animate-pulse" />;

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full relative p-1 cursor-pointer transition-colors duration-300 shadow-inner ${checked ? 'bg-[#00C853]' : 'bg-white/10'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-md ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#12121a] z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:opacity-50">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-black text-xl italic uppercase tracking-tight">Notifications</h1>
        </div>
        {saving && <span className="text-[10px] text-[#00C853] font-black uppercase tracking-widest animate-pulse">Saving...</span>}
      </header>

      <div className="flex-grow p-6 space-y-6">
        <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden shadow-xl divide-y divide-white/5">
          
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-blue-400">
                  <TrendingUp size={20} />
                </div>
                <span className="font-bold text-lg">Financial Alerts</span>
              </div>
              <ToggleSwitch 
                checked={prefs.financial_enabled} 
                onChange={(c) => handleToggle('financial_enabled', c)} 
              />
            </div>
            <p className="text-xs text-slate-500 font-medium ml-14">Get notified about unusual price movements and watchlist changes</p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-orange-400">
                  <Trophy size={20} />
                </div>
                <span className="font-bold text-lg">Sports Updates</span>
              </div>
              <ToggleSwitch 
                checked={prefs.sports_enabled} 
                onChange={(c) => handleToggle('sports_enabled', c)} 
              />
            </div>
            <p className="text-xs text-slate-500 font-medium ml-14">Get notified about game results and athlete performance changes</p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-purple-400">
                  <BarChart3 size={20} />
                </div>
                <span className="font-bold text-lg">Prediction Markets</span>
              </div>
              <ToggleSwitch 
                checked={prefs.markets_enabled} 
                onChange={(c) => handleToggle('markets_enabled', c)} 
              />
            </div>
            <p className="text-xs text-slate-500 font-medium ml-14">Get notified about trending questions and consensus shifts</p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-emerald-400">
                  <Bell size={20} />
                </div>
                <span className="font-bold text-lg">Daily Digest</span>
              </div>
              <ToggleSwitch 
                checked={prefs.daily_digest_enabled} 
                onChange={(c) => handleToggle('daily_digest_enabled', c)} 
              />
            </div>
            <p className="text-xs text-slate-500 font-medium ml-14 mb-4">Receive one daily summary at the specified time</p>
            
            {prefs.daily_digest_enabled && (
              <div className="ml-14 flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                <Clock size={16} className="text-slate-400" />
                <input 
                  type="time" 
                  value={prefs.daily_digest_time}
                  onChange={handleTimeChange}
                  className="bg-transparent text-white font-bold text-sm focus:outline-none"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
