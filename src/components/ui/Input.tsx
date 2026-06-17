import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export default function Input({ label, error, hint, icon, suffix, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
          <input
            id={inputId}
            className={cn(
              'h-9 w-full rounded-lg border text-sm transition-colors',
              'bg-white dark:bg-slate-800/60',
              'text-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
              error
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              icon ? 'pl-9' : 'px-3',
              suffix ? 'pr-16' : 'pr-3',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            // Ensure controlled inputs receive a string value to avoid React warnings and allow editing
            value={props.value ?? ''}
            {...props}
          />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'h-9 w-full rounded-lg border px-3 text-sm transition-colors appearance-none',
          'bg-white dark:bg-slate-800/60',
          'text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
          error
            ? 'border-red-300 dark:border-red-700'
            : 'border-slate-200 dark:border-slate-700',
          className,
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
