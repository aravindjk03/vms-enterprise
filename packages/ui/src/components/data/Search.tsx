import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface SearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  onClear?: () => void;
  width?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

export const Search: React.FC<SearchProps> = ({
  value = '',
  onChange,
  placeholder = 'Search by name, ID, vehicle plate, challan...',
  debounceMs = 0,
  isLoading = false,
  onClear,
  width = '100%',
  autoFocus = false,
  style,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) return;
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (debounceMs <= 0) {
      onChange(val);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width,
        ...style,
      }}
      className="vms-search-input"
    >
      <div
        style={{
          position: 'absolute',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          color: colors.slate[400],
        }}
      >
        {isLoading ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <SearchIcon size={14} />
        )}
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          height: '34px',
          padding: '0 32px',
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.slate[300]}`,
          borderRadius: radius.md,
          fontSize: typography.fontSize.xs.size,
          color: colors.slate[900],
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: typography.fontFamily.sans,
        }}
      />

      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '8px',
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            color: colors.slate[400],
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
