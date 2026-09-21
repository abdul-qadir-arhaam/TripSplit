import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'bordered';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  hoverEffect = false,
  ...props
}) => {
  const variants = {
    glass: 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-glass',
    solid: 'bg-slate-900 border border-slate-800',
    bordered: 'bg-transparent border border-slate-800',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl p-6 text-slate-100',
          variants[variant],
          hoverEffect && 'transition duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-glow-brand',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
