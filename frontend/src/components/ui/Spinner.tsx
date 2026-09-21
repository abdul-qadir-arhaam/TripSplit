import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={clsx('animate-spin text-brand-500', sizeClasses[size], className)} />
    </div>
  );
};
