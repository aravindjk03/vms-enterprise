import React, { useCallback, useState } from 'react';
import type { SessionUser } from '../../../api/client.js';
import { ServiceDashboard, RequestsView } from './Requests.js';
import { WorkOrdersView } from './WorkOrders.js';
import { ProvidersView, TechniciansView } from './Providers.js';
import { ExceptionsView, SchedulesView, ServiceCalendar } from './Schedules.js';

/** Live Service navigation, filtered by the permissions the server granted the signed-in role. */
export const SERVICE_NAV: Array<{ route: string; label: string; anyOf: string[] }> = [
  { route: '/services/dashboard', label: 'Service Dashboard', anyOf: ['SERVICE_READ'] },
  { route: '/services', label: 'Service Requests', anyOf: ['SERVICE_READ', 'SERVICE_REQUEST_CREATE'] },
  { route: '/services/work-orders', label: 'Work Orders', anyOf: ['SERVICE_READ'] },
  { route: '/services/calendar', label: 'Schedule Calendar', anyOf: ['SERVICE_READ'] },
  { route: '/services/schedules', label: 'Recurring Service', anyOf: ['SERVICE_READ'] },
  { route: '/services/providers', label: 'Service Providers', anyOf: ['SERVICE_READ'] },
  { route: '/services/technicians', label: 'Technicians', anyOf: ['SERVICE_READ'] },
  { route: '/services/exceptions', label: 'Exceptions', anyOf: ['SERVICE_READ'] },
];

export function serviceNavFor(user: SessionUser) {
  return SERVICE_NAV.filter(n => n.anyOf.some(p => user.permissions.includes(p)));
}

export const ServiceModule: React.FC<{ route: string; user: SessionUser; navigate: (route: string) => void }> = ({ route, user, navigate }) => {
  const [pendingWorkOrder, setPendingWorkOrder] = useState<{ createForRequest?: string; openId?: string } | null>(null);
  const consume = useCallback(() => setPendingWorkOrder(null), []);
  const openWorkOrder = useCallback(
    (id: string) => {
      setPendingWorkOrder({ openId: id });
      navigate('/services/work-orders');
    },
    [navigate]
  );

  const allowed = serviceNavFor(user).some(n => n.route === route) || (route === '/services/new' && user.permissions.includes('SERVICE_REQUEST_CREATE'));
  if (!allowed) {
    return (
      <div role="alert" style={{ padding: '24px', fontSize: '14px' }}>
        Your role does not have access to this part of Service management.
      </div>
    );
  }

  switch (route) {
    case '/services/dashboard':
      return <ServiceDashboard go={navigate} />;
    case '/services/work-orders':
      return (
        <WorkOrdersView
          user={user}
          createForRequest={pendingWorkOrder?.createForRequest}
          openId={pendingWorkOrder?.openId}
          onConsumed={consume}
        />
      );
    case '/services/calendar':
      return <ServiceCalendar onOpenWorkOrder={openWorkOrder} />;
    case '/services/schedules':
      return <SchedulesView user={user} onOpenWorkOrder={openWorkOrder} />;
    case '/services/providers':
      return <ProvidersView user={user} />;
    case '/services/technicians':
      return <TechniciansView user={user} />;
    case '/services/exceptions':
      return <ExceptionsView user={user} onOpenWorkOrder={openWorkOrder} />;
    default:
      return (
        <RequestsView
          user={user}
          openCreate={route === '/services/new'}
          onCreateWorkOrder={requestId => {
            setPendingWorkOrder({ createForRequest: requestId });
            navigate('/services/work-orders');
          }}
        />
      );
  }
};
