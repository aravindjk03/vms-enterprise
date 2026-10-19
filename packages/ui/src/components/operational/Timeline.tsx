import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, DoorOpen, LogOut, FileText, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface TimelineEventItem {
  id: string;
  time: string;
  date?: string;
  title: string;
  description?: string;
  actor?: string;
  status?: 'COMPLETED' | 'PENDING' | 'ALERT' | 'SKIPPED';
  iconType?: 'CHECK' | 'CLOCK' | 'SECURITY' | 'GATE_ENTRY' | 'GATE_EXIT' | 'DOCUMENT' | 'ALERT';
}

export interface TimelineProps {
  events: TimelineEventItem[];
  title?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, title }) => {
  const renderIcon = (type?: string, status?: string) => {
    const iconColor = status === 'ALERT'
      ? colors.status.danger.solid
      : status === 'PENDING'
      ? colors.status.warning.solid
      : colors.status.success.solid;

    switch (type) {
      case 'SECURITY':
        return <ShieldCheck size={14} color={iconColor} />;
      case 'GATE_ENTRY':
        return <DoorOpen size={14} color={iconColor} />;
      case 'GATE_EXIT':
        return <LogOut size={14} color={iconColor} />;
      case 'DOCUMENT':
        return <FileText size={14} color={iconColor} />;
      case 'ALERT':
        return <AlertTriangle size={14} color={iconColor} />;
      case 'CLOCK':
        return <Clock size={14} color={iconColor} />;
      case 'CHECK':
      default:
        return <CheckCircle2 size={14} color={iconColor} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }} className="vms-timeline">
      {title && (
        <h4 style={{ margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
          {title}
        </h4>
      )}

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Continuous vertical timeline line */}
        <div
          style={{
            position: 'absolute',
            left: '7px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: colors.slate[200],
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((evt, idx) => {
            const isCompleted = evt.status !== 'PENDING';

            return (
              <div key={evt.id || idx} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Node dot / icon */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: radius.full,
                    backgroundColor: '#ffffff',
                    border: `2px solid ${isCompleted ? colors.primary[600] : colors.slate[400]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: radius.full,
                      backgroundColor: isCompleted ? colors.primary[600] : colors.slate[400],
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: typography.fontFamily.mono,
                        fontWeight: 600,
                        color: colors.slate[500],
                      }}
                    >
                      {evt.time} {evt.date ? `• ${evt.date}` : ''}
                    </span>
                    <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                      {evt.title}
                    </strong>
                  </div>

                  {evt.description && (
                    <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                      {evt.description}
                    </span>
                  )}

                  {evt.actor && (
                    <span style={{ fontSize: '11px', color: colors.slate[400] }}>
                      By: {evt.actor}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
