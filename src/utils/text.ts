/**
 * Utility to format team names and handle specific branding requirements.
 */
export const formatTeamName = (name: string): string => {
  if (!name) return "";
  
  const upper = name.toUpperCase();
  
  // Rule: PSG should NOT be called FC
  if (upper.includes('PARIS SAINT-GERMAIN') || upper === 'PSG') {
    return 'PSG';
  }
  
  // General rule: Strip common suffixes from soccer teams
  let clean = name
    .replace(/\s+FC$/i, '')
    .replace(/\s+Football Club$/i, '')
    .replace(/\s+SC$/i, '')
    .replace(/\s+Soccer Club$/i, '');
    
  return clean;
};

export const getPSGSymbol = (): string => 'PSG';
