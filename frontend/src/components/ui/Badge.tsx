import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    brand: 'bg-brand-950/80 text-brand-300 border border-brand-800/80',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-800/80',
    danger: 'bg-rose-950/80 text-rose-300 border border-rose-800/80',
  };

  const sizes = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 rounded-md',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-lg',
  };

  return (
    <span
      className={twMerge(clsx('inline-flex items-center gap-1 font-medium', variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </span>
  );
};
