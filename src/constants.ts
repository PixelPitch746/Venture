import { Business, Stock, Rival } from './types';

export const BUSINESSES: Business[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    description: 'Refreshing citrus, humble beginnings.',
    baseCost: 100,
    baseIncome: 5,
    baseSpeed: 1,
    icon: 'Citrus',
    color: 'bg-yellow-400',
  },
  {
    id: 'newspaper',
    name: 'Newspaper Delivery',
    description: 'The news never stops, and neither do you.',
    baseCost: 800,
    baseIncome: 45,
    baseSpeed: 3,
    icon: 'Newspaper',
    color: 'bg-slate-400',
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    description: 'Sudsy profits for the mobile elite.',
    baseCost: 5000,
    baseIncome: 300,
    baseSpeed: 6,
    icon: 'Car',
    color: 'bg-blue-400',
  },
  {
    id: 'pizza',
    name: 'Pizza Parlor',
    description: 'Dough, cheese, and cold hard cash.',
    baseCost: 40000,
    baseIncome: 2500,
    baseSpeed: 12,
    icon: 'Pizza',
    color: 'bg-red-400',
  },
  {
    id: 'gym',
    name: 'Luxury Fitness',
    description: 'Healty bodies, healthy dividends.',
    baseCost: 350000,
    baseIncome: 22000,
    baseSpeed: 24,
    icon: 'Dumbbell',
    color: 'bg-emerald-400',
  },
  {
    id: 'tech',
    name: 'Tech Startup',
    description: 'Disrupting industries with code.',
    baseCost: 3000000,
    baseIncome: 180000,
    baseSpeed: 60,
    icon: 'Cpu',
    color: 'bg-purple-400',
  },
  {
    id: 'bank',
    name: 'Private Bank',
    description: 'Managing other people\'s money.',
    baseCost: 25000000,
    baseIncome: 1500000,
    baseSpeed: 120,
    icon: 'Landmark',
    color: 'bg-amber-600',
  },
  {
    id: 'oil',
    name: 'Oil Conglomerate',
    description: 'Black gold fuels your empire.',
    baseCost: 200000000,
    baseIncome: 12000000,
    baseSpeed: 300,
    icon: 'Droplets',
    color: 'bg-zinc-800',
  },
  {
    id: 'space',
    name: 'Space Exploration',
    description: 'The final frontier for profit.',
    baseCost: 1500000000,
    baseIncome: 90000000,
    baseSpeed: 600,
    icon: 'Rocket',
    color: 'bg-indigo-600',
  },
];

export const CITIES = [
  'Small Town',
  'Metro Hub',
  'Finance District',
  'Silicon Valley',
  'Global Network',
  'Lunar Base',
];

export const SAVE_KEY = 'capitalist_zenith_save';

export const STOCKS: Stock[] = [
  {
    id: 'tech',
    name: 'Aether Tech',
    symbol: 'AETH',
    basePrice: 100,
    volatility: 0.08,
    growthBias: 0.005,
    color: 'text-blue-500'
  },
  {
    id: 'energy',
    name: 'Solaris Energy',
    symbol: 'SOLR',
    basePrice: 50,
    volatility: 0.02,
    growthBias: 0.002,
    color: 'text-yellow-500'
  },
  {
    id: 'finance',
    name: 'Zenith Capital',
    symbol: 'ZNTH',
    basePrice: 250,
    volatility: 0.04,
    growthBias: 0.003,
    color: 'text-emerald-500'
  },
  {
    id: 'retail',
    name: 'Global Mart',
    symbol: 'MART',
    basePrice: 25,
    volatility: 0.03,
    growthBias: 0.001,
    color: 'text-rose-500'
  },
  {
    id: 'crypto',
    name: 'Nano Protocol',
    symbol: 'NANO',
    basePrice: 10,
    volatility: 0.25,
    growthBias: -0.002,
    color: 'text-purple-500'
  }
];

export const RIVALS: Rival[] = [
  {
    id: 'omni',
    name: 'Omni Group',
    logo: 'Zap',
    color: 'text-indigo-500',
    trait: 'aggressive'
  },
  {
    id: 'globo',
    name: 'Globo-Corp',
    logo: 'Globe',
    color: 'text-slate-400',
    trait: 'stable'
  },
  {
    id: 'atlas',
    name: 'Atlas Ventures',
    logo: 'Mountain',
    color: 'text-amber-600',
    trait: 'risky'
  }
];
