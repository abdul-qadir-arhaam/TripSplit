import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isDateOrTime = props.type === 'date' || props.type === 'time' || props.type === 'datetime-local';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <div className="relative rounded-xl flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl py-2.5 transition duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
              'disabled:opacity-50 disabled:bg-slate-950/30',
              isDateOrTime && '[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              error && 'border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500',
              className
            )
          )}
          onClick={(e) => {
            if (isDateOrTime) {
              try {
                e.currentTarget.showPicker?.();
              } catch {
                // Ignore if showPicker is not supported or already open
              }
            }
            props.onClick?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-slate-500 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 animate-fade-in">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
