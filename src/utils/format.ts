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
  
  if (s >= 7) return '#00C853';
  if (s >= 4) return '#64DD17';
  if (s >= 1) return '#AEEA00';
  if (s > -1) return '#9E9E9E';
  if (s >= -4) return '#FF6D00';
  if (s >= -7) return '#DD2C00';
  return '#B71C1C';
};
