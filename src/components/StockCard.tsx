import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Stock, StockHolding } from '../types';
import { formatCurrency } from '../utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface StockCardProps {
  stock: Stock;
  price: number;
  history: number[];
  holding: StockHolding;
  money: number;
  onBuy: (amount: number) => void;
  onSell: (amount: number) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  price,
  history,
  holding,
  money,
  onBuy,
  onSell
}) => {
  const previousPrice = history[history.length - 2] || price;
  const change = ((price - previousPrice) / previousPrice) * 100;
  const isUp = change >= 0;

  const chartData = history.map((val, i) => ({ val, i }));

  const maxAffordable = Math.floor(money / price);

  return (
    <div className="bg-(--bg-card) border border-(--border-base) rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black tracking-tight">{stock.name}</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-(--bg-base) ${stock.color}`}>
              {stock.symbol}
            </span>
          </div>
          <p className="text-2xl font-black mt-1">{formatCurrency(price)}</p>
        </div>
        <div className={`flex items-center gap-1 font-bold text-sm ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isUp ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>

      <div className="h-16 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`colorStock-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={isUp ? '#10b981' : '#f43f5e'} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#colorStock-${stock.id})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 p-3 bg-(--bg-base) rounded-xl mb-6 border border-(--border-base)">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-(--text-muted)">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Your Position</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-black">{holding.shares} Shares</p>
            <p className="text-[10px] font-bold text-(--text-muted)">Equity: {formatCurrency(holding.shares * price)}</p>
          </div>
        </div>
        
        {holding.shares > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-(--border-base)">
            <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Net Profit/Loss</div>
            <div className="text-right">
              <p className={`text-xs font-black ${price >= holding.avgBuyPrice ? 'text-emerald-500' : 'text-rose-500'}`}>
                {price >= holding.avgBuyPrice ? '+' : ''}{formatCurrency((price - holding.avgBuyPrice) * holding.shares)}
              </p>
              <p className={`text-[9px] font-bold ${price >= holding.avgBuyPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {price >= holding.avgBuyPrice ? '+' : ''}{(((price - holding.avgBuyPrice) / holding.avgBuyPrice) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onBuy(1)}
          disabled={money < price}
          className="py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all font-sans"
        >
          Buy 1
        </button>
        <button
          onClick={() => onSell(1)}
          disabled={holding.shares <= 0}
          className="py-2.5 bg-(--bg-card) border border-(--border-base) text-(--text-base) rounded-lg font-bold text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-(--bg-base) transition-all font-sans"
        >
          Sell 1
        </button>
        <button
          onClick={() => onBuy(maxAffordable)}
          disabled={maxAffordable <= 0}
          className="py-2 bg-emerald-500/10 text-emerald-600 rounded-lg font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all font-sans"
        >
          Buy Max ({maxAffordable})
        </button>
        <button
          onClick={() => onSell(holding.shares)}
          disabled={holding.shares <= 0}
          className="py-2 bg-rose-500/10 text-rose-600 rounded-lg font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all font-sans"
        >
          Sell All
        </button>
      </div>
    </div>
  );
};
