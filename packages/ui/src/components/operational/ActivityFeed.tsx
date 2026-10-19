import React from 'react';
import { Clock, Shield, AlertTriangle, CheckCircle2, User, ArrowRight, FileText } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface ActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'VISITOR' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL' | 'GATE' | 'SECURITY' | 'ESG' | 'SYSTEM';
  entityId: string;
  details?: string;
  severity?: 'NORMAL' | 'WARN' | 'CRITICAL';
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  maxItems?: number;
  onItemClick?: (item: ActivityItem) => void;
  style?: React.CSSProperties;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  title = 'Live Facility Activity Feed',
  maxItems,
  onItemClick,
  style,
}) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'CRITICAL':
        return colors.status.danger.solid;
      case 'WARN':
        return colors.status.warning.solid;
      default:
        return colors.slate[400];
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        overflow: 'hidden',
        ...style,
      }}
      className="vms-activity-feed"
    >
      {title && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: colors.slate[50],
            borderBottom: `1px solid ${colors.slate[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[800], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </strong>
          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            {items.length} Events
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' }}>
        {displayItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.xs.size }}>
            No recent facility events recorded.
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const isLast = idx === displayItems.length - 1;

            return (
              <div
                key={item.id}
                onClick={() => onItemClick && onItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderBottom: isLast ? 'none' : `1px solid ${colors.slate[100]}`,
                  cursor: onItemClick ? 'pointer' : 'default',
                  transition: 'background-color 80ms ease',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: radius.full,
                    backgroundColor: getSeverityColor(item.severity),
                    marginTop: '5px',
                    flexShrink: 0,
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          backgroundColor: colors.slate[100],
                          color: colors.slate[700],
                        }}
                      >
                        {item.entityType}
                      </span>
                      <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                        {item.action}
                      </strong>
                    </div>
                    <span style={{ fontSize: '10px', color: colors.slate[400], fontFamily: typography.fontFamily.mono }}>
                      {item.timestamp}
                    </span>
                  </div>

                  {item.details && (
                    <span style={{ fontSize: '11px', color: colors.slate[600] }}>
                      {item.details}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: colors.slate[500], marginTop: '2px' }}>
                    <span>By: <strong>{item.actor}</strong></span>
                    <span>•</span>
                    <span style={{ fontFamily: typography.fontFamily.mono }}>Ref: {item.entityId}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
