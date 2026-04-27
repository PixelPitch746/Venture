export interface Business {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseIncome: number;
  baseSpeed: number; // in seconds
  icon: string;
  color: string;
}

export interface OwnedBusiness {
  id: string;
  level: number;
  lastCollected: number; // timestamp
  isAutomated: boolean;
  speedMultiplier: number;
  profitMultiplier: number;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  basePrice: number;
  volatility: number; // 0 to 1
  growthBias: number; // -0.05 to 0.05
  color: string;
}

export interface StockHolding {
  symbol: string;
  shares: number;
  avgBuyPrice: number;
}

export type RivalTrait = 'aggressive' | 'stable' | 'risky';

export interface Rival {
  id: string;
  name: string;
  logo: string;
  color: string;
  trait: RivalTrait;
}

export interface RivalState {
  id: string;
  wealth: number;
  incomePerSec: number;
  lastExpansion: number;
}

export interface GameState {
  money: number;
  totalEarned: number;
  prestigePoints: number;
  prestigeCount: number;
  ownedBusinesses: Record<string, OwnedBusiness>;
  holdings: Record<string, StockHolding>;
  stockPrices: Record<string, number>;
  stockHistory: Record<string, number[]>;
  portfolioHistory: { time: string; val: number }[];
  rivals: Record<string, RivalState>;
  lastSaved: number;
  currentCityIndex: number;
}
