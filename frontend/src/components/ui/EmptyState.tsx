import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-800/70 text-brand-400 flex items-center justify-center mb-4 shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
