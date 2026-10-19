import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  options: SelectOption[];
  dense?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  helperText,
  error,
  isRequired,
  options,
  dense = false,
  id,
  disabled,
  style,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const hasError = Boolean(error);
  const height = dense ? '32px' : '38px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: typography.fontSize.sm.size,
            fontWeight: typography.fontWeight.semibold,
            color: colors.slate[700],
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {isRequired && <span style={{ color: colors.status.danger.solid }} aria-hidden="true">*</span>}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: disabled ? colors.slate[100] : '#ffffff',
          border: `1px solid ${hasError ? colors.status.danger.solid : colors.slate[300]}`,
          borderRadius: radius.md,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          height,
          padding: '0 10px',
        }}
      >
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: colors.slate[900],
            fontSize: typography.fontSize.base.size,
            fontFamily: typography.fontFamily.sans,
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            paddingRight: '20px',
            ...style,
          }}
          className={`vms-select ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: '10px',
            pointerEvents: 'none',
            color: colors.slate[500],
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={14} />
        </span>
      </div>

      {hasError ? (
        <span
          id={errorId}
          style={{
            fontSize: typography.fontSize.xs.size,
            color: colors.status.danger.solid,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
          }}
        >
          <AlertCircle size={12} />
          {error}
        </span>
      ) : helperText ? (
        <span
          id={helperId}
          style={{
            fontSize: typography.fontSize.xs.size,
            color: colors.slate[500],
            marginTop: '2px',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
