import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', icon }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className={cn(
              'relative w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700/60 overflow-hidden',
              sizes[size],
            )}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
              <button
                ref={firstFocusRef}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Fermer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', variant = 'danger' }: ConfirmProps) {
  const colors = {
    danger: { icon: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', btn: 'bg-red-600 hover:bg-red-700 text-white' },
    warning: { icon: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30', btn: 'bg-amber-600 hover:bg-amber-700 text-white' },
    info: { icon: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon={
        <svg className={cn('h-5 w-5', variant === 'danger' ? 'text-red-600 dark:text-red-400' : variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {variant === 'danger' ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
      }
      footer={
        <>
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-800">
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={cn('h-9 px-4 rounded-lg text-sm font-medium transition-colors', colors[variant].btn)}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </Modal>
  );
}
