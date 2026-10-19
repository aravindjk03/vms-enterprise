import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  ShieldCheck, 
  Compass, 
  KeyRound, 
  FileCheck, 
  History, 
  ExternalLink,
  Printer,
  Ban,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
import { StatusBadge } from '../status/StatusBadge.js';
import { Card } from '../layout/Card.js';
import { Tabs, type TabItem } from '../layout/Tabs.js';
import { Timeline, type TimelineEventItem } from './Timeline.js';

export interface EntityActivityTrace {
  activityId: string;
  sourceTransactionId: string;
  activityType: string;
  status: 'CAPTURED' | 'PENDING' | 'CALCULATED';
  mode: string;
  distanceKm: number;
  occupancy?: number;
  provenance: string;
  scopeCategory?: string;
  calculatedEmissions?: string; // e.g. "48.2 kg CO₂e"
}

export interface EntityDetailPageProps {
  entityId: string;
  title: string;
  subtitle?: string;
  status: string;
  entityType: 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL' | 'GATE_PASS';
  onBack: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  overviewFields: { label: string; value: React.ReactNode }[];
  timelineEvents?: TimelineEventItem[];
  activityTrace?: EntityActivityTrace;
  documents?: { name: string; status: string; expiry?: string; type: string }[];
  accessPermissions?: { zone: string; status: string; gate: string; validUntil: string }[];
  auditInfo?: {
    createdBy: string;
    createdAt: string;
    lastUpdatedBy: string;
    lastUpdatedAt: string;
    sourceTransaction: string;
    policyDecision: string;
  };
}

