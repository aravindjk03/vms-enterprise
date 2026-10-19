import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface ComboboxOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  style?: React.CSSProperties;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  isRequired = false,
  error,
  helperText,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredOptions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option && !option.disabled) {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...style }} ref={containerRef}>
      {label && (
        <label style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>
          {label} {isRequired && <span style={{ color: colors.status.danger.solid }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          style={{
            width: '100%',
            height: '36px',
            padding: '0 10px',
            backgroundColor: disabled ? colors.slate[100] : '#ffffff',
            border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
            borderRadius: radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: typography.fontSize.sm.size,
            color: selectedOption ? colors.slate[900] : colors.slate[400],
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={14} color={colors.slate[500]} />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#ffffff',
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.md,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '6px', borderBottom: `1px solid ${colors.slate[100]}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={14} color={colors.slate[400]} />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: typography.fontSize.xs.size,
                  color: colors.slate[900],
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <X size={12} color={colors.slate[400]} />
                </button>
              )}
            </div>

            <div role="listbox" style={{ overflowY: 'auto', padding: '4px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (!opt.disabled) {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearchTerm('');
                        }
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: radius.sm,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isHighlighted ? colors.primary[50] : 'transparent',
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        opacity: opt.disabled ? 0.5 : 1,
                      }}
                    >
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
                      {isSelected && <Check size={14} color={colors.primary[600]} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span style={{ fontSize: '11px', color: colors.status.danger.solid }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '11px', color: colors.slate[500] }}>{helperText}</span>}
    </div>
  );
};
