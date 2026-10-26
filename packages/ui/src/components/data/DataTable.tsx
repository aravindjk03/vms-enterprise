import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, AlertTriangle, Loader2 } from 'lucide-react';
import { colors, typography } from '../../tokens.js';
import { Checkbox } from '../foundation/Checkbox.js';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Let long text wrap instead of widening the table (titles, names, descriptions). */
  wrap?: boolean;
  /** Minimum width for a wrapping column so it stays readable. */
  minWidth?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (item: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  density?: 'dense' | 'normal';
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  bulkActions?: React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor = (item: any) => String(item.id || item.key || item.companyId || item.contractId || item.workOrderId || item.contractorWorkerId || item.attendanceId || Math.random()),
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching the current view criteria.',
  density = 'normal',
  sortColumn,
  sortDirection = 'asc',
  onSort,
  selectedIds = [],
  onSelectIds,
  onRowClick,
  bulkActions,
}: DataTableProps<T>) {
  const isDense = density === 'dense';
  const rowHeight = isDense ? '34px' : '44px';
  const cellPadding = isDense ? '4px 10px' : '8px 14px';
  const fontSize = isDense ? typography.fontSize.xs.size : typography.fontSize.sm.size;

  const allSelected = data.length > 0 && data.every((item) => selectedIds.includes(keyExtractor(item)));
  const someSelected = data.some((item) => selectedIds.includes(keyExtractor(item))) && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectIds) return;
    if (allSelected) {
      onSelectIds([]);
    } else {
      onSelectIds(data.map(keyExtractor));
    }
  };

  const handleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectIds) return;
    if (selectedIds.includes(id)) {
      onSelectIds(selectedIds.filter((item) => item !== id));
    } else {
      onSelectIds([...selectedIds, id]);
    }
  };

  // Render Sort Icon
  const renderSortIcon = (colKey: string) => {
    if (sortColumn !== colKey) {
      return <ArrowUpDown size={12} color={colors.slate[400]} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} color={colors.primary[600]} />
    ) : (
      <ArrowDown size={12} color={colors.primary[600]} />
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: '4px',
        overflow: 'hidden',
      }}
      className="vms-data-table-wrapper"
    >
      {/* Bulk actions banner */}
      {selectedIds.length > 0 && bulkActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: colors.primary[50],
            borderBottom: `1px solid ${colors.primary[200]}`,
            color: colors.primary[900],
            fontSize: typography.fontSize.xs.size,
            fontWeight: 600,
          }}
        >
          <span>Selected {selectedIds.length} records</span>
          <div>{bulkActions}</div>
        </div>
      )}

      {/* Table scroll container */}
      <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
          className="vms-table"
        >
          {/* Header */}
          <thead
            style={{
              backgroundColor: colors.slate[50],
              borderBottom: `1px solid ${colors.slate[200]}`,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <tr>
              {onSelectIds && (
                <th style={{ width: '40px', padding: cellPadding, textAlign: 'center' }}>
                  <Checkbox
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{
                    width: col.width,
                    padding: cellPadding,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.slate[500],
                    textAlign: col.align || 'left',
                    cursor: col.sortable && onSort ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                    }}
                  >
                    <span>{col.header}</span>
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`} style={{ height: rowHeight, borderBottom: `1px solid ${colors.slate[100]}` }}>
                  {onSelectIds && <td style={{ padding: cellPadding, textAlign: 'center' }}><div style={{ width: '16px', height: '16px', backgroundColor: colors.slate[200], borderRadius: '2px' }} /></td>}
                  {columns.map((col) => (
                    <td key={`loading-cell-${col.key}`} style={{ padding: cellPadding }}>
                      <div
                        style={{
                          height: '14px',
                          width: '75%',
                          backgroundColor: colors.slate[100],
                          borderRadius: '2px',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              // Error state
              <tr>
                <td colSpan={columns.length + (onSelectIds ? 1 : 0)} style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={28} color={colors.status.danger.solid} />
                    <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[900] }}>
                      Failed to load records
                    </strong>
                    <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[500] }}>
                      {errorMessage || 'A network or system error occurred while retrieving data.'}
                    </span>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        style={{
                          marginTop: '8px',
                          padding: '6px 14px',
                          backgroundColor: colors.primary[600],
                          color: '#ffffff',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: typography.fontSize.xs.size,
                        }}
                      >
                        Retry Loading
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length + (onSelectIds ? 1 : 0)} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Inbox size={32} color={colors.slate[400]} />
                    <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[800] }}>
                      {emptyTitle}
                    </strong>
                    <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[500], maxWidth: '400px' }}>
                      {emptyDescription}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              // Populated state
              data.map((item, idx) => {
                const rowKey = keyExtractor(item);
                const isSelected = selectedIds.includes(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    style={{
                      height: rowHeight,
                      borderBottom: `1px solid ${colors.slate[100]}`,
                      backgroundColor: isSelected
                        ? colors.primary[50]
                        : idx % 2 === 1
                        ? colors.slate[50]
                        : '#ffffff',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 80ms ease',
                    }}
                    className="vms-table-row"
                  >
                    {onSelectIds && (
                      <td
                        style={{ padding: cellPadding, textAlign: 'center' }}
                        onClick={(e) => handleRowSelect(rowKey, e)}
                      >
                        <Checkbox
                          aria-label={`Select row ${rowKey}`}
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const value = (item as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: cellPadding,
                            fontSize,
                            color: colors.slate[800],
                            textAlign: col.align || 'left',
                            whiteSpace: col.wrap ? 'normal' : 'nowrap',
                            minWidth: col.minWidth,
                            overflowWrap: col.wrap ? 'anywhere' : undefined,
                          }}
                        >
                          {col.render ? col.render(item, idx) : (value != null ? String(value) : '—')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