export const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityId,
  title,
  subtitle,
  status,
  entityType,
  onBack,
  primaryActionLabel = 'Edit Record',
  onPrimaryAction,
  secondaryActionLabel = 'Print Pass',
  onSecondaryAction,
  overviewFields,
  timelineEvents = [],
  activityTrace,
  documents = [],
  accessPermissions = [],
  auditInfo,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: `Timeline (${timelineEvents.length})` },
    { id: 'documents', label: `Documents (${documents.length})` },
    { id: 'activity', label: 'Activity & ESG Traceability' },
    { id: 'access', label: 'Access & Zones' },
    { id: 'audit', label: 'Audit Trail' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="vms-entity-detail-page">
      {/* 1. DETAIL HEADER (Identity, Status, Primary/Secondary Actions) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          borderRadius: radius.md,
          border: `1px solid ${colors.slate[200]}`,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="ghost" size="dense" leftIcon={<ArrowLeft size={16} />} onClick={onBack}>
            Back
          </Button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500], fontWeight: 600 }}>
                {entityId}
              </span>
              <StatusBadge status={status as any} size="sm" />
              <span style={{ fontSize: '10px', backgroundColor: colors.slate[100], color: colors.slate[600], padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                {entityType}
              </span>
            </div>

            <h2 style={{ margin: '2px 0 0 0', fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>
              {title}
            </h2>
            {subtitle && (
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {secondaryActionLabel && (
            <Button
              variant="outline"
              size="dense"
              leftIcon={<Printer size={13} />}
              onClick={onSecondaryAction || (() => window.print())}
            >
              {secondaryActionLabel}
            </Button>
          )}

          {primaryActionLabel && (
            <Button
              variant="primary"
              size="dense"
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 3. TAB CONTENT */}
      {activeTab === 'overview' && (
        <Card title="Entity Overview & Attributes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {overviewFields.map((field, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {field.label}
                </span>
                <div style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900], fontWeight: 600 }}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card title="Chronological Event History">
          {timelineEvents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500] }}>No events recorded yet.</div>
          ) : (
            <Timeline events={timelineEvents} />
          )}
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card title="Compliance Documents & Verification Vault">
          {documents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500] }}>No documents attached.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: colors.slate[50],
                    border: `1px solid ${colors.slate[200]}`,
                    borderRadius: radius.sm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck size={18} color={colors.primary[600]} />
                    <div>
                      <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>{doc.name}</strong>
                      <div style={{ fontSize: '11px', color: colors.slate[500] }}>
                        Type: {doc.type} {doc.expiry ? `• Valid until: ${doc.expiry}` : ''}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={doc.status as any} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Activity Traceability (Section 19) */}
          <Card
            title="Activity & Sustainability Traceability"
            subtitle="Normalized mobility activity created and linked to this operational transaction"
          >
            {activityTrace ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: colors.esg[50],
                    border: `1px solid ${colors.esg[500]}`,
                    borderRadius: radius.md,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={22} color={colors.esg[700]} />
                    <div>
                      <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.esg[700] }}>
                        Transport Activity Created
                      </strong>
                      <div style={{ fontSize: '11px', color: colors.slate[600] }}>
                        Source: Transaction <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{activityTrace.sourceTransactionId}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', backgroundColor: '#ffffff', color: colors.esg[700], padding: '2px 8px', borderRadius: radius.sm, fontWeight: 700, border: `1px solid ${colors.esg[500]}` }}>
                      STATUS: {activityTrace.status}
                    </span>
                  </div>
                </div>

                {/* Trace Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: typography.fontSize.xs.size }}>
                  <div>
                    <span style={{ color: colors.slate[500] }}>Activity ID:</span>
                    <div style={{ fontWeight: 700, fontFamily: typography.fontFamily.mono }}>{activityTrace.activityId}</div>
                  </div>
                  <div>
                    <span style={{ color: colors.slate[500] }}>Mobility Mode:</span>
                    <div style={{ fontWeight: 700 }}>{activityTrace.mode}</div>
                  </div>
                  <div>
                    <span style={{ color: colors.slate[500] }}>Reported Distance:</span>
                    <div style={{ fontWeight: 700 }}>{activityTrace.distanceKm} km</div>
                  </div>
                  <div>
                    <span style={{ color: colors.slate[500] }}>Data Provenance:</span>
                    <div style={{ fontWeight: 600, color: colors.primary[700] }}>{activityTrace.provenance}</div>
                  </div>
                  {activityTrace.occupancy && (
                    <div>
                      <span style={{ color: colors.slate[500] }}>Occupancy Divisor:</span>
                      <div style={{ fontWeight: 700 }}>{activityTrace.occupancy} Passengers</div>
                    </div>
                  )}
                  {activityTrace.calculatedEmissions && (
                    <div>
                      <span style={{ color: colors.slate[500] }}>Derived GHG Emissions:</span>
                      <div style={{ fontWeight: 800, color: colors.esg[700] }}>{activityTrace.calculatedEmissions}</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm, fontSize: '11px', color: colors.slate[600] }}>
                  <strong>Drill-down path:</strong> {entityType} ({entityId}) → Transport → Activity ({activityTrace.activityId}) → GHG Accounting Engine
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500] }}>
                No mobility or freight transport activity linked to this transaction.
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'access' && (
        <Card title="Authorized Gates, Zones & Policies">
          {accessPermissions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500] }}>No zone access policies mapped.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {accessPermissions.map((acc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: colors.slate[50],
                    border: `1px solid ${colors.slate[200]}`,
                    borderRadius: radius.sm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <KeyRound size={16} color={colors.primary[600]} />
                    <div>
                      <strong style={{ fontSize: typography.fontSize.sm.size }}>{acc.zone}</strong>
                      <div style={{ fontSize: '11px', color: colors.slate[500] }}>
                        Assigned Gate: {acc.gate} • Valid until: {acc.validUntil}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={acc.status as any} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card title="Enterprise Audit & Provenance Records">
          {auditInfo ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', fontSize: typography.fontSize.xs.size }}>
              <div>
                <span style={{ color: colors.slate[500] }}>Created By:</span>
                <div style={{ fontWeight: 700, color: colors.slate[900] }}>{auditInfo.createdBy}</div>
                <span style={{ fontSize: '11px', color: colors.slate[400] }}>{auditInfo.createdAt}</span>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>Last Updated By:</span>
                <div style={{ fontWeight: 700, color: colors.slate[900] }}>{auditInfo.lastUpdatedBy}</div>
                <span style={{ fontSize: '11px', color: colors.slate[400] }}>{auditInfo.lastUpdatedAt}</span>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>Source Transaction:</span>
                <div style={{ fontWeight: 700, fontFamily: typography.fontFamily.mono }}>{auditInfo.sourceTransaction}</div>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>ABAC Policy Decision:</span>
                <div style={{ fontWeight: 700, color: colors.status.success.solid }}>{auditInfo.policyDecision}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500] }}>No audit record details available.</div>
          )}
        </Card>
      )}
    </div>
  );
};
