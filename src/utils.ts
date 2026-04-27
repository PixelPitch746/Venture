export const formatCurrency = (amount: number): string => {
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(2)}K`;
  if (amount < 1000000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount < 1000000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  return `$${(amount / 1000000000000).toFixed(2)}T`;
};

export const calculateCost = (baseCost: number, level: number): number => {
  return Math.floor(baseCost * Math.pow(1.25, level));
};

export const calculateIncome = (baseIncome: number, level: number, multiplier: number, prestigePoints: number): number => {
  if (level === 0) return 0;
  const prestigeBonus = 1 + (prestigePoints * 0.01); // 1% bonus per prestige point
  return baseIncome * level * multiplier * prestigeBonus;
};

export const formatGameDate = (days: number): string => {
  const startDate = new Date(2000, 0, 1);
  const currentDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  return currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};
