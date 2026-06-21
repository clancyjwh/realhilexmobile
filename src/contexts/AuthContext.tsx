import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { ensureUserProfile } from '../utils/profileUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  tier: string | null;
  aiNewsfeedPaid: boolean;
  aiNewsfeedStartedAt: string | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialEnd: string | null;
  chosenPlan: string | null;
  trialRemainingDays: number;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, plan?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [aiNewsfeedPaid, setAiNewsfeedPaid] = useState(false);
  const [aiNewsfeedStartedAt, setAiNewsfeedStartedAt] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [chosenPlan, setChosenPlan] = useState<string | null>(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialRemainingDays, setTrialRemainingDays] = useState(0);

  const checkPremiumStatus = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('tier, ai_newsfeed_paid, ai_newsfeed_started_at, trial_end, chosen_plan')
        .eq('id', userId)
        .maybeSingle();

      const normalizedTier = (profileData?.tier?.toLowerCase() || 'free') as string;
      const subStatus = (userData?.subscription_status?.toLowerCase() || 'free') as string;

      // Determine effective tier: prioritize specific paid tiers over 'free'
      const paidTiers = ['premium', 'enterprise', 'sports', 'finance', 'prediction', 'pro'];
      let effectiveTier = normalizedTier;

      if (paidTiers.includes(subStatus) && (normalizedTier === 'free' || subStatus === 'premium' || subStatus === 'enterprise')) {
        effectiveTier = subStatus === 'pro' ? 'premium' : subStatus;
      }

      setTier('premium'); // Forced premium tier for mobile app
      setAiNewsfeedPaid(profileData?.ai_newsfeed_paid || false);
      setAiNewsfeedStartedAt(profileData?.ai_newsfeed_started_at || null);

      // Trial status logic
      const pTrialEnd = profileData?.trial_end || null;
      const pChosenPlan = profileData?.chosen_plan || null;

      const now = new Date();
      const trialEndDate = pTrialEnd ? new Date(pTrialEnd) : null;
      const isExpired = trialEndDate ? (trialEndDate < now && subStatus === 'free') : false;
      const isActive = trialEndDate ? (trialEndDate >= now && subStatus === 'free') : false;
      const remainingDays = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      setTrialEnd(pTrialEnd);
      setChosenPlan(pChosenPlan);
      setIsTrialActive(isActive);
      setIsTrialExpired(isExpired);
      setTrialRemainingDays(remainingDays);

      setIsPremium(true); // Forced premium status for mobile app
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(true); // Fallback to premium for free mobile access
      setTier('premium');
      setAiNewsfeedPaid(false);
      setTrialEnd(null);
      setChosenPlan(null);
      setIsTrialActive(false);
      setIsTrialExpired(false);
      setTrialRemainingDays(0);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user.id);
        checkPremiumStatus(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await ensureUserProfile(session.user.id);
          await checkPremiumStatus(session.user.id);
        } else {
          setIsPremium(false);
          setTier(null);
          setAiNewsfeedPaid(false);
          setTrialEnd(null);
          setChosenPlan(null);
          setIsTrialActive(false);
          setIsTrialExpired(false);
          setTrialRemainingDays(0);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for realtime database changes to keep status in sync
  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel(`user-status-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          console.log('Profile updated, re-checking status...');
          checkPremiumStatus(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        () => {
          console.log('User billing status updated, re-checking status...');
          checkPremiumStatus(user.id);
        }
      )
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string, plan?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          plan: plan || 'premium'
        }
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://heat-signal-real-dup-zd1a.bolt.host/reset-password',
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, isPremium, tier, aiNewsfeedPaid, aiNewsfeedStartedAt,
      isTrialActive, isTrialExpired, trialEnd, chosenPlan, trialRemainingDays,
      signIn, signInWithGoogle, signUp, signOut, resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
