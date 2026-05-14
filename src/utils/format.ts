/**
 * Institutional Safety Utility
 * Prevents UI crashes from missing or malformed numeric data
 */
export const formatScore = (val: any, decimals: number = 1): string => {
  if (val === undefined || val === null || isNaN(Number(val))) {
    return (0).toFixed(decimals);
  }
  return Number(val).toFixed(decimals);
};

export const getHeatScoreColor = (score: number | any) => {
  const s = Number(score);
  if (isNaN(s)) return '#9E9E9E';
  
  // Use white text for colored backgrounds, except neutral
  if (Math.abs(s) >= 1) return '#ffffff';
  return '#ffffff'; // Default to white for bold contrast on backgrounds
};

export const getHeatScoreBgColor = (score: number | any) => {
  const s = Number(score);
  if (isNaN(s)) return '#1c1c24'; // Fallback
  
  if (s >= 7) return '#22c55e';
  if (s >= 4) return '#4ade80';
  if (s >= 1) return '#86efac';
  if (s > -1) return '#9E9E9E';
  if (s >= -4) return '#FF6D00';
  if (s >= -7) return '#DD2C00';
  return '#B71C1C';
};

export const getSignalColors = (signal: number) => {
  if (signal >= 9) return { isGold: true, bg: 'bg-[linear-gradient(145deg,#FFFDF5_0%,#FFF3CC_35%,#EBD48E_70%,#C9A43B_100%)] bg-[length:200%_200%] shadow-[0_0_20px_rgba(201,164,59,0.8)]', border: 'border-yellow-400', text: 'text-black', subtext: 'text-black/60', subtextDark: 'text-black/70', hex: '#facc15' };
  if (signal >= 7) return { isGold: false, bg: 'bg-green-900', border: 'border-green-700', text: 'text-green-300', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#22c55e' };
  if (signal >= 4) return { isGold: false, bg: 'bg-green-700', border: 'border-green-600', text: 'text-green-200', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#4ade80' };
  if (signal >= 1) return { isGold: false, bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-100', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#86efac' };
  if (signal > -1) return { isGold: false, bg: 'bg-slate-600', border: 'border-slate-500', text: 'text-slate-200', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#e2e8f0' };
  if (signal >= -4) return { isGold: false, bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-100', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#ffedd5' };
  if (signal >= -7) return { isGold: false, bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-100', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#fecaca' };
  if (signal <= -9) return { isGold: false, bg: 'bg-gradient-to-br from-red-900 to-red-950', border: 'border-red-600', text: 'text-red-200', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#fca5a5' };
  return { isGold: false, bg: 'bg-red-900', border: 'border-red-700', text: 'text-red-300', subtext: 'text-white/60', subtextDark: 'text-white/70', hex: '#f87171' };
};

export const formatMarketQuestion = (q: string): string => {
  return q;
};
