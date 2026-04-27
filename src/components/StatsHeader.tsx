import React from 'react';
import { Award } from 'lucide-react';
import { formatCurrency } from '../utils';
import { motion } from 'motion/react';

interface StatsHeaderProps {
  money: number;
  incomePerSec: number;
  prestigePoints: number;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ money, incomePerSec, prestigePoints }) => {
  return (
    <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
      <div className="flex space-x-6 md:space-x-12">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Net Worth</p>
          <motion.p 
            key={money}
            initial={{ y: 2 }}
            animate={{ y: 0 }}
            className="text-xl md:text-3xl font-black text-slate-900 leading-none"
          >
            {formatCurrency(money)}
          </motion.p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Income Flux</p>
          <p className="text-lg md:text-2xl font-bold text-emerald-500 flex items-baseline gap-1">
            <span className="text-emerald-500">+{formatCurrency(incomePerSec)}</span>
            <span className="text-xs font-normal text-slate-400">/sec</span>
          </p>
        </div>
      </div>
      
      {prestigePoints > 0 && (
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Bonus Multiplier</p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <Award className="w-3 h-3 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">+{prestigePoints}%</span>
          </div>
        </div>
      )}
    </header>
  );
};
