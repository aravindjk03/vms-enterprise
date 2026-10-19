import React from 'react';
import { Search, Filter, X, SlidersHorizontal, Download, LayoutList, Columns } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  statusOptions?: { label: string; value: string }[];
  dateFilter?: string;
  onDateFilterChange?: (val: string) => void;
  density?: 'dense' | 'normal';
  onDensityToggle?: () => void;
  onExport?: () => void;
  onToggleColumns?: () => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  savedViews?: string[];
  selectedView?: string;
  onViewChange?: (view: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = [],
  dateFilter,
  onDateFilterChange,
  density = 'normal',
  onDensityToggle,
  onExport,
  onToggleColumns,
  activeFilterCount = 0,
  onClearFilters,
  savedViews,
  selectedView,
  onViewChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        borderBottom: `1px solid ${colors.slate[200]}`,
        gap: '12px',
        flexWrap: 'wrap',
      }}
      className="vms-filter-bar"
    >
      {/* Left side: Search & primary filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: colors.slate[50],
            border: `1px solid ${colors.slate[300]}`,
            borderRadius: radius.md,
            padding: '0 8px',
            height: '32px',
            width: '100%',
            maxWidth: '320px',
            gap: '6px',
          }}
        >
          <Search size={14} color={colors.slate[400]} />
          <input
            type="text"
            placeholder="Search records, IDs, tags..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: typography.fontSize.xs.size,
              color: colors.slate[900],
            }}
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              style={{
                border: 'none',
                background: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: colors.slate[400],
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Dropdown Filter */}
        {statusOptions.length > 0 && onStatusFilterChange && (
          <select
            aria-label="Filter by status"
            value={statusFilter || ''}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              borderRadius: radius.md,
              border: `1px solid ${colors.slate[300]}`,
              backgroundColor: statusFilter ? colors.primary[50] : '#ffffff',
              color: statusFilter ? colors.primary[700] : colors.slate[700],
              fontSize: typography.fontSize.xs.size,
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Saved Views selector */}
        {savedViews && savedViews.length > 0 && onViewChange && (
          <select
            aria-label="Select saved view preset"
            value={selectedView || ''}
            onChange={(e) => onViewChange(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              borderRadius: radius.md,
              border: `1px solid ${colors.slate[300]}`,
              backgroundColor: '#ffffff',
              color: colors.slate[700],
              fontSize: typography.fontSize.xs.size,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {savedViews.map((view) => (
              <option key={view} value={view}>
                View: {view}
              </option>
            ))}
          </select>
        )}

        {/* Active filters clear button */}
        {activeFilterCount > 0 && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              color: colors.status.danger.solid,
              backgroundColor: colors.status.danger.bg,
              border: `1px solid ${colors.status.danger.border}`,
              borderRadius: radius.sm,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <X size={12} />
            <span>Clear Filters ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Right side: Density toggle, column manager, export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onDensityToggle && (
          <Button
            variant="outline"
            size="dense"
            onClick={onDensityToggle}
            leftIcon={<LayoutList size={13} />}
            title="Toggle compact/comfortable row density"
          >
            {density === 'dense' ? 'Dense' : 'Normal'}
          </Button>
        )}

        {onToggleColumns && (
          <Button
            variant="outline"
            size="dense"
            onClick={onToggleColumns}
            leftIcon={<Columns size={13} />}
          >
            Columns
          </Button>
        )}

        {onExport && (
          <Button
            variant="secondary"
            size="dense"
            onClick={onExport}
            leftIcon={<Download size={13} />}
          >
            Export CSV
          </Button>
        )}
      </div>
    </div>
  );
};
