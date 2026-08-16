import type { HTMLAttributes } from 'react';

export function Plate({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-paper-100 border border-paper-400 shadow-plate rounded-lg ${className}`} {...props} />;
}

export function PlateCaption({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`plate-caption text-xs sm:text-sm ${className}`} {...props} />;
}
