import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface PaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(totalRecords, currentPage * pageSize);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#ffffff',
        borderTop: `1px solid ${colors.slate[200]}`,
        fontSize: typography.fontSize.xs.size,
        color: colors.slate[600],
        gap: '16px',
        flexWrap: 'wrap',
      }}
      className="vms-pagination"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Showing <strong style={{ color: colors.slate[900] }}>{startRecord}</strong> to{' '}
          <strong style={{ color: colors.slate[900] }}>{endRecord}</strong> of{' '}
          <strong style={{ color: colors.slate[900] }}>{totalRecords}</strong> records
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
            <span>Rows:</span>
            <select
              aria-label="Select rows per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                fontSize: typography.fontSize.xs.size,
                padding: '2px 6px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.slate[300]}`,
                color: colors.slate[800],
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          aria-label="First page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          style={{
            padding: '4px 6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.slate[200]}`,
            backgroundColor: '#ffffff',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '4px 6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.slate[200]}`,
            backgroundColor: '#ffffff',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ padding: '0 8px', fontWeight: 600, color: colors.slate[900] }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '4px 6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.slate[200]}`,
            backgroundColor: '#ffffff',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          aria-label="Last page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          style={{
            padding: '4px 6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.slate[200]}`,
            backgroundColor: '#ffffff',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};
