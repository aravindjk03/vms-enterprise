import React from 'react';
import { colors, radius, typography } from '../../tokens.js';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  color = colors.primary[600],
  height = 8,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 500, color: colors.slate[700] }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[600] }}>
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: colors.slate[200],
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: radius.full,
            transition: 'width 250ms ease-in-out',
          }}
        />
      </div>
    </div>
  );
};
