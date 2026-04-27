import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Business, OwnedBusiness } from '../types';
import { formatCurrency, calculateCost, calculateIncome } from '../utils';

interface BusinessCardProps {
  business: Business;
  owned: OwnedBusiness;
  canAfford: boolean;
  prestigePoints: number;
  multiplier?: number;
  onUpgrade: () => void;
  onManualCollect: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  owned: ownedIn,
  canAfford,
  prestigePoints,
  multiplier = 1,
  onUpgrade,
  onManualCollect,
}) => {
  const owned = ownedIn || { id: business.id, level: 0, lastCollected: Date.now(), isAutomated: true, speedMultiplier: 1, profitMultiplier: 1 };
  const IconComponent = (Icons as any)[business.icon] || Icons.Circle;
  const cost = calculateCost(business.baseCost, owned.level);
  let income = calculateIncome(business.baseIncome, owned.level, owned.profitMultiplier, prestigePoints);
  income *= multiplier;
  
  const isLocked = owned.level === 0;

  return (
    <motion.div 
      layout
      className={`bg-white border p-6 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between ${
        isLocked ? 'border-dashed border-slate-300 opacity-60 grayscale' : 'border-slate-200 hover:border-slate-400'
      }`}
      onClick={owned.level > 0 && !owned.isAutomated ? onManualCollect : undefined}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 leading-tight">{business.name}</h3>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level {owned.level}</p>
                {owned.profitMultiplier > 1 && (
                  <div className="flex items-center text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-1 rounded">
                    <Icons.TrendingUp className="w-2 h-2 mr-0.5" />
                    {owned.profitMultiplier}x
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${isLocked ? 'text-slate-400' : 'text-emerald-600'}`}>
              +{formatCurrency(income)}/sec
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Yield</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: owned.level > 0 ? "100%" : "0%" }}
              className={`h-full ${isLocked ? 'bg-slate-300' : 'bg-slate-900'}`}
            />
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpgrade();
        }}
        disabled={!canAfford}
        className={`w-full py-3 rounded-lg text-sm font-bold transition-all border ${
          canAfford 
            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900' 
            : 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed'
        }`}
      >
        {isLocked ? `Unlock for ${formatCurrency(cost)}` : `Upgrade for ${formatCurrency(cost)}`}
      </button>
    </motion.div>
  );
};
