// src/components/common/Card.tsx
import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  const baseStyles = glass
    ? 'bg-white/90 backdrop-blur-md border border-white/40 shadow-xs text-slate-900'
    : 'bg-white border border-slate-200 shadow-xs text-slate-900';

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300'
    : '';

  return (
    <div className={`rounded-xl p-4 sm:p-5 ${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
