import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Trophy, RefreshCcw, Landmark, MapPin, Briefcase, Building2, LayoutDashboard, Settings, TrendingUp, Zap, Globe, Mountain, Users } from 'lucide-react';
import { GameState, RivalTrait, RivalState } from './types';
import { BUSINESSES, SAVE_KEY, CITIES, STOCKS, RIVALS } from './constants';
import { calculateCost, calculateIncome, formatCurrency } from './utils';
import { StatsHeader } from './components/StatsHeader';
import { BusinessCard } from './components/BusinessCard';
import { StockCard } from './components/StockCard';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { FloatingText } from './components/FloatingText';

const INITIAL_STATE: GameState = {
  money: 0,
  totalEarned: 0,
  prestigePoints: 0,
  prestigeCount: 0,
  ownedBusinesses: {
    lemonade: { id: 'lemonade', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    newspaper: { id: 'newspaper', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    carwash: { id: 'carwash', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    pizza: { id: 'pizza', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    gym: { id: 'gym', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    tech: { id: 'tech', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    bank: { id: 'bank', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    oil: { id: 'oil', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
    space: { id: 'space', level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 },
  },
  holdings: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: { symbol: s.symbol, shares: 0, avgBuyPrice: 0 } }), {}),
  stockPrices: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: s.basePrice }), {}),
  stockHistory: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: [s.basePrice] }), {}),
  portfolioHistory: [],
  rivals: {
    omni: { id: 'omni', wealth: 500, incomePerSec: 5, lastExpansion: Date.now() },
    globo: { id: 'globo', wealth: 2000, incomePerSec: 2, lastExpansion: Date.now() },
    atlas: { id: 'atlas', wealth: 100, incomePerSec: 10, lastExpansion: Date.now() },
  },
  lastSaved: Date.now(),
  currentCityIndex: 0,
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const diffSec = (now - parsed.lastSaved) / 1000;
        
        let offlineEarnings = 0;
        BUSINESSES.forEach(b => {
          const owned = parsed.ownedBusinesses[b.id];
          if (owned && owned.level > 0 && owned.isAutomated) {
            const income = calculateIncome(b.baseIncome, owned.level, owned.profitMultiplier, parsed.prestigePoints);
            offlineEarnings += income * diffSec;
          }
        });

        // Initialize missing fields if upgrading from old save
        if (!parsed.holdings) parsed.holdings = INITIAL_STATE.holdings;
        if (!parsed.stockPrices) parsed.stockPrices = INITIAL_STATE.stockPrices;
        if (!parsed.stockHistory) parsed.stockHistory = INITIAL_STATE.stockHistory;
        if (!parsed.portfolioHistory) parsed.portfolioHistory = INITIAL_STATE.portfolioHistory;
        if (!parsed.rivals) parsed.rivals = INITIAL_STATE.rivals;

        return {
          ...parsed,
          money: parsed.money + offlineEarnings,
          totalEarned: parsed.totalEarned + offlineEarnings,
          lastSaved: now,
          holdings: parsed.holdings || INITIAL_STATE.holdings,
          stockPrices: parsed.stockPrices || INITIAL_STATE.stockPrices,
          stockHistory: parsed.stockHistory || INITIAL_STATE.stockHistory,
          portfolioHistory: parsed.portfolioHistory || INITIAL_STATE.portfolioHistory,
          rivals: parsed.rivals || INITIAL_STATE.rivals,
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [prestigeTabOpen, setPrestigeTabOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !localStorage.getItem(SAVE_KEY));
  const [history, setHistory] = useState<{ time: string; val: number }[]>([]);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'hq' | 'assets' | 'market' | 'stocks' | 'leaderboard'>('hq');
  const lastTickRef = useRef(Date.now());

  const totalIncomePerSec = BUSINESSES.reduce((acc, b) => {
    const owned = state.ownedBusinesses[b.id];
    return acc + calculateIncome(b.baseIncome, owned.level, owned.profitMultiplier, state.prestigePoints);
  }, 0);

  // Income History Tracking
  useEffect(() => {
    const historyInterval = setInterval(() => {
      setHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), val: totalIncomePerSec }];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    }, 2000);
    return () => clearInterval(historyInterval);
  }, [totalIncomePerSec]);

  // Rival Growth Logic
  useEffect(() => {
    const rivalInterval = setInterval(() => {
      setState(prev => {
        const newRivals = { ...prev.rivals };
        const now = Date.now();

        Object.keys(newRivals).forEach(id => {
          const rival = newRivals[id];
          const config = RIVALS.find(r => r.id === id);
          if (!config) return;

          // Standard wealth growth
          rival.wealth += rival.incomePerSec * 5; // 5 second tick

          // Periodic Expansion (investment)
          const timeSinceExpansion = now - rival.lastExpansion;
          let expansionChance = 0.1;
          if (config.trait === 'aggressive') expansionChance = 0.25;
          if (config.trait === 'stable') expansionChance = 0.05;

          if (Math.random() < expansionChance && timeSinceExpansion > 15000) {
            // "Invest" some wealth to increase income
            const investment = rival.wealth * (config.trait === 'aggressive' ? 0.4 : 0.2);
            rival.wealth -= investment;
            rival.incomePerSec += (investment * 0.05) * (config.trait === 'risky' ? (Math.random() * 3) : 1);
            rival.lastExpansion = now;
          }
        });

        return { ...prev, rivals: newRivals };
      });
    }, 5000);
    return () => clearInterval(rivalInterval);
  }, []);
  useEffect(() => {
    const stockInterval = setInterval(() => {
      setState(prev => {
        const newPrices = { ...prev.stockPrices };
        const newHistory = { ...prev.stockHistory };

        STOCKS.forEach(s => {
          const currentPrice = newPrices[s.symbol];
          const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
          const change = currentPrice * s.volatility * randomFactor + (currentPrice * s.growthBias);
          const nextPrice = Math.max(1, currentPrice + change);
          
          newPrices[s.symbol] = nextPrice;
          newHistory[s.symbol] = [...(newHistory[s.symbol] || []).slice(-19), nextPrice];
        });

        // Calculate current portfolio value
        const holdingsValue = STOCKS.reduce((acc, s) => {
          const holding = prev.holdings[s.symbol];
          return acc + (holding ? holding.shares * newPrices[s.symbol] : 0);
        }, 0);
        const totalNetWorth = prev.money + holdingsValue;

        const nextPortfolioHistory = [
          ...prev.portfolioHistory.slice(-29),
          { time: new Date().toLocaleTimeString(), val: totalNetWorth }
        ];

        return {
          ...prev,
          stockPrices: newPrices,
          stockHistory: newHistory,
          portfolioHistory: nextPortfolioHistory
        };
      });
    }, 5000);
    return () => clearInterval(stockInterval);
  }, []);

  // Game Loop
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setState(prev => {
        let earnedThisTick = 0;
        BUSINESSES.forEach(b => {
          const owned = prev.ownedBusinesses[b.id];
          if (owned && owned.level > 0 && owned.isAutomated) {
            const income = calculateIncome(b.baseIncome, owned.level, owned.profitMultiplier, prev.prestigePoints);
            earnedThisTick += income * delta;
          }
        });

        if (earnedThisTick === 0) return { ...prev, lastSaved: now };

        const nextMoney = prev.money + earnedThisTick;
        const nextTotal = prev.totalEarned + earnedThisTick;
        let nextCity = prev.currentCityIndex;

        const thresholds = [0, 50000, 1000000, 50000000, 1000000000, 20000000000];
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (nextTotal >= thresholds[i]) {
            nextCity = Math.min(i, CITIES.length - 1);
            break;
          }
        }

        return {
          ...prev,
          money: nextMoney,
          totalEarned: nextTotal,
          currentCityIndex: nextCity,
          lastSaved: now
        };
      });
    }, 100);

    return () => clearInterval(tick);
  }, []);

  // Save Effect
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [state]);

  const handleManualClick = (e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    
    setClicks(prev => [...prev, { id: Date.now(), x, y }]);
    setState(prev => ({
      ...prev,
      money: prev.money + 10.00,
      totalEarned: prev.totalEarned + 10.00
    }));
  };

  const handleUpgrade = (businessId: string) => {
    const b = BUSINESSES.find(x => x.id === businessId);
    if (!b) return;

    const owned = state.ownedBusinesses[businessId];
    const cost = calculateCost(b.baseCost, owned.level);

    if (state.money >= cost) {
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        ownedBusinesses: {
          ...prev.ownedBusinesses,
          [businessId]: {
            ...owned,
            level: owned.level + 1
          }
        }
      }));
    }
  };

  const tradeStock = (symbol: string, amount: number, isBuy: boolean) => {
    const price = state.stockPrices[symbol];
    const cost = price * amount;

    if (isBuy) {
      if (state.money >= cost) {
        setState(prev => {
          const currentHolding = prev.holdings[symbol] || { symbol, shares: 0, avgBuyPrice: 0 };
          const totalShares = currentHolding.shares + amount;
          const newAvgPrice = (currentHolding.shares * currentHolding.avgBuyPrice + cost) / totalShares;
          
          return {
            ...prev,
            money: prev.money - cost,
            holdings: {
              ...prev.holdings,
              [symbol]: {
                ...currentHolding,
                shares: totalShares,
                avgBuyPrice: newAvgPrice
              }
            }
          };
        });
      }
    } else {
      const currentHolding = state.holdings[symbol];
      if (currentHolding && currentHolding.shares >= amount) {
        setState(prev => ({
          ...prev,
          money: prev.money + cost,
          totalEarned: prev.totalEarned + Math.max(0, cost - (currentHolding.avgBuyPrice * amount)),
          holdings: {
            ...prev.holdings,
            [symbol]: {
              ...currentHolding,
              shares: currentHolding.shares - amount
            }
          }
        }));
      }
    }
  };

  const potentialPrestigePoints = Math.max(0, Math.floor(Math.sqrt(state.totalEarned / 10000)) - state.prestigePoints);

  const handlePrestige = () => {
    if (potentialPrestigePoints > 0) {
      setState(prev => ({
        ...INITIAL_STATE,
        prestigePoints: prev.prestigePoints + potentialPrestigePoints,
        prestigeCount: prev.prestigeCount + 1,
        totalEarned: prev.totalEarned, 
      }));
      setPrestigeTabOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-8 border-b border-slate-100">
          <h1 className="text-xl font-black tracking-tight text-slate-800">VENTURE.OS</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Empire Operations</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('hq')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'hq' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Landmark className={`w-4 h-4 mr-3 ${activeTab === 'hq' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Empire HQ</span>
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'assets' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Briefcase className={`w-4 h-4 mr-3 ${activeTab === 'assets' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Active Assets</span>
          </button>
          <button 
            onClick={() => setActiveTab('stocks')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'stocks' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className={`w-4 h-4 mr-3 ${activeTab === 'stocks' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Stock Exchange</span>
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'market' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 mr-3 ${activeTab === 'market' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Market Analysis</span>
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'leaderboard' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-4 h-4 mr-3 ${activeTab === 'leaderboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Leaderboard</span>
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network</div>
          <button className="w-full flex items-center px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-all text-sm font-medium">
            <Building2 className="w-4 h-4 mr-3 text-slate-400" />
            Real Estate
          </button>
          <button className="w-full flex items-center px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-all text-sm font-medium">
            <Settings className="w-4 h-4 mr-3 text-slate-400" />
            Global Config
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Prestige Progress</div>
            <div className="text-lg font-black text-emerald-900">+{potentialPrestigePoints} Pts</div>
            <div className="w-full bg-emerald-200 h-1 rounded-full mt-2 overflow-hidden">
              <motion.div 
                animate={{ width: `${Math.min(100, (potentialPrestigePoints / 100) * 100)}%` }}
                className="bg-emerald-500 h-full"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {clicks.map(click => (
          <FloatingText 
            key={click.id} 
            x={click.x} 
            y={click.y} 
            text="+$10.00" 
            onComplete={() => setClicks(prev => prev.filter(c => c.id !== click.id))} 
          />
        ))}

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
          <div className="max-w-5xl mx-auto">
            {/* Robinhood-Style Global Header & Graph */}
            <section className="mb-10">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-3">Portfolio Value</p>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                      {formatCurrency(state.money + STOCKS.reduce((acc, s) => acc + (state.holdings[s.symbol]?.shares || 0) * state.stockPrices[s.symbol], 0))}
                    </h2>
                    <div className="flex items-center gap-4 mt-5">
                      <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-700">
                          {formatCurrency(STOCKS.reduce((acc, s) => {
                            const h = state.holdings[s.symbol];
                            if (!h) return acc;
                            return acc + (state.stockPrices[s.symbol] - h.avgBuyPrice) * h.shares;
                          }, 0))}
                        </span>
                      </div>
                      <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{formatCurrency(totalIncomePerSec)}/s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">REPUTATION</p>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-xl font-black text-slate-700">{state.prestigePoints}</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={state.portfolioHistory}>
                      <defs>
                        <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#000', fontWeight: '800' }}
                        cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPortfolio)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {activeTab === 'hq' && (
              <section className="flex flex-col items-center justify-center py-12 md:py-20 space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-[0.3em]">Empire Operations</h2>
                  <p className="text-slate-400 font-bold text-sm">MANUAL CAPITAL GENERATION PROTOCOL ACTIVE</p>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleManualClick(e)}
                  className="w-64 h-64 md:w-80 md:h-80 bg-white border-8 border-slate-900 rounded-[3rem] shadow-[0_30px_50px_-15px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Coins className="w-32 h-32 md:w-40 md:h-40 text-slate-900 relative z-10 group-hover:rotate-12 transition-transform" />
                  <div className="absolute bottom-10 text-[10px] font-black text-slate-400 tracking-[0.2em] group-hover:text-slate-900 transition-colors uppercase">
                    Click to Bootstrap
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Click Value</p>
                    <p className="text-2xl font-black text-slate-900">$10.00</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                    <p className="text-2xl font-black text-slate-900">100%</p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'market' && (
              <div className="space-y-6">
                <section className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Market Volatility</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Empire Performance Index</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-wider">Growth Stable</div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#000', fontWeight: '800' }}
                        />
                        <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHistory)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Trade</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">$4.2B</p>
                    <p className="text-xs font-bold text-emerald-500 mt-2">+12.4% Today</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inflation Rate</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">1.2%</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">Stable Target</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Sentiment</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">Greed</p>
                    <p className="text-xs font-bold text-amber-500 mt-2">High Volume</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stocks' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2 mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Assets</h3>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-6"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {STOCKS.map(s => (
                    <StockCard
                      key={s.symbol}
                      stock={s}
                      price={state.stockPrices[s.symbol]}
                      history={state.stockHistory[s.symbol]}
                      holding={state.holdings[s.symbol] || { symbol: s.symbol, shares: 0, avgBuyPrice: 0 }}
                      money={state.money}
                      onBuy={(amt) => tradeStock(s.symbol, amt, true)}
                      onSell={(amt) => tradeStock(s.symbol, amt, false)}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'leaderboard' && (
              <section className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Market Dominance</h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Global Corporate Leaderboard</p>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'player', name: 'Capitalist Zenith (You)', wealth: state.money + STOCKS.reduce((acc, s) => acc + (state.holdings[s.symbol]?.shares || 0) * state.stockPrices[s.symbol], 0), isPlayer: true, color: 'text-indigo-600', logo: 'Landmark', trait: 'stable' as RivalTrait },
                      ...(Object.values(state.rivals) as RivalState[]).map(r => {
                        const config = RIVALS.find(rc => rc.id === r.id);
                        return {
                          id: r.id,
                          wealth: r.wealth,
                          incomePerSec: r.incomePerSec,
                          name: config?.name || 'Rival',
                          logo: config?.logo || 'Landmark',
                          color: config?.color || 'text-slate-400',
                          trait: config?.trait || 'stable' as RivalTrait,
                          isPlayer: false
                        };
                      })
                    ].sort((a, b) => b.wealth - a.wealth).map((entry, idx) => {
                      return (
                        <div key={entry.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${entry.isPlayer ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-black w-6 text-slate-400">{idx + 1}</div>
                            <div className={`p-3 rounded-xl ${entry.isPlayer ? 'bg-indigo-500' : 'bg-slate-50'}`}>
                              {entry.logo === 'Landmark' ? <Landmark className={`w-5 h-5 ${entry.isPlayer ? 'text-white' : 'text-slate-900'}`} /> : 
                               entry.logo === 'Zap' ? <Zap className={`w-5 h-5 ${entry.isPlayer ? 'text-white' : 'text-indigo-500'}`} /> :
                               entry.logo === 'Globe' ? <Globe className={`w-5 h-5 ${entry.isPlayer ? 'text-white' : 'text-slate-400'}`} /> :
                               <Mountain className={`w-5 h-5 ${entry.isPlayer ? 'text-white' : 'text-amber-600'}`} />}
                            </div>
                            <div>
                              <h4 className={`font-black text-sm uppercase tracking-tight ${entry.isPlayer ? 'text-white' : 'text-slate-900'}`}>{entry.name}</h4>
                              <p className={`text-[10px] font-bold ${entry.isPlayer ? 'text-indigo-300' : 'text-slate-400'}`}>
                                {entry.isPlayer ? 'ESTABLISHED 2024' : entry.trait?.toUpperCase() || 'COMPETITOR'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-lg ${entry.isPlayer ? 'text-emerald-400' : 'text-slate-900'}`}>{formatCurrency(entry.wealth)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Valuation</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Region Info */}
            {activeTab !== 'stocks' && (
              <div className="mb-8 flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Territory Control</p>
                    <h2 className="text-lg font-black text-slate-800">{CITIES[state.currentCityIndex]}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setPrestigeTabOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm shadow-sm"
                >
                  <RefreshCcw className="w-4 h-4 text-emerald-400" />
                  <span>Expansion</span>
                </button>
              </div>
            )}

            {/* Business Grid */}
            {activeTab === 'assets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                {BUSINESSES.map((b) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    owned={state.ownedBusinesses[b.id]}
                    canAfford={state.money >= calculateCost(b.baseCost, state.ownedBusinesses[b.id].level)}
                    prestigePoints={state.prestigePoints}
                    onUpgrade={() => handleUpgrade(b.id)}
                    onManualCollect={handleManualClick}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center px-6 md:px-10 text-[10px] uppercase tracking-widest space-x-6 text-slate-500 z-10 shrink-0">
          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>Protocol Secure</span>
          <span className="flex-1 overflow-hidden whitespace-nowrap italic text-slate-600 hidden md:block">Active Connection: {CITIES[state.currentCityIndex]} Mainframe Linked...</span>
          <span className="text-slate-300 font-bold">Venture.OS v1.0</span>
        </footer>

        {/* Global Manual Collector (Floating) removed since HQ page exists */}
      </div>

      {/* Prestige Modal */}
      <AnimatePresence>
        {prestigeTabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-slate-800" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Empire Expansion</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">
                  Liquidating current assets will unlock permanent strategic advantages.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Strategic Points</span>
                    <span className="text-emerald-600 font-black text-xl">+{potentialPrestigePoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Global Multiplier</span>
                    <span className="text-slate-900 font-black text-xl">+{potentialPrestigePoints * 2}%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePrestige}
                    disabled={potentialPrestigePoints === 0}
                    className={`w-full py-4 rounded-xl font-bold transition-all shadow-sm ${
                      potentialPrestigePoints > 0 
                        ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Authorize Expansion
                  </button>
                  <button
                    onClick={() => setPrestigeTabOpen(false)}
                    className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors uppercase tracking-widest"
                  >
                    Cancel Operations
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {welcomeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl p-12 text-center"
            >
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl border-4 border-slate-800">
                <Landmark className="w-12 h-12 text-emerald-400" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">CAPITALIST ZENITH</h1>
              <p className="text-slate-500 leading-relaxed mb-12 text-lg font-medium px-4">
                Redefine the landscape of global industry. Architect your legacy through strategic expansion and precise asset management.
              </p>
              <button
                onClick={() => setWelcomeOpen(false)}
                className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 uppercase tracking-widest"
              >
                Launch Protocol
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
