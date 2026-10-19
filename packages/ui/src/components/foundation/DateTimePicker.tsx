import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface DateTimePickerProps {
  label?: string;
  value?: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  disabled?: boolean;
  isRequired?: boolean;
  minDate?: string;
  maxDate?: string;
  error?: string;
  helperText?: string;
  showPresets?: boolean;
  style?: React.CSSProperties;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value = '',
  onChange,
  disabled = false,
  isRequired = false,
  minDate,
  maxDate,
  error,
  helperText,
  showPresets = true,
  style,
}) => {
  // Parse date and time portions
  const [datePart, timePart] = value.includes('T') ? value.split('T') : [value, '09:00'];

  const handleDateChange = (newDate: string) => {
    onChange(`${newDate}T${timePart || '09:00'}`);
  };

  const handleTimeChange = (newTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    onChange(`${datePart || today}T${newTime}`);
  };

  const setPreset = (hoursOffset: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hoursOffset);
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    onChange(`${dateStr}T${timeStr}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...style }} className="vms-datetime-picker">
      {label && (
        <label style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>
          {label} {isRequired && <span style={{ color: colors.status.danger.solid }}>*</span>}
        </label>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Date Input */}
        <div style={{ position: 'relative', flex: 2 }}>
          <input
            type="date"
            value={datePart || ''}
            min={minDate}
            max={maxDate}
            disabled={disabled}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 8px',
              backgroundColor: disabled ? colors.slate[100] : '#ffffff',
              border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm.size,
              color: colors.slate[900],
              fontFamily: typography.fontFamily.sans,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Time Input */}
        <div style={{ position: 'relative', flex: 1.2 }}>
          <input
            type="time"
            value={timePart || ''}
            disabled={disabled}
            onChange={(e) => handleTimeChange(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 8px',
              backgroundColor: disabled ? colors.slate[100] : '#ffffff',
              border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm.size,
              color: colors.slate[900],
              fontFamily: typography.fontFamily.sans,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {showPresets && !disabled && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => setPreset(0)}
            style={{
              padding: '2px 6px',
              backgroundColor: colors.slate[100],
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.sm,
              fontSize: '10px',
              color: colors.slate[600],
              cursor: 'pointer',
            }}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setPreset(4)}
            style={{
              padding: '2px 6px',
              backgroundColor: colors.slate[100],
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.sm,
              fontSize: '10px',
              color: colors.slate[600],
              cursor: 'pointer',
            }}
          >
            +4h (Shift End)
          </button>
          <button
            type="button"
            onClick={() => {
              const tmrw = new Date();
              tmrw.setDate(tmrw.getDate() + 1);
              const dateStr = tmrw.toISOString().split('T')[0];
              onChange(`${dateStr}T09:00`);
            }}
            style={{
              padding: '2px 6px',
              backgroundColor: colors.slate[100],
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.sm,
              fontSize: '10px',
              color: colors.slate[600],
              cursor: 'pointer',
            }}
          >
            Tomorrow 09:00
          </button>
        </div>
      )}

      {error && <span style={{ fontSize: '11px', color: colors.status.danger.solid }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '11px', color: colors.slate[500] }}>{helperText}</span>}
    </div>
  );
};
