import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Eye, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Compass, 
  FileText, 
  Lock,
  Leaf
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { 
  DataTable, 
  FilterBar, 
  Pagination, 
  Drawer, 
  StatusBadge, 
  Button, 
  showToast,
  type ColumnDef
} from '@vms/ui';

/** Downloads the rows currently shown (after search and filters) as a CSV file. */
function downloadCsv(title: string, columns: ColumnDef<Record<string, any>>[], rows: Record<string, any>[]): void {
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map(c => cell(c.header));
  const lines = rows.map(r => columns.map(c => cell(r[c.key as string])).join(','));
  const blob = new Blob([[header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface GenericDomainListViewProps {
  domainTitle: string;
  domainDescription: string;
  data: Record<string, any>[];
  columns: ColumnDef<Record<string, any>>[];
  onNewRecord?: () => void;
  onOpenDetail?: (item: Record<string, any>) => void;
  requiredCapability?: string;
}

export const GenericDomainListView: React.FC<GenericDomainListViewProps> = ({
  domainTitle,
  domainDescription,
  data,
  columns,
  onNewRecord,
  onOpenDetail,
  requiredCapability = 'DOMAIN_READ',
}) => {
  // State management
  const [density, setDensity] = useState<'dense' | 'normal'>('dense');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeItem, setActiveItem] = useState<Record<string, any> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter data
  const filteredData = data.filter((row) => {
    const matchesSearch = !search || Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
    const matchesStatus = !statusFilter || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Status options derived from data
  const uniqueStatuses = Array.from(new Set(data.map((d) => d.status))).filter(Boolean);
  const statusOptions = uniqueStatuses.map((s) => ({ label: String(s), value: String(s) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Header with Title and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>
            {domainTitle}
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
            {domainDescription}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onNewRecord && (
            <Button
              variant="primary"
              size="dense"
              leftIcon={<Plus size={14} />}
              onClick={onNewRecord}
            >
              New Transaction
            </Button>
          )}
        </div>
      </div>

      {/* 2. Table + FilterBar + Side Drawer */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={statusOptions}
            density={density}
            onDensityToggle={() => setDensity(density === 'dense' ? 'normal' : 'dense')}
            onExport={() => {
              downloadCsv(domainTitle, columns, filteredData);
              showToast(`Exported ${filteredData.length} record(s) to CSV.`);
            }}
            activeFilterCount={search || statusFilter ? 1 : 0}
            onClearFilters={() => {
              setSearch('');
              setStatusFilter('');
            }}
          />

          <DataTable
            data={paginatedData}
            columns={columns}
            keyExtractor={(item) => item.id || String(Math.random())}
            density={density}
            onRowClick={(item) => setActiveItem(item)}
          />

          <Pagination
            currentPage={currentPage}
            totalRecords={filteredData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
      </div>

      {/* 3. SIDE DRAWER QUICK INSPECT (Section 23) */}
      <Drawer
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        title={activeItem?.name || activeItem?.id || 'Record Details'}
        subtitle={`Transaction Ref: ${activeItem?.id || '—'}`}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>
              Source: {domainTitle} Engine
            </span>
            {onOpenDetail && (
            <Button
              variant="primary"
              size="dense"
              rightIcon={<ExternalLink size={13} />}
              onClick={() => {
                if (onOpenDetail && activeItem) {
                  onOpenDetail(activeItem);
                  setActiveItem(null);
                }
              }}
            >
              Open Full Profile
            </Button>
            )}
          </div>
        }
      >
        {activeItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status & Identity Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm, border: `1px solid ${colors.slate[200]}` }}>
              <div>
                <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[900] }}>
                  {activeItem.name || activeItem.company || activeItem.id}
                </strong>
                {activeItem.company && (
                  <div style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                    {activeItem.company}
                  </div>
                )}
              </div>
              {activeItem.status && <StatusBadge status={activeItem.status} size="sm" />}
            </div>

            {/* Key Field Inspection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: typography.fontSize.xs.size }}>
              {activeItem.purpose && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Purpose:</span>
                  <div style={{ fontWeight: 600, color: colors.slate[900] }}>{activeItem.purpose}</div>
                </div>
              )}
              {activeItem.host && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Host Employee:</span>
                  <div style={{ fontWeight: 600, color: colors.slate[900] }}>{activeItem.host}</div>
                </div>
              )}
              {activeItem.gate && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Assigned Gate:</span>
                  <div style={{ fontWeight: 600, color: colors.slate[900] }}>{activeItem.gate}</div>
                </div>
              )}
              {activeItem.time && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Scheduled Window:</span>
                  <div style={{ fontWeight: 600, color: colors.slate[900] }}>{activeItem.time}</div>
                </div>
              )}
              {activeItem.plate && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Vehicle Registration:</span>
                  <div style={{ fontWeight: 700, fontFamily: typography.fontFamily.mono, color: colors.slate[900] }}>{activeItem.plate}</div>
                </div>
              )}
              {activeItem.transporter && (
                <div>
                  <span style={{ color: colors.slate[500] }}>Transporter:</span>
                  <div style={{ fontWeight: 600, color: colors.slate[900] }}>{activeItem.transporter}</div>
                </div>
              )}
            </div>

            {/* Activity & Sustainability Traceability Link */}
            {activeItem.transportMode && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '10px 12px',
                  backgroundColor: colors.esg[50],
                  border: `1px solid ${colors.esg[500]}`,
                  borderRadius: radius.sm,
                  fontSize: typography.fontSize.xs.size,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.esg[700], fontWeight: 700 }}>
                    <Compass size={14} />
                    <span>Mobility Activity Linked</span>
                  </div>
                  <span style={{ fontSize: '10px', backgroundColor: '#ffffff', color: colors.esg[700], padding: '1px 5px', borderRadius: radius.sm, fontWeight: 700 }}>
                    CAPTURED
                  </span>
                </div>
                <div style={{ color: colors.slate[700] }}>
                  Mode: <strong>{activeItem.transportMode}</strong> ({activeItem.distanceKm} km)
                </div>
                <div style={{ fontSize: '10px', color: colors.slate[500] }}>
                  Provenance: <em>{activeItem.provenance || 'SYSTEM_ESTIMATED'}</em>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
