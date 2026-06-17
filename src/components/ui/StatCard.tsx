import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'violet';
  className?: string;
  index?: number;
}

const colorMap = {
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    trend_pos: 'text-emerald-600 dark:text-emerald-400',
    trend_neg: 'text-red-600 dark:text-red-400',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    trend_pos: 'text-emerald-600 dark:text-emerald-400',
    trend_neg: 'text-red-600 dark:text-red-400',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    trend_pos: 'text-emerald-600 dark:text-emerald-400',
    trend_neg: 'text-red-600 dark:text-red-400',
  },
  red: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    trend_pos: 'text-emerald-600 dark:text-emerald-400',
    trend_neg: 'text-red-600 dark:text-red-400',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    trend_pos: 'text-emerald-600 dark:text-emerald-400',
    trend_neg: 'text-red-600 dark:text-red-400',
  },
};

export default function StatCard({ title, value, sub, trend, icon, color = 'indigo', className, index = 0 }: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = trend && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        'dark:border-slate-700/60 dark:bg-slate-800/60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white leading-none truncate">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>}
          {trend && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', isPositive ? colors.trend_pos : colors.trend_neg)}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {isPositive
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10M17 17H7M17 17V7" />
                }
              </svg>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colors.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
