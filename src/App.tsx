import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Trophy, RefreshCcw, Landmark, MapPin, Briefcase, Building2, LayoutDashboard, Settings, TrendingUp, Zap, Globe, Mountain, Users, Flame, Star, Timer, LogIn, LogOut, Cloud, Calendar, Palmtree, Waves, Ship, Network, Cpu, Home, Building, Sun, Milestone, Sparkles, Moon, TreePine, Orbit, Framer } from 'lucide-react';
import { GameState, RivalTrait, RivalState, HypeEvent, Property, LeaderboardEntry } from './types';
import { BUSINESSES, SAVE_KEY, CITIES, STOCKS, RIVALS, HYPE_EVENTS, MILESTONES, HOUSES } from './constants';
import { calculateCost, calculateIncome, formatCurrency, formatGameDate } from './utils';
import { StatsHeader } from './components/StatsHeader';
import { BusinessCard } from './components/BusinessCard';
import { StockCard } from './components/StockCard';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { FloatingText } from './components/FloatingText';
import { auth, signInWithGoogle, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const INITIAL_STATE: GameState = {
  money: 0,
  totalEarned: 0,
  gameDate: 0, // Jan 1, 2000
  prestigePoints: 0,
  prestigeCount: 0,
  ownedBusinesses: BUSINESSES.reduce((acc, b) => ({
    ...acc,
    [b.id]: { id: b.id, level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 }
  }), {}),
  holdings: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: { symbol: s.symbol, shares: 0, avgBuyPrice: 0 } }), {}),
  properties: [],
  stockPrices: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: s.basePrice }), {}),
  stockHistory: STOCKS.reduce((acc, s) => ({ ...acc, [s.symbol]: [s.basePrice] }), {}),
  portfolioHistory: [],
  rivals: {
    omni: { id: 'omni', wealth: 500, incomePerSec: 5, lastExpansion: Date.now() },
    globo: { id: 'globo', wealth: 2000, incomePerSec: 2, lastExpansion: Date.now() },
    atlas: { id: 'atlas', wealth: 100, incomePerSec: 10, lastExpansion: Date.now() },
  },
  clickLevel: 1,
  activeEvent: null,
  eventTimeLeft: 0,
  unlockedFeatures: {
    market: false,
    stocks: false,
    prestige: false,
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
        const mergedUnlockedFeatures = {
          ...INITIAL_STATE.unlockedFeatures,
          ...(parsed.unlockedFeatures || {})
        };

        // Merging owned businesses to ensure all IDs exist
        const mergedBusinesses = { ...INITIAL_STATE.ownedBusinesses };
        if (parsed.ownedBusinesses) {
          Object.keys(parsed.ownedBusinesses).forEach((key) => {
            mergedBusinesses[key] = {
              ...mergedBusinesses[key],
              ...parsed.ownedBusinesses[key],
            };
          });
        }

        // Merging holdings and stock data
        const mergedHoldings = { ...INITIAL_STATE.holdings, ...(parsed.holdings || {}) };
        const mergedStockPrices = { ...INITIAL_STATE.stockPrices, ...(parsed.stockPrices || {}) };
        const mergedStockHistory = { ...INITIAL_STATE.stockHistory, ...(parsed.stockHistory || {}) };

        return {
          ...parsed,
          money: Number(parsed.money),
          totalEarned: Number(parsed.totalEarned),
          gameDate: Number(parsed.gameDate || 0),
          prestigePoints: Number(parsed.prestigePoints),
          ownedBusinesses: mergedBusinesses,
          holdings: mergedHoldings,
          properties: parsed.properties || [],
          stockPrices: mergedStockPrices,
          stockHistory: mergedStockHistory,
          portfolioHistory: parsed.portfolioHistory || INITIAL_STATE.portfolioHistory,
          rivals: parsed.rivals || INITIAL_STATE.rivals,
          clickLevel: parsed.clickLevel || INITIAL_STATE.clickLevel,
          activeEvent: parsed.activeEvent || INITIAL_STATE.activeEvent,
          eventTimeLeft: parsed.eventTimeLeft || INITIAL_STATE.eventTimeLeft,
          unlockedFeatures: mergedUnlockedFeatures,
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [prestigeTabOpen, setPrestigeTabOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !localStorage.getItem(SAVE_KEY));
  const [history, setHistory] = useState<{ time: string; val: number }[]>([]);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; value: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'hq' | 'businesses' | 'properties' | 'market' | 'stocks' | 'leaderboard'>('hq');
  const [tapChallenge, setTapChallenge] = useState<{ active: boolean; needed: number; current: number; reward: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const lastTickRef = useRef(Date.now());

  const totalIncomePerSec = React.useMemo(() => {
    let income = BUSINESSES.reduce((acc, b) => {
      const owned = state.ownedBusinesses[b.id] || { level: 0, profitMultiplier: 1 };
      let inc = calculateIncome(b.baseIncome, owned.level, owned.profitMultiplier, state.prestigePoints);
      if (state.activeEvent?.multiplier) inc *= state.activeEvent.multiplier;
      return acc + inc;
    }, 0) * (CITIES[state.currentCityIndex]?.multiplier || 1);

    // Add property rent
    (state.properties || []).forEach(p => {
      const house = HOUSES.find(h => h.id === p.houseId);
      if (house) income += (house.monthlyRent / 30) * (CITIES[state.currentCityIndex]?.multiplier || 1);
    });

    return income;
  }, [state.ownedBusinesses, state.properties, state.prestigePoints, state.activeEvent, state.currentCityIndex]);

  // Wealth History Tracking
  useEffect(() => {
    const historyInterval = setInterval(() => {
      setHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), val: stateRef.current.money }];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    }, 2000);
    return () => clearInterval(historyInterval);
  }, []);

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
    }, 2000);
    return () => clearInterval(stockInterval);
  }, []);

  // Hype Event & Challenge Logic
  useEffect(() => {
    const eventInterval = setInterval(() => {
      setState(prev => {
        // Decrease timer if event active
        if (prev.activeEvent) {
          const nextTime = prev.eventTimeLeft - 1;
          if (nextTime <= 0) {
            return { ...prev, activeEvent: null, eventTimeLeft: 0 };
          }
          return { ...prev, eventTimeLeft: nextTime };
        }

        // Randomly trigger new event (1% chance every second)
        if (Math.random() < 0.01) {
          const randomEvent = HYPE_EVENTS[Math.floor(Math.random() * HYPE_EVENTS.length)];
          const duration = 30 + Math.floor(Math.random() * 30); // 30-60s
          return { ...prev, activeEvent: randomEvent, eventTimeLeft: duration };
        }

        return prev;
      });
    }, 1000);

    const challengeInterval = setInterval(() => {
      if (!tapChallenge && Math.random() < 0.05) { // 5% chance every 10s
        const needed = 20 + Math.floor(Math.random() * 30);
        const reward = totalIncomePerSec * (10 + Math.random() * 50); // 10-60s of income
        setTapChallenge({ active: true, needed, current: 0, reward });
        
        // Auto-fail after 10 seconds
        setTimeout(() => {
          setTapChallenge(null);
        }, 10000);
      }
    }, 10000);

    return () => {
      clearInterval(eventInterval);
      clearInterval(challengeInterval);
    };
  }, [tapChallenge, totalIncomePerSec]);

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
            let income = calculateIncome(b.baseIncome, owned.level, owned.profitMultiplier, prev.prestigePoints);
            if (prev.activeEvent) income *= prev.activeEvent.multiplier;
            earnedThisTick += income;
          }
        });

        // Add property rent: monthlyRent / 30 = rent per day
        (prev.properties || []).forEach(p => {
          const house = HOUSES.find(h => h.id === p.houseId);
          if (house) {
            earnedThisTick += house.monthlyRent / 30;
          }
        });

        earnedThisTick *= (CITIES[prev.currentCityIndex]?.multiplier || 1);
        earnedThisTick *= delta;

        const nextGameDate = prev.gameDate + delta;
        const nextMoney = prev.money + earnedThisTick;
        const nextTotal = prev.totalEarned + earnedThisTick;
        let nextCity = prev.currentCityIndex;

        const thresholds = [0, 50000, 1000000, 50000000, 1000000000, 20000000000, 100000000000, 500000000000, 2500000000000, 10000000000000, 50000000000000, 250000000000000, 1000000000000000];
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
          gameDate: nextGameDate,
          currentCityIndex: nextCity,
          lastSaved: now
        };
      });
    }, 100);

    return () => clearInterval(tick);
  }, []);

  // Milestone Check Logic
  useEffect(() => {
    const checkMilestones = () => {
      const updates: Partial<{ market: boolean, stocks: boolean, prestige: boolean }> = {};
      let changed = false;

      MILESTONES.forEach(m => {
        if (m.featureId && !state.unlockedFeatures[m.featureId] && state.money >= m.target) {
          updates[m.featureId] = true;
          changed = true;
        }
      });

      if (changed) {
        setState(prev => ({
          ...prev,
          unlockedFeatures: {
            ...INITIAL_STATE.unlockedFeatures,
            ...prev.unlockedFeatures,
            ...updates
          }
        }));
      }
    };
    checkMilestones();
  }, [state.money]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadStateFromFirestore(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Global Leaderboard
  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('wealth', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
      setLeaderboard(entries);
    });
    return () => unsubscribe();
  }, []);

  const updateGlobalLeaderboard = async (uId: string, wealth: number, displayName: string | null) => {
    try {
      await setDoc(doc(db, 'leaderboard', uId), {
        uid: uId,
        displayName: displayName || 'Anonymous Tycoon',
        wealth: wealth,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Error updating leaderboard:", e);
    }
  };

  const saveStateToFirestore = async (uId: string, currentState: GameState) => {
    try {
      setIsCloudSyncing(true);
      const saveRef = doc(db, 'saves', uId);
      await setDoc(saveRef, {
        userId: uId,
        gameState: currentState,
        updatedAt: serverTimestamp()
      });
      
      const totalWealth = currentState.money + STOCKS.reduce((acc, s) => acc + (currentState.holdings[s.symbol]?.shares || 0) * currentState.stockPrices[s.symbol], 0);
      await updateGlobalLeaderboard(uId, totalWealth, user?.displayName || null);
      
      setIsCloudSyncing(false);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      setIsCloudSyncing(false);
    }
  };

  const loadStateFromFirestore = async (uId: string) => {
    try {
      const saveRef = doc(db, 'saves', uId);
      const docSnap = await getDoc(saveRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const firestoreState = data.gameState as GameState;
        
        // Merge with local state or overwrite? Usually overwrite if firestore is newer
        // For simplicity, we overwrite local state with firestore data if it exists
        setState(prev => {
          const mergedBusinesses = { ...INITIAL_STATE.ownedBusinesses, ...prev.ownedBusinesses, ...(firestoreState.ownedBusinesses || {}) };
          const mergedHoldings = { ...INITIAL_STATE.holdings, ...prev.holdings, ...(firestoreState.holdings || {}) };
          const mergedStockPrices = { ...INITIAL_STATE.stockPrices, ...prev.stockPrices, ...(firestoreState.stockPrices || {}) };
          const mergedStockHistory = { ...INITIAL_STATE.stockHistory, ...prev.stockHistory, ...(firestoreState.stockHistory || {}) };
          
          return {
            ...INITIAL_STATE,
            ...prev,
            ...firestoreState,
            ownedBusinesses: mergedBusinesses,
            holdings: mergedHoldings,
            stockPrices: mergedStockPrices,
            stockHistory: mergedStockHistory,
            properties: firestoreState.properties || [],
            unlockedFeatures: {
              ...INITIAL_STATE.unlockedFeatures,
              ...(firestoreState.unlockedFeatures || {})
            },
            lastSaved: Date.now() // Reset tick reference
          };
        });
      }
    } catch (error) {
      console.error('Error loading from Firestore:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Save Ref to access latest state in interval without resetting it
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Save Effect
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (user) {
        // Only save progress if user is signed in as requested
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
        saveStateToFirestore(user.uid, stateRef.current);
      }
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [user]); // Only reset if user changes, not on every state tick

  const handleManualClick = (e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    
    let clickValue = state.clickLevel;
    if (state.activeEvent) clickValue *= state.activeEvent.multiplier;

    // Handle Tap Challenge
    if (tapChallenge && tapChallenge.active) {
      const nextCurrent = tapChallenge.current + 1;
      if (nextCurrent >= tapChallenge.needed) {
        setState(prev => ({
          ...prev,
          money: prev.money + tapChallenge.reward,
          totalEarned: prev.totalEarned + tapChallenge.reward
        }));
        setTapChallenge(null);
      } else {
        setTapChallenge({ ...tapChallenge, current: nextCurrent });
      }
    }

    setClicks(prev => [...prev, { id: Date.now(), x, y, value: clickValue }]);
    setState(prev => ({
      ...prev,
      money: prev.money + clickValue,
      totalEarned: prev.totalEarned + clickValue
    }));
  };

  const buyProperty = (houseId: string) => {
    const house = HOUSES.find(h => h.id === houseId);
    if (!house) return;

    const currentHousePrice = house.basePrice * Math.pow(1 + house.appreciationRate, Math.floor(state.gameDate / 30));

    if (state.money >= currentHousePrice) {
      const newProperty: Property = {
        id: Math.random().toString(36).substr(2, 9),
        houseId: house.id,
        purchasePrice: currentHousePrice,
        purchaseDate: state.gameDate
      };

      setState(prev => ({
        ...prev,
        money: prev.money - currentHousePrice,
        properties: [...(prev.properties || []), newProperty]
      }));
    }
  };

  const sellProperty = (propertyId: string) => {
    const property = (state.properties || []).find(p => p.id === propertyId);
    if (!property) return;
    
    const house = HOUSES.find(h => h.id === property.houseId);
    if (!house) return;

    const currentHousePrice = house.basePrice * Math.pow(1 + house.appreciationRate, Math.floor(state.gameDate / 30));

    setState(prev => ({
      ...prev,
      money: prev.money + currentHousePrice,
      properties: (prev.properties || []).filter(p => p.id !== propertyId)
    }));
  };

  const handleUpgradeClick = () => {
    const upgradeCost = 50 * Math.pow(state.clickLevel, 1.5);
    if (state.money >= upgradeCost) {
      setState(prev => ({
        ...prev,
        money: prev.money - upgradeCost,
        clickLevel: prev.clickLevel + 1
      }));
    }
  };

  const handleUpgrade = (businessId: string) => {
    const b = BUSINESSES.find(x => x.id === businessId);
    if (!b) return;

    const owned = state.ownedBusinesses[businessId] || { id: businessId, level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 };
    const cost = calculateCost(b.baseCost, owned.level);

    if (state.money >= cost) {
      setState(prev => {
        const currentOwned = prev.ownedBusinesses[businessId] || { id: businessId, level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 };
        return {
          ...prev,
          money: prev.money - cost,
          ownedBusinesses: {
            ...prev.ownedBusinesses,
            [businessId]: {
              ...currentOwned,
              level: currentOwned.level + 1
            }
          }
        };
      });
    }
  };

  const handleUnlockCity = (index: number) => {
    const city = CITIES[index];
    if (state.money >= city.unlockCost && index === state.currentCityIndex + 1) {
      setState(prev => ({
        ...prev,
        money: prev.money - city.unlockCost,
        currentCityIndex: index
      }));
    }
  };

  const totalMarketCap = STOCKS.reduce((acc, s) => acc + (state.stockPrices[s.symbol] * 1000000), 0);
  const bullCount = STOCKS.filter(s => {
    const history = state.stockHistory[s.symbol] || [];
    return history.length >= 2 && history[history.length - 1] > history[history.length - 2];
  }).length;
  const marketSentiment = bullCount >= STOCKS.length / 2 ? 'Bull' : 'Bear';

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

  const potentialPrestigePoints = Math.max(0, Math.floor(Math.sqrt(state.totalEarned / 1000000)) - (state.prestigePoints / 10)); // Adjusted for $1B scale

  const handlePrestige = () => {
    if (potentialPrestigePoints > 0) {
      setState(prev => ({
        ...INITIAL_STATE,
        money: 0,
        ownedBusinesses: INITIAL_STATE.ownedBusinesses,
        prestigePoints: prev.prestigePoints + potentialPrestigePoints,
        prestigeCount: prev.prestigeCount + 1,
        totalEarned: 0,
        unlockedFeatures: prev.unlockedFeatures,
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
            onClick={() => setActiveTab('businesses')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'businesses' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Briefcase className={`w-4 h-4 mr-3 ${activeTab === 'businesses' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Active Assets</span>
          </button>
          <button 
            onClick={() => state.unlockedFeatures.stocks && setActiveTab('stocks')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'stocks' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            } ${!state.unlockedFeatures.stocks && 'opacity-50 cursor-not-allowed grayscale'}`}
          >
            <Building2 className={`w-4 h-4 mr-3 ${activeTab === 'stocks' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Equities</span>
            {!state.unlockedFeatures.stocks && <span className="ml-auto text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">$25K</span>}
          </button>
          <button 
            onClick={() => state.unlockedFeatures.market && setActiveTab('market')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
              activeTab === 'market' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            } ${!state.unlockedFeatures.market && 'opacity-50 cursor-not-allowed grayscale'}`}
          >
            <MapPin className={`w-4 h-4 mr-3 ${activeTab === 'market' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">Geo Markets</span>
            {!state.unlockedFeatures.market && <span className="ml-auto text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">$10K</span>}
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
          
          <div className="my-4 h-[1px] bg-slate-100 mx-4" />

          <button 
            onClick={() => setActiveTab('properties')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === 'properties' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'} text-sm font-medium`}
          >
            <Building2 className="w-4 h-4 mr-3 text-slate-400" />
            Real Estate
          </button>

        </nav>

        <div className="p-6 border-t border-slate-100 space-y-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{user.displayName || 'Capitalist'}</p>
                  <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                    <Cloud className={`w-2 h-2 ${isCloudSyncing ? 'text-emerald-400 animate-pulse' : 'text-slate-300'}`} />
                    {isCloudSyncing ? 'SYNCING...' : 'SECURE'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 leading-tight">Guest Mode</p>
              <p className="text-[8px] font-bold text-amber-500 mb-3 uppercase tracking-tighter">Progress will NOT be saved</p>
              <button 
                onClick={handleSignIn}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <LogIn className="w-3 h-3" /> Login to Save
              </button>
            </div>
          )}
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
            text={`+$${click.value.toFixed(2)}`} 
            onComplete={() => setClicks(prev => prev.filter(c => c.id !== click.id))} 
          />
        ))}

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
          <div className="max-w-5xl mx-auto">
            {/* Hype Event Banner */}
            <AnimatePresence>
              {state.activeEvent && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  className={`${state.activeEvent.color} rounded-3xl p-6 text-white shadow-lg overflow-hidden relative group`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame className="w-32 h-32 rotate-12" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div className="flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                        <h3 className="text-2xl font-black tracking-tight">{state.activeEvent.name}</h3>
                      </div>
                      <p className="font-bold opacity-90">{state.activeEvent.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center min-w-[120px]">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Multiplier</p>
                        <p className="text-3xl font-black">x{state.activeEvent.multiplier}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center min-w-[120px]">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center justify-center gap-1">
                          <Timer className="w-3 h-3" /> Time Left
                        </p>
                        <p className="text-3xl font-black">{state.eventTimeLeft}s</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap Challenge */}
            <AnimatePresence>
              {tapChallenge && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="fixed bottom-24 right-10 z-50 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-amber-400 w-80 text-center"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest">
                    Viral Challenge!
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tap quickly!</p>
                  <h3 className="text-2xl font-black mb-4">BOOST CHALLENGE</h3>
                  <div className="text-4xl font-black text-amber-400 mb-6">
                    {tapChallenge.current} / {tapChallenge.needed}
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-6">
                    <motion.div 
                      className="bg-amber-400 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(tapChallenge.current / tapChallenge.needed) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Reward: {formatCurrency(tapChallenge.reward)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">DATE FLUX</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-xl font-black text-slate-700">{formatGameDate(state.gameDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">REPUTATION</p>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-xl font-black text-slate-700">{state.prestigePoints}</span>
                      </div>
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

                {/* Milestone Progress Tracker */}
                {MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId]) && (
                  <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active Objective</p>
                        <h3 className="text-xl font-black text-slate-900 uppercase">
                          {MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId])?.label}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">
                          {Math.floor(Math.min(100, (state.money / (MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId])?.target || 1)) * 100))}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        className="h-full bg-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(100, (state.money / (MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId])?.target || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>{formatCurrency(state.money)}</span>
                      <span>{formatCurrency(MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId])?.target || 0)}</span>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">Reward Upon Completion</p>
                        <p className="text-xs font-bold text-slate-400 italic">
                          {MILESTONES.find(m => m.featureId && !state.unlockedFeatures[m.featureId])?.rewardText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleManualClick(e)}
                    className="w-64 h-64 md:w-80 md:h-80 bg-white border-8 border-slate-900 rounded-[3rem] shadow-[0_30px_50px_-15px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer relative z-10 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Coins className="w-32 h-32 md:w-40 md:h-40 text-slate-900 relative z-10 group-hover:rotate-12 transition-transform" />
                    <div className="absolute bottom-10 text-[10px] font-black text-slate-400 tracking-[0.2em] group-hover:text-slate-900 transition-colors uppercase">
                      Click to Bootstrap
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-lg text-center">
                  {user && (
                    <div className="md:col-span-2 flex justify-center">
                      <button 
                        onClick={() => saveStateToFirestore(user.uid, state)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 hover:border-slate-400 transition-all group"
                      >
                        <Cloud className={`w-3 h-3 ${isCloudSyncing ? 'animate-pulse text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                        Sync Progress Now
                      </button>
                    </div>
                  )}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3">
                      <Zap className="w-4 h-4 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Click Value</p>
                    <p className="text-3xl font-black text-slate-900 mb-6">{formatCurrency(state.clickLevel)}</p>
                    
                    <button
                      onClick={handleUpgradeClick}
                      disabled={state.money < 50 * Math.pow(state.clickLevel, 1.5)}
                      className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        state.money >= 50 * Math.pow(state.clickLevel, 1.5)
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Maximize Output • {formatCurrency(50 * Math.pow(state.clickLevel, 1.5))}
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Click Level</p>
                    <p className="text-3xl font-black text-slate-900">{state.clickLevel}</p>
                    <div className="mt-4 flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full ${i < (state.clickLevel % 5 || 5) ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                      ))}
                    </div>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Market Cap</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">{formatCurrency(totalMarketCap)}</p>
                    <p className="text-xs font-bold text-emerald-500 mt-2">Active Circulation</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Volatility</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">High</p>
                    <p className="text-xs font-bold text-rose-500 mt-2">Risk Alert Active</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Sentiment</p>
                    <p className="tracking-tight font-black text-xl text-slate-800 leading-none">{marketSentiment}</p>
                    <p className={`text-xs font-bold mt-2 ${marketSentiment === 'Bull' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {marketSentiment === 'Bull' ? 'Expansion Phase' : 'Correction Phase'}
                    </p>
                  </div>
                </div>

                <section className="bg-slate-900 rounded-[2rem] p-8 text-white mt-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl tracking-tight uppercase">Geo-Economic Expansion</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Operational Hubs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CITIES.map((city, idx) => {
                      const isUnlocked = idx <= state.currentCityIndex;
                      const isNext = idx === state.currentCityIndex + 1;
                      const canAfford = state.money >= city.unlockCost;

                      return (
                        <div 
                          key={city.name}
                          className={`p-6 rounded-3xl border transition-all ${
                            isUnlocked 
                              ? 'bg-slate-800 border-indigo-500/30' 
                              : isNext 
                                ? 'bg-slate-900 border-slate-700' 
                                : 'bg-slate-950 border-slate-900 opacity-40'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-3xl">{city.emoji}</div>
                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                              isUnlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isUnlocked ? 'HQ Active' : 'Offline'}
                            </div>
                          </div>
                          
                          <h4 className="font-black text-lg uppercase tracking-tight mb-1">{city.name}</h4>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase mb-6">{city.multiplier}x Global Multiplier</p>
                          
                          {isUnlocked ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Zap className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase">Providing Boost</span>
                            </div>
                          ) : isNext ? (
                            <button
                              onClick={() => handleUnlockCity(idx)}
                              disabled={!canAfford}
                              className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                                canAfford 
                                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              Expand for {formatCurrency(city.unlockCost)}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Timer className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
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

            {activeTab === 'properties' && (
              <section className="space-y-8 pb-24">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Real Estate Portfolio</h3>
                    <p className="text-sm text-slate-600 font-medium">Invest in properties and collect monthly rent.</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-6"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                    <Timer className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">1 day / sec</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Available Market</h4>
                    {HOUSES.map(house => {
                      const currentPrice = house.basePrice * Math.pow(1 + house.appreciationRate, Math.floor(state.gameDate / 30));
                      const canAfford = state.money >= currentPrice;
                      
                      return (
                        <div key={house.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${house.color.replace('text-', 'bg-')}/10`}>
                              {house.icon === 'Home' && <Home className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Building' && <Building className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Castle' && <Landmark className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Trophy' && <Trophy className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Palmtree' && <Palmtree className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Waves' && <Waves className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Ship' && <Ship className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Cloud' && <Cloud className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Moon' && <Moon className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'TreePine' && <TreePine className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Orbit' && <Orbit className={`w-7 h-7 ${house.color}`} />}
                              {house.icon === 'Framer' && <Framer className={`w-7 h-7 ${house.color}`} />}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value</p>
                              <p className="text-xl font-black text-slate-900">{formatCurrency(currentPrice)}</p>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h5 className="font-black text-slate-900 text-lg uppercase tracking-tight">{house.name}</h5>
                            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Estimated Rent: {formatCurrency(house.monthlyRent)} / mo</p>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">{house.description}</p>
                          </div>

                          <button
                            onClick={() => buyProperty(house.id)}
                            disabled={!canAfford}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                              canAfford 
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-95' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
                            }`}
                          >
                            Acquire Asset
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Owned Properties ({(state.properties || []).length})</h4>
                    {(state.properties || []).length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Portfolio Empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(state.properties || []).map(prop => {
                          const house = HOUSES.find(h => h.id === prop.houseId);
                          if (!house) return null;
                          const currentVal = house.basePrice * Math.pow(1 + house.appreciationRate, Math.floor(state.gameDate / 30));
                          const profit = currentVal - prop.purchasePrice;

                          return (
                            <div key={prop.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${house.color.replace('text-', 'bg-')}/10`}>
                                  {house.icon === 'Home' && <Home className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Building' && <Building className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Castle' && <Landmark className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Trophy' && <Trophy className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Palmtree' && <Palmtree className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Waves' && <Waves className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Ship' && <Ship className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Cloud' && <Cloud className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Moon' && <Moon className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'TreePine' && <TreePine className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Orbit' && <Orbit className={`w-6 h-6 ${house.color}`} />}
                                  {house.icon === 'Framer' && <Framer className={`w-6 h-6 ${house.color}`} />}
                                </div>
                                <div>
                                  <h6 className="font-black text-slate-800 uppercase tracking-tight">{house.name}</h6>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pur. {formatGameDate(prop.purchaseDate)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-8 md:gap-12">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Equity Change</p>
                                  <p className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => sellProperty(prop.id)}
                                  className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                >
                                  Liquidate
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                      {leaderboard.length === 0 ? (
                        <div className="py-12 text-center">
                          <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4 animate-pulse" />
                          <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">Connecting to Global Network...</p>
                        </div>
                      ) : (
                        leaderboard.map((entry, idx) => {
                          const isPlayer = entry.uid === user?.uid;
                          return (
                            <div key={entry.uid} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isPlayer ? 'bg-slate-900 border-slate-900 text-white shadow-lg ring-4 ring-indigo-500/20' : 'bg-white border-slate-100 md:hover:border-slate-300'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`text-lg font-black w-8 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'}`}>#{idx + 1}</div>
                                <div className={`p-3 rounded-xl ${isPlayer ? 'bg-indigo-500' : 'bg-slate-50'}`}>
                                  {idx === 0 ? <Trophy className={`w-5 h-5 ${isPlayer ? 'text-white' : 'text-amber-500'}`} /> : 
                                   isPlayer ? <Landmark className="w-5 h-5 text-white" /> :
                                   <Globe className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                  <h4 className={`font-black text-sm uppercase tracking-tight ${isPlayer ? 'text-white' : 'text-slate-900'}`}>{entry.displayName}</h4>
                                  <p className={`text-[10px] font-bold ${isPlayer ? 'text-indigo-300' : 'text-slate-400'}`}>
                                    {isPlayer ? 'YOUR CORPORATE EMPIRE' : 'GLOBAL COMPETITOR'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-black text-lg ${isPlayer ? 'text-emerald-400' : 'text-slate-900'}`}>{formatCurrency(entry.wealth)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Net Worth</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {!leaderboard.some(e => e.uid === user?.uid) && user && (
                        <div className="mt-8 pt-8 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Your Current Standing</p>
                          <div className="flex items-center justify-between p-5 rounded-2xl border bg-slate-900 border-slate-900 text-white shadow-lg">
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-black w-8 text-slate-400">?</div>
                              <div className="p-3 rounded-xl bg-indigo-500">
                                <Landmark className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-black text-sm uppercase tracking-tight text-white">{user.displayName || 'Capitalist Zenith'}</h4>
                                <p className="text-[10px] font-bold text-indigo-300">ESTABLISHING DOMINANCE</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg text-emerald-400">{formatCurrency(state.money + STOCKS.reduce((acc, s) => acc + (state.holdings[s.symbol]?.shares || 0) * state.stockPrices[s.symbol], 0))}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Valuation</p>
                            </div>
                          </div>
                        </div>
                      )}
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
                    <h2 className="text-lg font-black text-slate-800">{CITIES[state.currentCityIndex].name}</h2>
                  </div>
                </div>
                {state.unlockedFeatures.prestige ? (
                  <button 
                    onClick={() => setPrestigeTabOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm shadow-sm"
                  >
                    <RefreshCcw className="w-4 h-4 text-emerald-400" />
                    <span>Expansion</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm">
                    <RefreshCcw className="w-4 h-4 opacity-30" />
                    <span>Locked at $1M</span>
                  </div>
                )}
              </div>
            )}

            {/* Business Grid */}
            {activeTab === 'businesses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                {BUSINESSES.map((b) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    owned={state.ownedBusinesses[b.id]}
                    canAfford={state.money >= calculateCost(b.baseCost, state.ownedBusinesses[b.id].level)}
                    prestigePoints={state.prestigePoints}
                    multiplier={state.activeEvent?.multiplier || 1}
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
          <span className="flex-1 overflow-hidden whitespace-nowrap italic text-slate-600 hidden md:block">Active Connection: {CITIES[state.currentCityIndex].name} Mainframe Linked...</span>
          <span className="text-slate-300 font-bold">Venture.OS v1.0</span>
        </footer>

        {/* Mobile Nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex lg:hidden items-center justify-around px-4 z-40 shadow-lg">
          <button 
            onClick={() => setActiveTab('hq')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'hq' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <Landmark className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">HQ</span>
          </button>
          <button 
            onClick={() => setActiveTab('businesses')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'businesses' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Empire</span>
          </button>
          <button 
            onClick={() => setActiveTab('properties')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'properties' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Estate</span>
          </button>
          <button 
            onClick={() => state.unlockedFeatures.stocks && setActiveTab('stocks')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stocks' ? 'text-slate-900' : 'text-slate-400'} ${!state.unlockedFeatures.stocks && 'opacity-20 grayscale'}`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Stocks</span>
          </button>
          <button 
            onClick={() => state.unlockedFeatures.market && setActiveTab('market')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'market' ? 'text-slate-900' : 'text-slate-400'} ${!state.unlockedFeatures.market && 'opacity-20 grayscale'}`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Geo</span>
          </button>
        </nav>

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
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">VENTURE</h1>
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
