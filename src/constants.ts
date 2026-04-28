import { Business, Stock, Rival, HypeEvent, House } from './types';

export const BUSINESSES: Business[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    description: 'Refreshing citrus, humble beginnings.',
    baseCost: 100,
    baseIncome: 1,
    baseSpeed: 1,
    icon: 'Citrus',
    color: 'bg-yellow-400',
  },
  {
    id: 'newspaper',
    name: 'Newspaper Delivery',
    description: 'The news never stops, and neither do you.',
    baseCost: 800,
    baseIncome: 15,
    baseSpeed: 3,
    icon: 'Newspaper',
    color: 'bg-slate-400',
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    description: 'Sudsy profits for the mobile elite.',
    baseCost: 5000,
    baseIncome: 100,
    baseSpeed: 6,
    icon: 'Car',
    color: 'bg-blue-400',
  },
  {
    id: 'pizza',
    name: 'Pizza Parlor',
    description: 'Dough, cheese, and cold hard cash.',
    baseCost: 40000,
    baseIncome: 800,
    baseSpeed: 12,
    icon: 'Pizza',
    color: 'bg-red-400',
  },
  {
    id: 'gym',
    name: 'Luxury Fitness',
    description: 'Healty bodies, healthy dividends.',
    baseCost: 350000,
    baseIncome: 8000,
    baseSpeed: 24,
    icon: 'Dumbbell',
    color: 'bg-emerald-400',
  },
  {
    id: 'tech',
    name: 'Real Estate Holding',
    description: 'Luxury properties and rapid appreciation.',
    baseCost: 3000000,
    baseIncome: 65000,
    baseSpeed: 60,
    icon: 'Building2',
    color: 'bg-purple-400',
  },
  {
    id: 'bank',
    name: 'Private Bank',
    description: 'Managing other people\'s money.',
    baseCost: 25000000,
    baseIncome: 500000,
    baseSpeed: 120,
    icon: 'Landmark',
    color: 'bg-amber-600',
  },
  {
    id: 'oil',
    name: 'Oil Conglomerate',
    description: 'Black gold fuels your empire.',
    baseCost: 200000000,
    baseIncome: 4000000,
    baseSpeed: 300,
    icon: 'Droplets',
    color: 'bg-zinc-800',
  },
  {
    id: 'space',
    name: 'Space Exploration',
    description: 'The final frontier for profit.',
    baseCost: 1500000000,
    baseIncome: 30000000,
    baseSpeed: 600,
    icon: 'Rocket',
    color: 'bg-indigo-600',
  },
  {
    id: 'ai',
    name: 'AI Laboratory',
    description: 'Sentient algorithms maximizing your ROI.',
    baseCost: 10000000000,
    baseIncome: 180000000,
    baseSpeed: 1200,
    icon: 'Cpu',
    color: 'bg-cyan-600',
  },
  {
    id: 'quantum',
    name: 'Quantum Network',
    description: 'Processing wealth at the speed of thought.',
    baseCost: 75000000000,
    baseIncome: 1200000000,
    baseSpeed: 3000,
    icon: 'Network',
    color: 'bg-violet-600',
  },
  {
    id: 'galactic',
    name: 'Galactic Trading Hub',
    description: 'The center of interplanetary commerce.',
    baseCost: 500000000000,
    baseIncome: 8000000000,
    baseSpeed: 6000,
    icon: 'Globe',
    color: 'bg-blue-600',
  },
  {
    id: 'dyson',
    name: 'Dyson Sphere Project',
    description: 'Harvesting the total output of a star.',
    baseCost: 2500000000000,
    baseIncome: 45000000000,
    baseSpeed: 12000,
    icon: 'Sun',
    color: 'bg-amber-600',
  },
  {
    id: 'interstellar',
    name: 'Interstellar Gateway',
    description: 'Connecting distant galaxies for profit.',
    baseCost: 10000000000000,
    baseIncome: 250000000000,
    baseSpeed: 24000,
    icon: 'Milestone',
    color: 'bg-indigo-700',
  },
  {
    id: 'reality',
    name: 'Reality Simulation Lab',
    description: 'Where virtual wealth becomes physical gain.',
    baseCost: 50000000000000,
    baseIncome: 1500000000000,
    baseSpeed: 48000,
    icon: 'Sparkles',
    color: 'bg-fuchsia-600',
  },
  {
    id: 'omega',
    name: 'Omega Forge',
    description: 'Forging the very fabric of value.',
    baseCost: 250000000000000,
    baseIncome: 10000000000000,
    baseSpeed: 96000,
    icon: 'Flame',
    color: 'bg-rose-700',
  },
  {
    id: 'chronos',
    name: 'Time Travel Bureau',
    description: 'Selling premium minutes to the future.',
    baseCost: 1000000000000000,
    baseIncome: 65000000000000,
    baseSpeed: 150000,
    icon: 'Timer',
    color: 'bg-indigo-900',
  },
  {
    id: 'supernova',
    name: 'Supernova Harvester',
    description: 'Capturing the energy of dying stars.',
    baseCost: 5000000000000000,
    baseIncome: 400000000000000,
    baseSpeed: 300000,
    icon: 'Zap',
    color: 'bg-orange-500',
  },
  {
    id: 'void_engine',
    name: 'Void Engine',
    description: 'Generating wealth from pure nothingness.',
    baseCost: 25000000000000000,
    baseIncome: 2000000000000000,
    baseSpeed: 600000,
    icon: 'Waves',
    color: 'bg-slate-900',
  },
  {
    id: 'multiverse',
    name: 'Multiverse Conduit',
    description: 'Taxing every transaction in existence.',
    baseCost: 100000000000000000,
    baseIncome: 12000000000000000,
    baseSpeed: 1200000,
    icon: 'Network',
    color: 'bg-fuchsia-900',
  },
];

