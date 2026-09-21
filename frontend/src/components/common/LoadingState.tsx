import React from 'react';
import { Spinner } from '../ui/Spinner';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
};
