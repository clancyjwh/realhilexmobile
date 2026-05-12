import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, CreditCard, LogOut } from 'lucide-react';



export default function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
          <UserIcon size={40} className="text-[#00E5FF]" />
        </div>
        <h1 className="text-2xl font-black italic uppercase text-white tracking-tight">{profile?.full_name || 'Hilex User'}</h1>
        <p className="text-slate-500 text-sm font-medium tracking-tight">{profile?.email}</p>
        
        <div className="mt-4 bg-[#00E5FF] text-[#0a0a0f] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,200,83,0.3)]">
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
              className="w-full bg-[#12121a] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#00E5FF] transition-all"
            />
            {isSaving && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#00E5FF] uppercase">Saving...</div>}
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