export const CITIES = [
  { name: 'Small Town', multiplier: 1, emoji: '🏡', unlockCost: 0 },
  { name: 'Metro Hub', multiplier: 5, emoji: '🌆', unlockCost: 10000 },
  { name: 'Finance District', multiplier: 25, emoji: '🏦', unlockCost: 500000 },
  { name: 'Silicon Valley', multiplier: 150, emoji: '🛰️', unlockCost: 20000000 },
  { name: 'Global Network', multiplier: 1000, emoji: '🌐', unlockCost: 200000000 },
  { name: 'Lunar Base', multiplier: 5000, emoji: '🌑', unlockCost: 1000000000 },
  { name: 'Mars Colony', multiplier: 25000, emoji: '☄️', unlockCost: 10000000000 },
  { name: 'Deep Sea Base', multiplier: 120000, emoji: '🐙', unlockCost: 50000000000 },
  { name: 'Alpha Centauri', multiplier: 500000, emoji: '✨', unlockCost: 250000000000 },
  { name: 'Andromeda Reach', multiplier: 2000000, emoji: '🌌', unlockCost: 1000000000000 },
  { name: 'Void Nexus', multiplier: 10000000, emoji: '🌀', unlockCost: 5000000000000 },
  { name: 'Time Anchor', multiplier: 50000000, emoji: '⏳', unlockCost: 25000000000000 },
  { name: 'Multiverse Hub', multiplier: 250000000, emoji: '♾️', unlockCost: 100000000000000 },
  { name: 'Eternity Spires', multiplier: 1500000000, emoji: '🏛️', unlockCost: 500000000000000 },
  { name: 'Omnipresent Core', multiplier: 10000000000, emoji: '💎', unlockCost: 2500000000000000 },
  { name: 'The Zenith', multiplier: 100000000000, emoji: '👑', unlockCost: 10000000000000000 },
];

export interface Milestone {
  id: string;
  label: string;
  target: number;
  rewardText: string;
  featureId?: 'market' | 'stocks' | 'prestige';
}

export const MILESTONES: Milestone[] = [
  { id: 'm1', label: 'Local Legend', target: 10000, rewardText: 'Unlocks Global Markets', featureId: 'market' },
  { id: 'm2', label: 'Stock Market Entry', target: 25000, rewardText: 'Unlocks Stock Market', featureId: 'stocks' },
  { id: 'm3', label: 'Economic Titan', target: 1000000, rewardText: 'Unlocks Prestige System', featureId: 'prestige' },
];

