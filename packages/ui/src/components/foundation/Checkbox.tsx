import React, { useId } from 'react';
import { Check } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  helperText,
  id,
  checked,
  disabled,
  onChange,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{
            appearance: 'none',
            width: '16px',
            height: '16px',
            borderRadius: radius.sm,
            border: `1.5px solid ${checked ? colors.primary[600] : colors.slate[400]}`,
            backgroundColor: checked ? colors.primary[600] : '#ffffff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            margin: 0,
            outline: 'none',
            transition: 'all 120ms ease',
          }}
          className={`vms-checkbox ${className}`}
          {...props}
        />
        {checked && (
          <Check
            size={12}
            color="#ffffff"
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {(label || helperText) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <label
              htmlFor={checkboxId}
              style={{
                fontSize: typography.fontSize.sm.size,
                fontWeight: typography.fontWeight.medium,
                color: colors.slate[800],
                cursor: disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
            >
              {label}
            </label>
          )}
          {helperText && (
            <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
              {helperText}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
