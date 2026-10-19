import React, { useId } from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  withTime?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(({
  label,
  helperText,
  error,
  isRequired,
  withTime = false,
  id,
  disabled,
  style,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
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
          height: '38px',
          padding: '0 10px',
          gap: '8px',
        }}
      >
        <span style={{ color: colors.slate[400], display: 'flex', alignItems: 'center' }}>
          <CalendarIcon size={16} />
        </span>
        <input
          ref={ref}
          type={withTime ? 'datetime-local' : 'date'}
          id={inputId}
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
            ...style,
          }}
          className={`vms-datepicker ${className}`}
          {...props}
        />
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

DatePicker.displayName = 'DatePicker';