export const HOUSES: House[] = [
  {
    id: 'starter',
    name: 'Suburban Starter',
    description: 'A cozy 2-bedroom home in a quiet neighborhood.',
    basePrice: 150000,
    monthlyRent: 400,
    appreciationRate: 0.005,
    color: 'text-orange-500',
    icon: 'Home'
  },
  {
    id: 'condo',
    name: 'City Condo',
    description: 'Modern living in the heart of the metro.',
    basePrice: 450000,
    monthlyRent: 1200,
    appreciationRate: 0.008,
    color: 'text-cyan-500',
    icon: 'Building'
  },
  {
    id: 'mansion',
    name: 'Estate Mansion',
    description: 'A sprawling gated estate for the ultra-wealthy.',
    basePrice: 2500000,
    monthlyRent: 6000,
    appreciationRate: 0.012,
    color: 'text-indigo-500',
    icon: 'Castle'
  },
  {
    id: 'skyscraper',
    name: 'Luxury Penthouse',
    description: 'Panoramic views and absolute prestige.',
    basePrice: 15000000,
    monthlyRent: 40000,
    appreciationRate: 0.015,
    color: 'text-amber-500',
    icon: 'Trophy'
  },
  {
    id: 'villa',
    name: 'Mediterranean Villa',
    description: 'Sun-drenched luxury on the coast.',
    basePrice: 50000000,
    monthlyRent: 150000,
    appreciationRate: 0.018,
    color: 'text-rose-400',
    icon: 'Palmtree'
  },
  {
    id: 'island',
    name: 'Private Island',
    description: 'Your own sovereign territory in the Pacific.',
    basePrice: 250000000,
    monthlyRent: 800000,
    appreciationRate: 0.022,
    color: 'text-emerald-400',
    icon: 'Waves'
  },
  {
    id: 'liner',
    name: 'Floating Estate',
    description: 'A massive ocean-going luxury residence.',
    basePrice: 1200000000,
    monthlyRent: 4000000,
    appreciationRate: 0.025,
    color: 'text-indigo-400',
    icon: 'Ship'
  },
  {
    id: 'cloud',
    name: 'Cloud Palace',
    description: 'Floating architecture above the storms.',
    basePrice: 5000000000,
    monthlyRent: 20000000,
    appreciationRate: 0.03,
    color: 'text-sky-300',
    icon: 'Cloud'
  },
  {
    id: 'dome',
    name: 'Lunar Dome',
    description: 'Self-sustaining luxury on the lunar surface.',
    basePrice: 25000000000,
    monthlyRent: 120000000,
    appreciationRate: 0.035,
    color: 'text-slate-300',
    icon: 'Moon'
  },
  {
    id: 'biohab',
    name: 'Martian Bio-Hab',
    description: 'Red planet living with green earth amenities.',
    basePrice: 100000000000,
    monthlyRent: 500000000,
    appreciationRate: 0.04,
    color: 'text-orange-600',
    icon: 'TreePine'
  },
  {
    id: 'ark',
    name: 'Orbital Ark',
    description: 'A massive space station for the chosen few.',
    basePrice: 500000000000,
    monthlyRent: 3000000000,
    appreciationRate: 0.045,
    color: 'text-indigo-600',
    icon: 'Orbit'
  },
  {
    id: 'flagship',
    name: 'Starship Flagship',
    description: 'The ultimate mobile residence in deep space.',
    basePrice: 2500000000000,
    monthlyRent: 18000000000,
    appreciationRate: 0.05,
    color: 'text-zinc-400',
    icon: 'Framer'
  },
  {
    id: 'palace',
    name: 'Cosmic Palace',
    description: 'A residence that spans multiple dimensions.',
    basePrice: 10000000000000,
    monthlyRent: 100000000000,
    appreciationRate: 0.055,
    color: 'text-amber-300',
    icon: 'Castle'
  },
  {
    id: 'eternity_flat',
    name: 'Eternity Suite',
    description: 'Live forever in absolute automated luxury.',
    basePrice: 50000000000000,
    monthlyRent: 450000000000,
    appreciationRate: 0.06,
    color: 'text-violet-400',
    icon: 'Star'
  }
];

