import React from 'react';
import { Award, Calendar } from 'lucide-react';
import { formatCurrency, formatGameDate } from '../utils';
import { motion } from 'motion/react';

interface StatsHeaderProps {
  displayName: string;
  money: number;
  incomePerSec: number;
  prestigePoints: number;
  gameDate: number;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ displayName, money, incomePerSec, prestigePoints, gameDate }) => {
  return (
    <header className="h-24 bg-(--bg-card) border-b border-(--border-base) flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
      <div className="flex items-center gap-6 md:gap-12">
        <div className="hidden xl:flex flex-col border-r border-(--border-base) pr-12">
          <p className="text-[10px] uppercase font-bold text-(--text-muted) tracking-widest mb-1">Acting CEO</p>
          <p className="text-sm font-black uppercase tracking-tight">{displayName || 'Unnamed'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-(--text-muted) tracking-widest mb-1">Net Worth</p>
          <p className="text-xl md:text-3xl font-black leading-none">
            {formatCurrency(money)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-(--text-muted) tracking-widest mb-1">Income Flux</p>
          <p className="text-lg md:text-2xl font-bold text-emerald-500 flex items-baseline gap-1">
            <span className="text-emerald-500">+{formatCurrency(incomePerSec)}</span>
            <span className="text-xs font-normal text-(--text-muted)">/sec</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="hidden lg:flex flex-col items-end border-r border-(--border-base) pr-8">
          <p className="text-[10px] uppercase font-bold text-(--text-muted) tracking-widest mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Game Clock
          </p>
          <p className="text-sm font-black text-(--text-base) opacity-80 tracking-tight">
            {formatGameDate(gameDate)}
          </p>
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
      </div>
    </header>
  );
};
