export type UserTier = 'free' | 'sports' | 'finance' | 'prediction' | 'premium' | 'enterprise';
 
 export interface TierPermissions {
   canAccessSports: boolean;
   canAccessFinance: boolean;
   canAccessPrediction: boolean;
   canRunPredictionAnalysis: boolean;
   canAccessChat: boolean;
   canAccessTools: boolean;
   canAccessWatchlist: boolean;
   canAccessDailyInsights: boolean;
   newsfeedAccess: 'full' | 'limited' | 'trial';
 }

export function getTierPermissions(
  tier: UserTier | string | null | undefined,
  aiNewsfeedPaid: boolean = false,
  aiNewsfeedStartedAt?: string | null
): TierPermissions {
  // Force premium tier for mobile app
  const normalizedTier = 'premium';

  // AI Newsfeed Logic
  let newsfeedAccess: 'full' | 'limited' | 'trial' = 'limited';
  
  if (normalizedTier === 'premium' || normalizedTier === 'enterprise' || aiNewsfeedPaid) {
    newsfeedAccess = 'full';
  } else if (aiNewsfeedStartedAt) {
    const startedAt = new Date(aiNewsfeedStartedAt).getTime();
    const now = Date.now();
    const diffDays = (now - startedAt) / (1000 * 60 * 60 * 24);
    newsfeedAccess = diffDays <= 7 ? 'full' : 'limited'; // "trial" is technically full for 7 days
  } else {
    // If trial hasn't started, treat as full for the onboarding phase (same as existing logic)
    newsfeedAccess = 'full';
  }

  // Permission Mapping
  switch (normalizedTier) {
    case 'enterprise':
    case 'premium':
    case 'pro':
      return {
        canAccessSports: true,
        canAccessFinance: true,
        canAccessPrediction: true,
        canRunPredictionAnalysis: true,
        canAccessChat: true,
        canAccessTools: true,
        canAccessWatchlist: true,
        canAccessDailyInsights: true,
        newsfeedAccess: 'full',
      };

    case 'finance':
      return {
        canAccessSports: false,
        canAccessFinance: true,
        canAccessPrediction: false,
        canRunPredictionAnalysis: false,
        canAccessChat: true,
        canAccessTools: true,
        canAccessWatchlist: true,
        canAccessDailyInsights: true,
        newsfeedAccess,
      };

    case 'prediction':
      return {
        canAccessSports: false,
        canAccessFinance: false,
        canAccessPrediction: true,
        canRunPredictionAnalysis: true,
        canAccessChat: true,
        canAccessTools: false,
        canAccessWatchlist: false,
        canAccessDailyInsights: true,
        newsfeedAccess,
      };

    case 'sports':
      return {
        canAccessSports: true,
        canAccessFinance: false,
        canAccessPrediction: false,
        canRunPredictionAnalysis: false,
        canAccessChat: false,
        canAccessTools: false,
        canAccessWatchlist: false,
        canAccessDailyInsights: false,
        newsfeedAccess,
      };

    case 'free':
    default:
      return {
        canAccessSports: false,
        canAccessFinance: false,
        canAccessPrediction: false,
        canRunPredictionAnalysis: false,
        canAccessChat: false,
        canAccessTools: false,
        canAccessWatchlist: false,
        canAccessDailyInsights: false,
        newsfeedAccess,
      };
  }
}