export const SAVE_KEY = 'capitalist_zenith_save';

export const STOCKS: Stock[] = [
  {
    id: 'tech',
    name: 'Aether Tech',
    symbol: 'AETH',
    basePrice: 100,
    volatility: 0.15,
    growthBias: 0.008,
    color: 'text-blue-500'
  },
  {
    id: 'energy',
    name: 'Solaris Energy',
    symbol: 'SOLR',
    basePrice: 50,
    volatility: 0.05,
    growthBias: 0.004,
    color: 'text-yellow-500'
  },
  {
    id: 'finance',
    name: 'Zenith Capital',
    symbol: 'ZNTH',
    basePrice: 250,
    volatility: 0.10,
    growthBias: 0.006,
    color: 'text-emerald-500'
  },
  {
    id: 'retail',
    name: 'Global Mart',
    symbol: 'MART',
    basePrice: 25,
    volatility: 0.08,
    growthBias: 0.003,
    color: 'text-rose-500'
  },
  {
    id: 'crypto',
    name: 'Nano Protocol',
    symbol: 'NANO',
    basePrice: 10,
    volatility: 0.45,
    growthBias: -0.005,
    color: 'text-purple-500'
  },
  {
    id: 'robotics',
    name: 'Vortex Robotics',
    symbol: 'VRTX',
    basePrice: 420,
    volatility: 0.22,
    growthBias: 0.012,
    color: 'text-cyan-400'
  },
  {
    id: 'genetics',
    name: 'Neo Genetics',
    symbol: 'NEOG',
    basePrice: 180,
    volatility: 0.35,
    growthBias: 0.015,
    color: 'text-rose-400'
  },
  {
    id: 'chronos',
    name: 'Chronos Tech',
    symbol: 'CHRN',
    basePrice: 850,
    volatility: 0.18,
    growthBias: 0.02,
    color: 'text-indigo-400'
  },
  {
    id: 'void',
    name: 'Void Energy',
    symbol: 'VOID',
    basePrice: 1200,
    volatility: 0.4,
    growthBias: 0.025,
    color: 'text-slate-900'
  },
  {
    id: 'nbio',
    name: 'Nano Bio',
    symbol: 'NBIO',
    basePrice: 350,
    volatility: 0.25,
    growthBias: 0.018,
    color: 'text-emerald-300'
  },
  {
    id: 'starmining',
    name: 'Stellar Mining',
    symbol: 'STAR',
    basePrice: 5000,
    volatility: 0.12,
    growthBias: 0.01,
    color: 'text-amber-300'
  },
  {
    id: 'gate',
    name: 'Dimension Gate',
    symbol: 'GATE',
    basePrice: 15000,
    volatility: 0.5,
    growthBias: 0.05,
    color: 'text-fuchsia-400'
  },
  {
    id: 'eternity',
    name: 'Eternity Corp',
    symbol: 'ETRN',
    basePrice: 50000,
    volatility: 0.05,
    growthBias: 0.08,
    color: 'text-blue-200'
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

export const HYPE_EVENTS: HypeEvent[] = [
  {
    id: 'investor_boom',
    name: 'Investor Boom 💰',
    multiplier: 2,
    description: 'Venture capitalists are raining cash! All income x2.',
    color: 'bg-emerald-500'
  },
  {
    id: 'viral_trend',
    name: 'Viral Trend 📈',
    multiplier: 5,
    description: 'Your empire is trending on social media! All income x5.',
    color: 'bg-indigo-500'
  },
  {
    id: 'market_crash',
    name: 'Market Crash 📉',
    multiplier: 0.5,
    description: 'Black Monday! Your assets have plummeted and accounts are Frozen. All income x0.5.',
    color: 'bg-red-600'
  },
  {
    id: 'tax_audit',
    name: 'Tax Audit 📋',
    multiplier: 0.8,
    description: 'The IRS is breathing down your neck. 20% income reduction and instant cash penalty.',
    color: 'bg-slate-700'
  },
  {
    id: 'hyper_growth',
    name: 'Hyper-Growth Engine 🚀',
    multiplier: 15,
    description: 'Singularity achieved. Infinite profit potential! all income x15.',
    color: 'bg-violet-500'
  }
];
