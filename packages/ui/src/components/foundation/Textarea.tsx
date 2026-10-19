import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  isRequired,
  id,
  disabled,
  rows = 3,
  style,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;

  const hasError = Boolean(error);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
        style={{
          width: '100%',
          backgroundColor: disabled ? colors.slate[100] : '#ffffff',
          border: `1px solid ${hasError ? colors.status.danger.solid : colors.slate[300]}`,
          borderRadius: radius.md,
          padding: '8px 10px',
          fontSize: typography.fontSize.base.size,
          fontFamily: typography.fontFamily.sans,
          color: colors.slate[900],
          outline: 'none',
          resize: 'vertical',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          ...style,
        }}
        className={`vms-textarea ${className}`}
        {...props}
      />

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

Textarea.displayName = 'Textarea';
