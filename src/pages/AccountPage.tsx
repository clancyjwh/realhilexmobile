import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Key, Mail, Building2, CreditCard, Bell, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  subscription_status: string | null;
}

interface ProfileData {
  display_name: string | null;
  notifications_enabled: boolean;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tier } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  useEffect(() => {
    loadUserData();
    loadProfileData();
  }, []);

  useEffect(() => {
    if (!loading && location.hash === '#subscription') {
      setTimeout(() => {
        document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash, loading]);

  const loadUserData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setMessage({ type: 'error', text: 'Failed to load user data' }); setLoading(false); return; }
      const { data, error } = await supabase.from('users').select('full_name, business_name, email, subscription_status').eq('id', user.id).maybeSingle();
      if (error) { setMessage({ type: 'error', text: 'Failed to fetch account details' }); } 
      else { 
        setUserData(data); 
        setFullName(data.full_name || ''); 
        setBusinessName(data.business_name || ''); 
      }
    } catch { setMessage({ type: 'error', text: 'An unexpected error occurred' }); }
    finally { setLoading(false); }
  };

  const loadProfileData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;
      const { data, error } = await supabase.from('profiles').select('display_name, notifications_enabled').eq('id', user.id).maybeSingle();
      if (!error && data) { setProfileData(data); setDisplayName(data.display_name || ''); setNotificationsEnabled(data.notifications_enabled ?? true); }
    } catch (err) { console.error('Error loading profile data:', err); }
  };

  const handleSaveProfile = async () => {
    setMessage(null); setSavingProfile(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setMessage({ type: 'error', text: 'Failed to get user information' }); setSavingProfile(false); return; }
      
      const { error: usersError } = await supabase.from('users').update({ 
        full_name: fullName.trim(), 
        business_name: businessName.trim() 
      }).eq('id', user.id);
      
      const { error: profilesError } = await supabase.from('profiles').update({ 
        full_name: fullName.trim(), 
        business_name: businessName.trim() 
      }).eq('id', user.id);

      if (usersError || profilesError) { 
        setMessage({ type: 'error', text: 'Failed to update profile information' }); 
      } else { 
        setMessage({ type: 'success', text: 'Profile information updated successfully!' }); 
        await loadUserData(); 
      }
    } catch { setMessage({ type: 'error', text: 'An unexpected error occurred' }); }
    finally { setSavingProfile(false); }
  };

  const handleSaveUsername = async () => {
    setMessage(null); setSavingUsername(true);
    if (!displayName.trim()) { setMessage({ type: 'error', text: 'Username cannot be empty' }); setSavingUsername(false); return; }
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setMessage({ type: 'error', text: 'Failed to get user information' }); setSavingUsername(false); return; }
      const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user.id);
      if (error) { setMessage({ type: 'error', text: 'Failed to update username' }); } else { setMessage({ type: 'success', text: 'Username updated successfully!' }); await loadProfileData(); }
    } catch { setMessage({ type: 'error', text: 'An unexpected error occurred' }); }
    finally { setSavingUsername(false); }
  };

  const handleToggleNotifications = async () => {
    setMessage(null); setTogglingNotifications(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setMessage({ type: 'error', text: 'Failed to get user information' }); setTogglingNotifications(false); return; }
      const newValue = !notificationsEnabled;
      const { error } = await supabase.from('profiles').update({ notifications_enabled: newValue }).eq('id', user.id);
      if (error) { setMessage({ type: 'error', text: 'Failed to update notification preferences' }); }
      else { setNotificationsEnabled(newValue); setMessage({ type: 'success', text: `Notifications ${newValue ? 'enabled' : 'disabled'} successfully!` }); await loadProfileData(); }
    } catch { setMessage({ type: 'error', text: 'An unexpected error occurred' }); }
    finally { setTogglingNotifications(false); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); navigate('/login'); }
    catch { setMessage({ type: 'error', text: 'Failed to log out' }); }
  };

  const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const glassInput = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#00D8FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-4xl mx-auto flex flex-col font-sans">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
          <User className="w-8 h-8 md:w-10 md:h-10 text-[#00D8FF]" />
        </div>
        <h1 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tight">{userData?.full_name || 'HiLEX User'}</h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium tracking-tight mt-1">{userData?.email}</p>
        <div className="mt-4 bg-[#00D8FF] text-[#0a0a0f] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,216,255,0.4)]">
          {tier || 'Free Tier'}
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-900/20 border border-red-500/30 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-4">
        {/* Account Information */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-4 flex items-center gap-2 tracking-tight">
            <User className="w-4 h-4" style={{ color: '#00D8FF' }} />
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ ...glassInput, outline: 'none' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(0,216,255,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,216,255,0.1)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ ...glassInput, outline: 'none' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(0,216,255,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,216,255,0.1)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input
                type="email"
                value={userData?.email || ''}
                readOnly
                className="w-full px-4 py-3 text-sm rounded-xl outline-none opacity-50 cursor-not-allowed font-mono"
                style={glassInput}
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || (fullName === (userData?.full_name || '') && businessName === (userData?.business_name || ''))}
              className="w-full px-4 py-3 text-xs uppercase tracking-widest rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: 'rgba(0,216,255,0.15)', border: '1px solid rgba(0,216,255,0.3)', color: '#00D8FF' }}
            >
              {savingProfile ? (
                <><div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-400 border-t-transparent" />Saving...</>
              ) : 'Save Settings'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowDeletePopup(true)}
              className="w-full px-4 py-3 text-xs uppercase tracking-widest rounded-xl font-black transition-all flex items-center justify-center gap-2 mt-3"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
            <Key className="w-4 h-4 text-amber-400" />
            Change Password
          </h2>
          <p className="text-slate-400 text-xs mb-4">Update your account password securely.</p>
          <button
            onClick={() => navigate('/change-password')}
            className="w-full px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 text-[#0a0a0f]"
            style={{ background: '#00D8FF', boxShadow: '0 0 20px rgba(0,216,255,0.25)' }}
          >
            <Key className="w-3.5 h-3.5" />
            Change Password
          </button>
        </div>

        {/* Username Settings */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-4 flex items-center gap-2 tracking-tight">
            <User className="w-4 h-4 text-violet-400" />
            Username Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Display Name (shown in chatrooms)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ ...glassInput, outline: 'none' }}
              />
            </div>
            <button
              onClick={handleSaveUsername}
              disabled={savingUsername || displayName === profileData?.display_name}
              className="w-full px-4 py-3 text-xs uppercase tracking-widest rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
            >
              {savingUsername ? (
                <><div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-400 border-t-transparent" />Saving...</>
              ) : 'Save Username'}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
            <Bell className="w-4 h-4 text-amber-400" />
            Notification Preferences
          </h2>
          <p className="text-slate-400 text-xs mb-4">Control how you receive notifications.</p>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-bold">Enable Notifications</p>
              <p className="text-xs text-slate-400 font-medium">Show unread badges</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={togglingNotifications}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${togglingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ background: notificationsEnabled ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Get in Touch */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
            <MessageCircle className="w-4 h-4" style={{ color: '#00D8FF' }} />
            Get in Touch
          </h2>
          <p className="text-slate-400 text-xs mb-4">Have a question or need assistance?</p>
          <button
            onClick={() => navigate('/contact')}
            className="w-full px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            style={{ background: 'rgba(0,216,255,0.1)', border: '1px solid rgba(0,216,255,0.3)', color: '#00D8FF' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Contact Support
          </button>
        </div>

        {/* Log Out */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h2 className="text-sm md:text-base font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
            <LogOut className="w-4 h-4 text-red-400" />
            Log Out
          </h2>
          <p className="text-slate-400 text-xs mb-4">Sign out of your account.</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-3">Delete Account</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              To delete your account and associated data, email <a href="mailto:operations@hilex.app" className="text-[#00D8FF] hover:underline">operations@hilex.app</a> from your registered email address.
            </p>
            <button
              onClick={() => setShowDeletePopup(false)}
              className="w-full px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all text-white border border-white/20 hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
