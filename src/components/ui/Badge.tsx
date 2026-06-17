import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const variants: Record<Variant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
  info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800',
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export default function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
      variants[variant],
      className,
    )}>
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-emerald-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500': variant === 'danger',
          'bg-blue-500': variant === 'info',
          'bg-slate-400': variant === 'neutral',
          'bg-violet-500': variant === 'purple',
        })} />
      )}
      {children}
    </span>
  );
}
