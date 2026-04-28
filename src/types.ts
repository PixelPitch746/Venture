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

export interface HypeEvent {
  id: string;
  name: string;
  multiplier: number;
  description: string;
  color: string;
}

export interface House {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  monthlyRent: number;
  appreciationRate: number; // monthly appreciation factor
  color: string;
  icon: string;
}

export interface Property {
  id: string;
  houseId: string;
  purchasePrice: number;
  purchaseDate: number; // days count
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  wealth: number;
  lastUpdated: any;
}

export type CurrencyFormat = 'compact' | 'scientific' | 'detailed';

export interface GameSettings {
  numberFormat: CurrencyFormat;
  theme: 'cyber' | 'minimal' | 'dark';
  showCloudSyncStatus: boolean;
  notificationsEnabled: boolean;
}

export interface GameState {
  displayName: string;
  money: number;
  totalEarned: number;
  gameDate: number; // days since 2000-01-01
  prestigePoints: number;
  prestigeCount: number;
  ownedBusinesses: Record<string, OwnedBusiness>;
  holdings: Record<string, StockHolding>;
  properties: Property[];
  stockPrices: Record<string, number>;
  stockHistory: Record<string, number[]>;
  portfolioHistory: { time: string; val: number }[];
  rivals: Record<string, RivalState>;
  clickLevel: number;
  activeEvent: HypeEvent | null;
  eventTimeLeft: number; // in seconds
  unlockedFeatures: {
    market: boolean;
    stocks: boolean;
    prestige: boolean;
  };
  lastSaved: number;
  currentCityIndex: number;
  settings?: GameSettings;
}
