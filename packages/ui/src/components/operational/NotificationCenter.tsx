import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Flame, 
  Leaf, 
  DoorOpen, 
  X,
  ExternalLink
} from 'lucide-react';
import { colors, radius, shadows, typography } from '../../tokens.js';

export interface NotificationItem {
  id: string;
  category: 'APPROVAL' | 'SECURITY' | 'DOCUMENT' | 'SAFETY' | 'GATE' | 'EMERGENCY' | 'ESG' | 'SYSTEM';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  sourceTransactionId?: string;
  actionUrl?: string;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNavigate?: (url: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (cat: string, sev: string) => {
    const isCritical = sev === 'CRITICAL';
    const color = isCritical ? colors.status.danger.solid : colors.primary[600];

    switch (cat) {
      case 'SECURITY':
      case 'EMERGENCY':
        return <ShieldAlert size={16} color={colors.status.danger.solid} />;
      case 'SAFETY':
        return <Flame size={16} color={colors.status.warning.solid} />;
      case 'GATE':
        return <DoorOpen size={16} color={color} />;
      case 'DOCUMENT':
        return <FileText size={16} color={colors.slate[600]} />;
      case 'ESG':
        return <Leaf size={16} color={colors.esg[600]} />;
      case 'APPROVAL':
      default:
        return <CheckCircle2 size={16} color={colors.status.warning.solid} />;
    }
  };

  return (
    <div style={{ position: 'relative' }} className="vms-notification-center">
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: radius.md,
          border: 'none',
          backgroundColor: isOpen ? colors.slate[100] : 'transparent',
          cursor: 'pointer',
          color: colors.slate[700],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              borderRadius: radius.full,
              backgroundColor: colors.status.danger.solid,
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #ffffff',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 900 }}
          />

          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '6px',
              width: '380px',
              maxWidth: '90vw',
              backgroundColor: '#ffffff',
              borderRadius: radius.md,
              boxShadow: shadows.modal,
              border: `1px solid ${colors.slate[200]}`,
              zIndex: 901,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.slate[200]}`,
                backgroundColor: colors.slate[50],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                  Operational Notifications
                </strong>
                {unreadCount > 0 && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: radius.sm,
                      backgroundColor: colors.primary[100],
                      color: colors.primary[700],
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount} New
                  </span>
                )}
              </div>

              {onMarkAllAsRead && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '11px',
                    color: colors.primary[600],
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification items list */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.xs.size }}>
                  No active notifications
                </div>
              ) : (
                notifications.map((item) => {
                  const isCritical = item.severity === 'CRITICAL';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.isRead && onMarkAsRead) onMarkAsRead(item.id);
                        if (item.actionUrl && onNavigate) {
                          onNavigate(item.actionUrl);
                          setIsOpen(false);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${colors.slate[100]}`,
                        backgroundColor: !item.isRead
                          ? isCritical
                            ? colors.status.danger.bg
                            : colors.primary[50]
                          : '#ffffff',
                        cursor: item.actionUrl ? 'pointer' : 'default',
                        transition: 'background-color 80ms ease',
                      }}
                    >
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {getCategoryIcon(item.category, item.severity)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: typography.fontSize.xs.size,
                              fontWeight: 700,
                              color: isCritical ? colors.status.danger.fg : colors.slate[900],
                            }}
                          >
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', color: colors.slate[400], flexShrink: 0 }}>
                            {item.timestamp}
                          </span>
                        </div>

                        <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600], lineHeight: '16px' }}>
                          {item.message}
                        </span>

                        {item.sourceTransactionId && (
                          <span style={{ fontSize: '10px', fontFamily: typography.fontFamily.mono, color: colors.slate[400] }}>
                            Ref: {item.sourceTransactionId}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
