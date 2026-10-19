import React from 'react';
import { colors, radius, typography } from '../../tokens.js';

export interface RadioOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  style?: React.CSSProperties;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  orientation = 'vertical',
  disabled = false,
  isRequired = false,
  error,
  helperText,
  style,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }} role="radiogroup" aria-labelledby={`${name}-label`}>
      {label && (
        <span id={`${name}-label`} style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>
          {label} {isRequired && <span style={{ color: colors.status.danger.solid }}>*</span>}
        </span>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: orientation === 'horizontal' ? '16px' : '8px',
          flexWrap: 'wrap',
        }}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const isDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onChange(opt.value)}
                style={{
                  margin: '3px 0 0 0',
                  accentColor: colors.primary[600],
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900], fontWeight: isSelected ? 600 : 400 }}>
                  {opt.label}
                </span>
                {opt.description && (
                  <span style={{ fontSize: '11px', color: colors.slate[500] }}>
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && <span style={{ fontSize: '11px', color: colors.status.danger.solid }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '11px', color: colors.slate[500] }}>{helperText}</span>}
    </div>
  );
};
