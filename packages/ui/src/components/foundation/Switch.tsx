import React, { useId } from 'react';
import { colors, radius, typography } from '../../tokens.js';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <label
              htmlFor={switchId}
              style={{
                fontSize: typography.fontSize.sm.size,
                fontWeight: typography.fontWeight.medium,
                color: colors.slate[800],
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
              {description}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: radius.full,
          backgroundColor: checked ? colors.primary[600] : colors.slate[300],
          border: 'none',
          padding: '2px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          transition: 'background-color 150ms ease',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: '16px',
            height: '16px',
            borderRadius: radius.full,
            backgroundColor: '#ffffff',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform 150ms ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
};
