// src/components/common/Skeleton.tsx
import React from 'react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'card' | 'table-row' | 'circular';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  className = '',
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-xl',
    'table-row': 'h-10 w-full rounded-lg',
    circular: 'h-10 w-10 rounded-full',
  };

  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-slate-200 ${variantStyles[variant]} ${className}`}
    />
  );
};
