import React, { useState } from 'react';
import { 
  Calendar, 
  RefreshCw, 
  Download, 
  Filter, 
  Building2, 
  Shield, 
  Maximize2, 
  MoreHorizontal,
  Bookmark
} from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
import { Select } from '../foundation/Select.js';

export type DashboardWidgetType = 
  | 'KPI' 
  | 'CHART' 
  | 'TABLE' 
  | 'TIMELINE' 
  | 'ALERT' 
  | 'MAP' 
  | 'OCCUPANCY' 
  | 'ACTIVITY' 
  | 'APPROVAL' 
  | 'COMPLIANCE' 
  | 'TREND' 
  | 'STATUS' 
  | 'HEATMAP';

export interface DashboardFilterBarProps {
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  selectedDomain?: string;
  onDomainChange?: (domain: string) => void;
  selectedGate?: string;
  onGateChange?: (gate: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isRefreshing?: boolean;
  style?: React.CSSProperties;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  dateRange = 'TODAY',
  onDateRangeChange,
  selectedDomain = 'ALL',
  onDomainChange,
  selectedGate = 'ALL',
  onGateChange,
  onRefresh,
  onExport,
  isRefreshing = false,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        flexWrap: 'wrap',
        gap: '10px',
        ...style,
      }}
      className="vms-dashboard-filter-bar"
    >
      {/* Left: Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: colors.slate[500], fontWeight: 600 }}>
          <Filter size={13} />
          <span>FILTERS:</span>
        </div>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
          aria-label="Filter by Date Range"
          style={{
            height: '32px',
            padding: '0 8px',
            fontSize: typography.fontSize.xs.size,
            border: `1px solid ${colors.slate[300]}`,
            borderRadius: radius.sm,
            backgroundColor: '#ffffff',
            color: colors.slate[800],
            cursor: 'pointer',
          }}
        >
          <option value="TODAY">Today (Current Shift)</option>
          <option value="YESTERDAY">Yesterday</option>
          <option value="LAST_7_DAYS">Last 7 Days</option>
          <option value="MONTH_TO_DATE">Month to Date (MTD)</option>
          <option value="QUARTER">This Quarter (Q3 2026)</option>
        </select>

        {/* Domain Filter */}
        <select
          value={selectedDomain}
          onChange={(e) => onDomainChange && onDomainChange(e.target.value)}
          aria-label="Filter by Operational Domain"
          style={{
            height: '32px',
            padding: '0 8px',
            fontSize: typography.fontSize.xs.size,
            border: `1px solid ${colors.slate[300]}`,
            borderRadius: radius.sm,
            backgroundColor: '#ffffff',
            color: colors.slate[800],
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Domains (Roll-up)</option>
          <option value="VISITORS">Visitors & Guests</option>
          <option value="CONTRACTORS">Contractor Work Orders</option>
          <option value="MATERIALS">Material Logistics</option>
          <option value="VEHICLES">Commercial Fleet</option>
          <option value="ESG">ESG Mobility & Carbon</option>
        </select>

        {/* Gate Filter */}
        <select
          value={selectedGate}
          onChange={(e) => onGateChange && onGateChange(e.target.value)}
          aria-label="Filter by Gate Location"
          style={{
            height: '32px',
            padding: '0 8px',
            fontSize: typography.fontSize.xs.size,
            border: `1px solid ${colors.slate[300]}`,
            borderRadius: radius.sm,
            backgroundColor: '#ffffff',
            color: colors.slate[800],
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Plant Gates</option>
          <option value="GATE_1">Gate 1 (North Main Passenger)</option>
          <option value="GATE_2">Gate 2 (Commercial Freight & Weighbridge)</option>
          <option value="GATE_3">Gate 3 (Contractor & Turnstiles)</option>
        </select>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onRefresh && (
          <Button
            variant="outline"
            size="dense"
            leftIcon={<RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />}
            onClick={onRefresh}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}

        {onExport && (
          <Button
            variant="secondary"
            size="dense"
            leftIcon={<Download size={12} />}
            onClick={onExport}
          >
            Export BI
          </Button>
        )}
      </div>
    </div>
  );
};

export interface DashboardWidgetProps {
  title: string;
  type: DashboardWidgetType;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
  spanCols?: number; // e.g. 1, 2, 3
  style?: React.CSSProperties;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  type,
  subtitle,
  badge,
  headerAction,
  children,
  spanCols = 1,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        gridColumn: `span ${spanCols}`,
        ...style,
      }}
      className={`vms-dashboard-widget vms-widget-${type.toLowerCase()}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${colors.slate[100]}`,
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '1px 5px',
              borderRadius: '2px',
              backgroundColor: colors.slate[100],
              color: colors.slate[600],
            }}
          >
            {type}
          </span>
          <div>
            <h4 style={{ margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
              {title}
            </h4>
            {subtitle && (
              <span style={{ fontSize: '11px', color: colors.slate[500] }}>
                {subtitle}
              </span>
            )}
          </div>
          {badge}
        </div>

        {headerAction && <div>{headerAction}</div>}
      </div>

      <div style={{ padding: '14px', flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export const DashboardGrid: React.FC<{
  columns?: number;
  gap?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ columns = 3, gap = '16px', children, style }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
        gap,
        width: '100%',
        ...style,
      }}
      className="vms-dashboard-grid"
    >
      {children}
    </div>
  );
};
