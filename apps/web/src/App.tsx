import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Handshake, 
  HardHat, 
  Wrench, 
  Package, 
  Truck, 
  Compass, 
  Shield, 
  KeyRound, 
  FileCheck, 
  Flame, 
  AlertOctagon, 
  Leaf, 
  BarChart3, 
  Sparkles, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  X, 
  Building2, 
  Wifi, 
  WifiOff, 
  UserCircle,
  HelpCircle,
  Tablet,
  CheckCircle2,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  UserPlus
} from 'lucide-react';
import type { EnterpriseRole } from '@vms/types';
import { colors, radius, typography, breakpoints } from '@vms/ui/tokens';
import { 
  Button, 
  Banner, 
  Card,
  NotificationCenter, 
  CommandPalette, 
  GlobalSearch,
  ContextSwitcher,
  SyncStatusIndicator,
  EntityDetailPage,
  StatusBadge,
  NoPermissionStateView,
  type SiteContextOption,
  type ColumnDef,
  type SearchResultItem,
  type GateSyncState,
  ToastHost,
} from '@vms/ui';

// Internal Views & Mock Data
import { 
  DEMO_SITES, 
  DEMO_NOTIFICATIONS, 
  DEMO_VISITORS, 
  DEMO_CONTRACTORS, 
  DEMO_MATERIALS, 
  DEMO_VEHICLES, 
  DEMO_CUSTOMERS,
  DEMO_SERVICES,
  DEMO_ACCESS_POINTS,
  DEMO_DOCUMENTS,
  DEMO_SAFETY,
  DEMO_ESG_RECORDS,
  DEMO_TIMELINE_EVENTS
} from './mockData.js';
import { ExecutiveDashboardView } from './views/ExecutiveDashboardView.js';
import { OperationsDashboardView } from './views/OperationsDashboardView.js';
import { SecurityDashboardView } from './views/SecurityDashboardView.js';
import { GateModeView } from './views/GateModeView.js';
import { KioskWelcomeView } from './views/KioskWelcomeView.js';
import { TransactionFormView } from './views/TransactionFormView.js';
import { GenericDomainListView } from './views/GenericDomainListView.js';
import { EmergencyModalView } from './views/EmergencyModalView.js';
import { MasterDataView } from './views/MasterDataView.js';
import { WorkflowBuilderView } from './views/WorkflowBuilderView.js';
import { TaskCenterView } from './views/TaskCenterView.js';
import { RulesEngineView } from './views/RulesEngineView.js';
import { VisitorManagementView, type VisitorSubView } from './views/visitor/VisitorManagementView.js';
import { CustomerManagementView, type CustomerSubView } from './views/customer/CustomerManagementView.js';
import { ContractorManagementView, type ContractorSubView } from './views/contractor/ContractorManagementView.js';
import { LiveTableView, LiveVisitorsView, renderDate, renderStatus } from './views/live/LiveViews.js';
import { LiveDashboard } from './views/live/Dashboard.js';
import { UsersView } from './views/live/admin/UsersView.js';
import { RolesView } from './views/live/admin/RolesView.js';
import { AuditLogView } from './views/live/admin/AuditLogView.js';
import { ServiceModule, serviceNavFor } from './views/live/service/ServiceModule.js';
import { apiRequest, type SessionUser } from './api/client.js';
import { AppShell, menuIcons, type ShellMenuAction, type ShellNavGroup, type ShellNavItem } from './shell/AppShell.js';
import { SiteSwitcher } from './shell/SiteSwitcher.js';

export interface AppProps {
  initialRoute?: string;
  initialRole?: EnterpriseRole;
  /** Present when signed in against the API; absent in the static demo build. */
  session?: {
    user: SessionUser;
    onSignOut: () => void;
    onChangePassword: () => void;
  };
  /** Demo build: the demo account the visitor signed in with (sample data, no API). */
  demo?: {
    name: string;
    role: EnterpriseRole;
    /** The demo account as a session user (role permissions), for the screens shared with the live console. */
    user?: SessionUser;
    onSignOut: () => void;
  };
}

/** Visitor routes that map onto a status filter of the live register. */
/** Live screens per menu group, each shown when the user holds any of the listed permissions. */
const LIVE_NAV: Record<string, Array<{ route: string; label: string; anyOf: string[] }>> = {
  dashboard: [{ route: '/dashboard', label: 'Overview', anyOf: [] }],
  visitors: [
    { route: '/visitors', label: 'Visitor Register', anyOf: ['VISITOR_READ'] },
    { route: '/visitors/new', label: 'Register Visitor', anyOf: ['VISITOR_WRITE'] },
    { route: '/visitors/approvals', label: 'Pending Approvals', anyOf: ['VISITOR_APPROVE'] },
    { route: '/visitors/expected', label: 'Expected (Approved)', anyOf: ['VISITOR_READ'] },
    { route: '/visitors/inside', label: 'Currently Inside', anyOf: ['VISITOR_READ'] },
    { route: '/visitors/completed', label: 'Completed Visits', anyOf: ['VISITOR_READ'] },
    { route: '/visitors/cancelled', label: 'Cancelled Visits', anyOf: ['VISITOR_READ'] },
  ],
  customers: [{ route: '/customers/accounts', label: 'Customer Accounts', anyOf: ['CUSTOMER_READ'] }],
  contractors: [{ route: '/contractors/companies', label: 'Contractor Companies', anyOf: ['CONTRACTOR_READ'] }],
  admin: [
    { route: '/admin/users', label: 'Users', anyOf: ['USER_MANAGE'] },
    { route: '/admin/roles', label: 'Roles & permissions', anyOf: ['USER_MANAGE'] },
    { route: '/admin/audit', label: 'Audit log', anyOf: ['AUDIT_LOG_READ'] },
  ],
};

/** Screens the demo build renders with the live console's components (answered by the in-browser demo backend). */
const DEMO_SHARED_ROUTES = ['/dashboard', '/admin/users', '/admin/roles', '/admin/audit'];

/** Roles that see the sample-data preview screens of a group; tenant-wide admins see what super admins see. */
function holdsAnyRole(user: SessionUser, roles: string[]): boolean {
  return [user.role, ...user.roles].some(r => roles.includes(r) || (r === 'ORGANIZATION_ADMIN' && roles.includes('SUPER_ADMIN')));
}

/** `roles` limits a single screen further than its group does. */
type NavItem = { route: string; label: string; sample?: boolean; roles?: string[] };

function liveNavDomains<D extends { id: string; roles: string[]; items: NavItem[] }>(
  domains: D[],
  user: SessionUser
): Array<D & { preview?: boolean }> {
  const live: Array<D & { preview?: boolean }> = [];
  const preview: Array<D & { preview?: boolean }> = [];
  for (const d of domains) {
    const liveItems: NavItem[] = (
      d.id === 'services'
        ? serviceNavFor(user)
        : (LIVE_NAV[d.id] ?? []).filter(i => i.anyOf.length === 0 || i.anyOf.some(p => user.permissions.includes(p)))
    ).map(({ route, label }) => ({ route, label }));
    const liveRoutes = new Set((LIVE_NAV[d.id] ?? []).map(i => i.route));
    const sampleItems: NavItem[] =
      d.id === 'services' || !holdsAnyRole(user, d.roles)
        ? []
        : d.items
            .filter(i => !liveRoutes.has(i.route) && !(d.id === 'visitors' && i.route in LIVE_VISITOR_FILTERS))
            .filter(i => !i.roles || holdsAnyRole(user, i.roles))
            .map(i => ({ ...i, sample: true }));
    if (liveItems.length) live.push({ ...d, items: [...liveItems, ...sampleItems] });
    // Groups with no live screen sit under the Preview heading, so their items need no tag.
    else if (sampleItems.length) preview.push({ ...d, items: sampleItems.map(({ sample: _sample, ...item }) => item), preview: true });
  }
  return [...live, ...preview];
}

/** Sample audit trail for the demo build (the live console reads /api/v1/audit-logs). */
const DEMO_AUDIT_EVENTS = [
  { id: 'AUD-1041', time: '2026-10-07 10:04', action: 'VISITOR_CHECKED_IN', actor: 'Gate Guard #04', entity: 'VIS-2026-0418', status: 'approved' },
  { id: 'AUD-1040', time: '2026-10-07 09:58', action: 'VISITOR_APPROVED', actor: 'Host: R. Iyer', entity: 'VIS-2026-0418', status: 'approved' },
  { id: 'AUD-1039', time: '2026-10-07 09:41', action: 'VISITOR_REGISTERED', actor: 'Reception REC-01', entity: 'VIS-2026-0418', status: 'active' },
  { id: 'AUD-1038', time: '2026-10-07 09:12', action: 'LOGIN_FAILED', actor: 'unknown user', entity: 'Sign-in', status: 'warning' },
  { id: 'AUD-1037', time: '2026-10-07 08:55', action: 'SERVICE_WORK_ORDER_APPROVED', actor: 'Maintenance Manager', entity: 'SWO-2026-0093', status: 'approved' },
];

/** AI Copilot preview: no language model is connected in this build, so the prompt says so plainly. */
const AiCopilotPrompt: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (question.trim()) setAsked(question.trim());
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          aria-label="Question for the AI copilot"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about plant operations, gate queues or emissions…"
          style={{ flex: '1 1 260px', minWidth: 0, height: '38px', padding: '0 12px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md, fontSize: typography.fontSize.sm.size }}
        />
        <Button type="submit" variant="primary" size="normal" rightIcon={<Sparkles size={14} />} disabled={!question.trim()}>
          Analyze
        </Button>
      </div>
      {asked && (
        <div role="status" style={{ padding: '10px 12px', fontSize: typography.fontSize.sm.size, color: colors.slate[700], backgroundColor: colors.slate[50], border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md }}>
          The copilot is not connected to a language model in this version, so “{asked}” was not analyzed. Answers will
          appear here once the analytics service is enabled.
        </div>
      )}
    </form>
  );
};

const LIVE_VISITOR_FILTERS: Record<string, string> = {
  '/visitors/approvals': 'PENDING',
  '/visitors/expected': 'APPROVED',
  '/visitors/inside': 'ON_PREMISES',
  '/visitors/completed': 'COMPLETED',
  '/visitors/cancelled': 'CANCELLED',
};

export const App: React.FC<AppProps> = ({ 
  initialRoute = '/dashboard', 
  initialRole = 'SUPER_ADMIN',
  session,
  demo,
}) => {
  // Navigation & View Routing State
  const [activeRoute, setActiveRoute] = useState<string>(initialRoute);
  const goTo = (route: string) => {
    setSelectedDetailItem(null);
    setActiveRoute(route);
  };

  // Authenticated Role & Scope State
  // The role comes from the server (live) or from the demo account the visitor signed in with.
  const activeRole: EnterpriseRole = session?.user.role ?? demo?.role ?? initialRole;
  const [activeSiteContext, setActiveSiteContext] = useState<SiteContextOption>(DEMO_SITES[0]);
  // Signed in: the site switcher lists the sites the server says this user may access (never demo sites).
  const [liveSites, setLiveSites] = useState<SiteContextOption[]>([]);
  useEffect(() => {
    if (!session) return;
    apiRequest<{ items: Array<{ siteId: string; name: string }> }>('/api/v1/sites')
      .then(r => {
        const options = r.items.map(site => ({
          organizationId: session.user.tenantId,
          organizationName: 'Your sites',
          siteId: site.siteId,
          siteName: site.name,
        }));
        setLiveSites(options);
        const preferred = options.find(o => o.siteId === session.user.defaultSiteId) ?? options[0];
        if (preferred) setActiveSiteContext(preferred);
      })
      .catch(() => setLiveSites([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.userId]);

  // Command Palette & Global Search State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Detail Page Inspection State (Section 22)
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    item: Record<string, any>;
    entityType: 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL' | 'GATE_PASS';
  } | null>(null);

  // Emergency & Offline State (Section 29 & Section 38)
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);

  // Global Keyboard Shortcuts (Ctrl/Cmd + K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Complete 18-Domain Navigation Hierarchy (Sections 5 & 6)
  const baseNavDomains = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'EHS_MANAGER', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT', 'SERVICE_MANAGER'],
      items: [
        { route: '/dashboard', label: 'Executive Dashboard' },
        { route: '/dashboard/operations', label: 'Operations Dashboard', roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'MANAGEMENT', 'AUDITOR'] },
        { route: '/dashboard/security', label: 'Security Dashboard', roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'MANAGEMENT', 'AUDITOR'] },
      ],
    },
    {
      id: 'tasks',
      label: 'Task Center',
      icon: <CheckCircle2 size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'EHS_MANAGER', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT', 'SERVICE_MANAGER'],
      items: [
        { route: '/tasks', label: 'Pending Approvals' },
        { route: '/tasks/delegated', label: 'Delegated Tasks' },
        { route: '/tasks/overdue', label: 'Overdue & Escalated' },
        { route: '/tasks/history', label: 'Completed History' },
      ],
    },
    {
      id: 'visitors',
      label: 'Visitor',
      icon: <Users size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'RECEPTIONIST', 'SECURITY_GUARD', 'HOST', 'AUDITOR', 'MANAGEMENT'],
      items: [
        { route: '/visitors', label: 'All Visitors' },
        { route: '/visitors/dashboard', label: 'Visitor Operations KPI' },
        { route: '/visitors/new', label: 'New Pre-Registration' },
        { route: '/visitors/walk-in', label: 'Gate Walk-In (<60s)' },
        { route: '/visitors/repeated', label: 'Frequent Visitors' },
        { route: '/visitors/group', label: 'Group Delegations' },
        { route: '/visitors/vip', label: 'VIP Protocol' },
        { route: '/visitors/expected', label: 'Expected Today' },
        { route: '/visitors/inside', label: 'Currently Inside' },
        { route: '/visitors/approvals', label: 'Host Approvals' },
        { route: '/visitors/overstays', label: 'Overstay Queue' },
        { route: '/visitors/traceability', label: 'ESG Traceability Ledger' },
        { route: '/visitors/history', label: 'Historical Archives' },
      ],
    },
    {
      id: 'customers',
      label: 'Customer',
      icon: <Handshake size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'AUDITOR', 'MANAGEMENT', 'EHS_MANAGER', 'ESG_MANAGER'],
      items: [
        { route: '/customers', label: 'Customer Dashboard' },
        { route: '/customers/accounts', label: 'Customer Accounts' },
        { route: '/customers/representatives', label: 'Representatives' },
        { route: '/customers/visits', label: 'All Customer Visits' },
        { route: '/customers/new', label: 'New Customer Visit' },
        { route: '/customers/meetings', label: 'Customer Meetings' },
        { route: '/customers/audits', label: 'Customer Audits' },
        { route: '/customers/inspections', label: 'Customer Inspections' },
        { route: '/customers/quality', label: 'Quality Visits' },
        { route: '/customers/technical', label: 'Technical Visits' },
        { route: '/customers/plant', label: 'Plant Visits' },
        { route: '/customers/delegations', label: 'Delegations' },
        { route: '/customers/expected', label: 'Expected Today' },
        { route: '/customers/inside', label: 'Currently Inside' },
        { route: '/customers/approvals', label: 'Pending Approvals' },
        { route: '/customers/nda', label: 'Legal / NDA Requirements' },
        { route: '/customers/exceptions', label: 'Visit Exceptions' },
        { route: '/customers/completed', label: 'Completed Visits' },
        { route: '/customers/cancelled', label: 'Cancelled / No-Show' },
        { route: '/customers/history', label: 'Customer Visit History' },
        { route: '/customers/traceability', label: 'ESG Activity Traceability' },
      ],
    },
    {
      id: 'contractors',
      label: 'Contractor',
      icon: <HardHat size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER', 'SECURITY_GUARD', 'HR', 'MANAGEMENT', 'GATE_OPERATOR', 'AUDITOR', 'ESG_MANAGER'],
      items: [
        { route: '/contractors', label: 'Contractor Dashboard' },
        { route: '/contractors/companies', label: 'Contractor Companies' },
        { route: '/contractors/contracts', label: 'Contracts & MSAs' },
        { route: '/contractors/work-orders', label: 'Work Orders' },
        { route: '/contractors/workers', label: 'Worker Directory' },
        { route: '/contractors/returning', label: 'Returning Workers' },
        { route: '/contractors/assignments', label: 'Work Assignments' },
        { route: '/contractors/compliance', label: 'Compliance & Safety' },
        { route: '/contractors/training', label: 'Training Records' },
        { route: '/contractors/inductions', label: 'Safety Inductions' },
        { route: '/contractors/qualifications', label: 'Qualifications' },
        { route: '/contractors/medical', label: 'Medical Fitness' },
        { route: '/contractors/permits', label: 'Permit Prerequisites' },
        { route: '/contractors/inside', label: 'Currently On Site' },
        { route: '/contractors/attendance', label: 'Daily Attendance' },
        { route: '/contractors/expected', label: 'Expected Workforce' },
        { route: '/contractors/approvals', label: 'Pending Approvals' },
        { route: '/contractors/expiring', label: 'Expiring Documents' },
        { route: '/contractors/restricted', label: 'Restricted Workers' },
        { route: '/contractors/traceability', label: 'ESG Activity Traceability' },
        { route: '/contractors/history', label: 'Contractor History' },
        { route: '/contractors/exceptions', label: 'Exceptions & Breaches' },
      ],
    },
    {
      id: 'services',
      label: 'Service / Work',
      icon: <Wrench size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER', 'MANAGEMENT', 'SERVICE_MANAGER'],
      items: [
        { route: '/services', label: 'Service Tickets' },
      ],
    },
    {
      id: 'materials',
      label: 'Material',
      icon: <Package size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'AUDITOR', 'MANAGEMENT'],
      items: [
        { route: '/materials', label: 'Material Passes' },
      ],
    },
    {
      id: 'vehicles',
      label: 'Vehicle',
      icon: <Truck size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'AUDITOR', 'MANAGEMENT'],
      items: [
        { route: '/vehicles', label: 'Commercial Vehicles' },
      ],
    },
    {
      id: 'transport',
      label: 'Transport',
      icon: <Compass size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'ESG_MANAGER', 'MANAGEMENT'],
      items: [
        { route: '/transport', label: 'Mobility Activity' },
      ],
    },
    {
      id: 'gate',
      label: 'Gate Console',
      icon: <Shield size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'SECURITY_MANAGER'],
      items: [
        { route: '/gate', label: 'Gate Console' },
        { route: '/gate/passes', label: 'Gate Passes & Exceptions' },
      ],
    },
    {
      id: 'access',
      label: 'Access',
      icon: <KeyRound size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER'],
      items: [
        { route: '/access', label: 'Access Points' },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileCheck size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'LEGAL', 'HR', 'EHS_MANAGER', 'AUDITOR'],
      items: [
        { route: '/documents', label: 'Document Repository' },
      ],
    },
    {
      id: 'safety',
      label: 'Safety & EHS',
      icon: <Flame size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER'],
      items: [
        { route: '/safety', label: 'Inductions & Permits' },
      ],
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: <AlertOctagon size={18} color={colors.status.danger.solid} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'EHS_MANAGER', 'MANAGEMENT'],
      items: [
        { route: '/emergency', label: 'Muster & Occupancy' },
      ],
    },
    {
      id: 'esg',
      label: 'ESG / GHG',
      icon: <Leaf size={18} color={colors.esg[600]} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT'],
      items: [
        { route: '/esg', label: 'GHG Activity Ledger' },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR'],
      items: [
        { route: '/analytics', label: 'Operations Analytics' },
      ],
    },
    {
      id: 'ai',
      label: 'AI Copilot',
      icon: <Sparkles size={18} color="#8b5cf6" />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT'],
      items: [
        { route: '/ai', label: 'Natural Language Console' },
      ],
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: <Settings size={18} />,
      roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'IT_ADMIN'],
      items: [
        { route: '/admin/sites', label: 'Sites & Facilities' },
        { route: '/admin/master-data', label: 'Master Data' },
        { route: '/admin/workflows', label: 'Workflow Builder' },
        { route: '/admin/rules', label: 'Business Rules Engine' },
        { route: '/admin/audit', label: 'Audit Logs' },
      ],
    },
  ];

  // Signed in: menus come from the permissions the server granted (all of the user's roles, not only
  // the primary one). Screens backed by live data come first; screens that still show sample data are
  // grouped under "Preview" so they are never mistaken for real records.
  type NavDomain = (typeof baseNavDomains)[number] & { preview?: boolean };
  const navDomains: NavDomain[] = session ? liveNavDomains(baseNavDomains, session.user) : baseNavDomains;

  // Demo build: the demo account's role decides the menu. Overview, Users, Roles and the audit log use the
  // same screens as the live console, answered in the browser from sample data (see demo/demoBackend.ts).
  const demoUser = demo?.user;
  const demoAdminItems: NavItem[] = demoUser
    ? (LIVE_NAV.admin ?? []).filter((i) => i.anyOf.some((p) => demoUser.permissions.includes(p))).map(({ route, label }) => ({ route, label }))
    : [];
  const visibleDomains = session
    ? navDomains
    : navDomains
        .map((d) => {
          const forRole = (items: NavItem[]) => items.filter((i) => !i.roles || i.roles.includes(activeRole));
          if (d.id === 'dashboard') return { ...d, items: forRole(d.items).map((i) => (i.route === '/dashboard' ? { ...i, label: 'Overview' } : i)) };
          if (d.id !== 'admin') return { ...d, items: forRole(d.items) };
          const sample = d.roles.includes(activeRole) ? d.items.filter((i) => i.route !== '/admin/audit') : [];
          return { ...d, roles: demoAdminItems.length ? [...d.roles, activeRole] : d.roles, items: [...demoAdminItems, ...sample] };
        })
        .filter((d) => d.roles.includes(activeRole) && d.items.length > 0);

  // Breadcrumbs Generator
  const getBreadcrumbs = () => {
    if (selectedDetailItem) {
      return [selectedDetailItem.entityType, selectedDetailItem.item.id || 'Entity Details'];
    }
    for (const d of visibleDomains) {
      const match = d.items.find((item) => item.route === activeRoute);
      if (match) {
        return [d.label, match.label];
      }
    }
    if (activeRoute === '/kiosk') return ['Terminals', 'Self-Service Kiosk'];
    return ['Dashboard', 'Overview'];
  };

  const breadcrumbs = getBreadcrumbs();

  // Column definitions for domain views
  const visitorColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Transaction ID', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'name', header: 'Visitor Name', sortable: true, render: (r) => <strong>{r.name}</strong> },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'purpose', header: 'Purpose of Visit' },
    { key: 'host', header: 'Host' },
    { key: 'time', header: 'Visit Window' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'transportMode', header: 'Mobility (ESG)', render: (r) => <span style={{ fontSize: '11px', color: colors.esg[700], fontWeight: 600 }}>{r.transportMode}</span> },
  ];

  const customerColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Customer Ref', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'account', header: 'Customer Account', sortable: true, render: (r) => <strong>{r.account}</strong> },
    { key: 'agenda', header: 'Audit / Visit Agenda' },
    { key: 'lead', header: 'Customer Lead / Delegate' },
    { key: 'host', header: 'Corporate Host' },
    { key: 'ndaStatus', header: 'NDA Status', render: (r) => <StatusBadge status={r.ndaStatus === 'SIGNED' ? 'approved' : 'warning'} size="micro" /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const contractorColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Work Order ID', width: '140px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'company', header: 'Contractor Company', sortable: true, render: (r) => <strong>{r.company}</strong> },
    { key: 'workOrder', header: 'Scope / SOW' },
    { key: 'workersCount', header: 'Workers Authorized', align: 'center' },
    { key: 'activeInside', header: 'Active on Site', align: 'center', render: (r) => <strong>{r.activeInside}</strong> },
    { key: 'inductionStatus', header: 'Induction Status', render: (r) => <StatusBadge status={r.inductionStatus === 'VALID' ? 'approved' : 'danger'} size="micro" /> },
    { key: 'ptwStatus', header: 'Permit To Work (PTW)' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const serviceColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Service Ticket', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'serviceType', header: 'Maintenance Scope', render: (r) => <strong>{r.serviceType}</strong> },
    { key: 'equipment', header: 'Plant Asset / Machine' },
    { key: 'vendor', header: 'OEM Vendor' },
    { key: 'technician', header: 'Field Engineer' },
    { key: 'permitRequired', header: 'Required Permit' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const materialColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Pass ID', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'challan', header: 'Challan Number', render: (r) => <span style={{ fontFamily: typography.fontFamily.mono }}>{r.challan}</span> },
    { key: 'type', header: 'Movement', render: (r) => <strong>{r.type}</strong> },
    { key: 'classification', header: 'Classification' },
    { key: 'supplier', header: 'Supplier / Vendor' },
    { key: 'item', header: 'Material Description' },
    { key: 'grossWeight', header: 'Gross Weight' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const vehicleColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Vehicle ID', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'plate', header: 'Registration Plate', render: (r) => <strong style={{ fontFamily: typography.fontFamily.mono }}>{r.plate}</strong> },
    { key: 'class', header: 'Vehicle Class' },
    { key: 'driver', header: 'Designated Driver' },
    { key: 'transporter', header: 'Transporter Agency' },
    { key: 'compliance', header: 'PUC / Compliance', render: (r) => <StatusBadge status={r.compliance === 'VALID' ? 'approved' : 'danger'} size="micro" /> },
    { key: 'fuel', header: 'Fuel Type' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const accessColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Access ID', width: '120px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'zone', header: 'Security Zone', render: (r) => <strong>{r.zone}</strong> },
    { key: 'gate', header: 'Terminal Hardware / Turnstile' },
    { key: 'type', header: 'Security Level' },
    { key: 'activeCount', header: 'Current Occupancy', align: 'center', render: (r) => <strong>{r.activeCount}</strong> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const documentColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Document Ref', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'name', header: 'Document Title', render: (r) => <strong>{r.name}</strong> },
    { key: 'owner', header: 'Associated Entity' },
    { key: 'type', header: 'Classification' },
    { key: 'expiry', header: 'Expiration Date' },
    { key: 'verification', header: 'OCR Verification', render: (r) => <StatusBadge status={r.verification === 'VERIFIED' ? 'approved' : 'warning'} size="micro" /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const esgColumns: ColumnDef<Record<string, any>>[] = [
    { key: 'id', header: 'Activity ID', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
    { key: 'domain', header: 'Source Domain', render: (r) => <strong>{r.domain}</strong> },
    { key: 'sourceId', header: 'Transaction Ref', render: (r) => <span style={{ fontFamily: typography.fontFamily.mono }}>{r.sourceId}</span> },
    { key: 'mode', header: 'Mobility Mode' },
    { key: 'distance', header: 'Distance' },
    { key: 'occupancy', header: 'Occupancy' },
    { key: 'provenance', header: 'Provenance Tag', render: (r) => <span style={{ padding: '1px 5px', backgroundColor: colors.slate[100], borderRadius: '2px', fontSize: '10px', fontWeight: 600 }}>{r.provenance}</span> },
    { key: 'scope', header: 'Assigned Scope', render: (r) => <span style={{ color: colors.esg[700], fontWeight: 600 }}>{r.scope}</span> },
  ];

  // View Router Dispatcher (Section 41 Page Inventory)
  const renderLiveContent = (user: SessionUser): React.ReactNode | null => {
    if (activeRoute === '/dashboard') {
      return (
        <LiveDashboard
          user={user}
          navigate={goTo}
          canOpen={(route) => allowedRoutes.has(route) || (!!session && route === '/services/new' && user.permissions.includes('SERVICE_REQUEST_CREATE'))}
        />
      );
    }
    if (activeRoute === '/admin/users') return <UsersView user={user} />;
    if (activeRoute === '/admin/roles') return <RolesView />;
    if (activeRoute.startsWith('/services')) {
      return <ServiceModule route={activeRoute} user={user} navigate={setActiveRoute} />;
    }
    if (activeRoute === '/visitors' || activeRoute === '/visitors/new' || activeRoute in LIVE_VISITOR_FILTERS) {
      return (
        <LiveVisitorsView
          user={user}
          initialStatus={LIVE_VISITOR_FILTERS[activeRoute] ?? ''}
          openRegister={activeRoute === '/visitors/new'}
        />
      );
    }
    if (activeRoute === '/contractors/companies') {
      return (
        <LiveTableView
          title="Contractor companies"
          subtitle="Registered vendor companies and their work-order volume."
          path="/api/v1/contractors/companies"
          columns={[
            { key: 'vendorCode', label: 'Vendor code' },
            { key: 'name', label: 'Company' },
            { key: 'classification', label: 'Classification' },
            { key: 'safetyRating', label: 'Safety rating' },
            { key: 'insuranceExpiry', label: 'Insurance expiry', render: renderDate },
            { key: 'workOrders', label: 'Work orders' },
            { key: 'status', label: 'Status', render: renderStatus },
          ]}
        />
      );
    }
    if (activeRoute === '/customers/accounts') {
      return (
        <LiveTableView
          title="Customer accounts"
          subtitle="Customer organizations with visit and NDA defaults."
          path="/api/v1/customers/accounts"
          columns={[
            { key: 'accountCode', label: 'Account code' },
            { key: 'name', label: 'Customer' },
            { key: 'tier', label: 'Tier' },
            { key: 'classification', label: 'Classification' },
            { key: 'ndaRequired', label: 'NDA required', render: v => (v ? 'Yes' : 'No') },
            { key: 'status', label: 'Status', render: renderStatus },
          ]}
        />
      );
    }
    if (activeRoute === '/admin/audit') return <AuditLogView />;
    return null;
  };

  // Access control in the console mirrors the menu: a role only ever renders screens in its own menu
  // (search, shortcuts and links cannot reach others). The API enforces the same rules server-side.
  const allowedRoutes = new Set(visibleDomains.flatMap((d) => d.items.map((i) => i.route)));
  // The visitor, customer and contractor modules also open sub-screens from tabs inside the page; those are
  // reachable when the role sees that module's sample screens (live screens never take this path).
  const moduleOf = (route: string) => `/${route.split('/')[1] ?? ''}`;
  const tabbedModules = new Set(
    visibleDomains
      .filter((d) => ['visitors', 'customers', 'contractors'].includes(d.id) && (!session || d.preview || d.items.some((i) => (i as NavItem).sample)))
      .map((d) => moduleOf(d.items[0].route))
  );
  const routeAllowed =
    allowedRoutes.has(activeRoute) ||
    tabbedModules.has(moduleOf(activeRoute)) ||
    (!!session && activeRoute.startsWith('/services')) ||
    (!session && activeRoute === '/kiosk');

  const renderMainContent = () => {
    if (!selectedDetailItem && !routeAllowed) {
      return (
        <NoPermissionStateView
          requiredRoleOrCapability="This screen is not part of your role. Ask an administrator if you need access."
          onGoBack={() => goTo('/dashboard')}
        />
      );
    }
    if (demoUser && !selectedDetailItem && DEMO_SHARED_ROUTES.includes(activeRoute)) {
      return renderLiveContent(demoUser);
    }
    if (session && !selectedDetailItem) {
      const live = renderLiveContent(session.user);
      if (live) return live;
      return (
        <>
          <SampleDataNotice text="This module is not yet connected to live data; figures shown are sample data." />
          {renderModuleContent()}
        </>
      );
    }
    return renderModuleContent();
  };

  const renderModuleContent = () => {
    // If Detail Page is Active (Section 22)
    if (selectedDetailItem) {
      const it = selectedDetailItem.item;
      return (
        <EntityDetailPage
          entityId={it.id || 'TXN-001'}
          title={it.name || it.account || it.company || it.plate || it.item || 'Record Details'}
          subtitle={it.company || it.transporter || it.workOrder || it.purpose || undefined}
          status={it.status || 'active'}
          entityType={selectedDetailItem.entityType}
          onBack={() => setSelectedDetailItem(null)}
          overviewFields={[
            { label: 'Facility Context', value: activeSiteContext.siteName },
            { label: 'Primary Contact / Host', value: it.host || it.driver || it.technician || 'Vikram Mehta' },
            { label: 'Gate / Location', value: it.gate || activeSiteContext.gateName || 'Gate 1' },
            { label: 'Validity Period', value: it.time || it.expiry || 'Current Shift' },
          ]}
          timelineEvents={DEMO_TIMELINE_EVENTS}
          activityTrace={{
            activityId: `ACT-${it.id || '9021'}`,
            sourceTransactionId: it.id || 'TXN-001',
            activityType: 'TRANSPORT_MOBILITY',
            status: 'CAPTURED',
            mode: it.transportMode || it.mode || 'CAR (Diesel Sedan)',
            distanceKm: it.distanceKm || 42,
            provenance: it.provenance || 'SYSTEM_ESTIMATED',
            calculatedEmissions: '48.2 kg CO₂e (Scope 3 Cat 6)',
          }}
          documents={[
            { name: 'Government Photo Identification', status: 'approved', expiry: '2028-12-31', type: 'GOVT_KYC' },
            { name: 'Plant Safety Induction Certificate', status: 'approved', expiry: '2026-11-30', type: 'EHS_SAFETY' },
          ]}
          accessPermissions={[
            { zone: 'Administrative Lobby & Visitor Center', status: 'approved', gate: 'Turnstile A1', validUntil: '18:00 Today' },
            { zone: 'Main Production Line 1 & 2', status: 'approved', gate: 'Turnstile C1', validUntil: '18:00 Today' },
          ]}
          auditInfo={{
            createdBy: 'Receptionist Desk REC-01',
            createdAt: '2026-10-07 09:41 UTC',
            lastUpdatedBy: 'Plant Security Gate Guard #04',
            lastUpdatedAt: '2026-10-07 10:04 UTC',
            sourceTransaction: it.id || 'TXN-001',
            policyDecision: 'PERMITTED_BY_ABAC_POLICY',
          }}
        />
      );
    }

    // 1. Kiosk Terminal
    if (activeRoute === '/kiosk') {
      return <div className="tw"><KioskWelcomeView onExitKiosk={() => setActiveRoute('/dashboard')} /></div>;
    }

    // 2. Gate Lane Consoles
    if (activeRoute === '/gate' || activeRoute === '/gate/entry' || activeRoute === '/gate/exit') {
      return <div className="tw"><GateModeView /></div>;
    }

    // 3. Dashboards
    if (activeRoute === '/dashboard/operations') {
      return <OperationsDashboardView />;
    }
    if (activeRoute === '/dashboard/security') {
      return <SecurityDashboardView />;
    }
    if (activeRoute === '/dashboard') {
      return <ExecutiveDashboardView />;
    }

    // 4. Visitor Management Domain (Part 6 Complete Module)
    if (activeRoute.startsWith('/visitors')) {
      let subView: VisitorSubView = 'ALL';
      if (activeRoute === '/visitors/dashboard') subView = 'DASHBOARD';
      else if (activeRoute === '/visitors/new') subView = 'NEW';
      else if (activeRoute === '/visitors/repeated') subView = 'REPEATED';
      else if (activeRoute === '/visitors/walk-in') subView = 'WALK_IN';
      else if (activeRoute === '/visitors/group') subView = 'GROUP';
      else if (activeRoute === '/visitors/vip') subView = 'VIP';
      else if (activeRoute === '/visitors/appointments') subView = 'APPOINTMENTS';
      else if (activeRoute === '/visitors/expected') subView = 'EXPECTED';
      else if (activeRoute === '/visitors/inside') subView = 'INSIDE';
      else if (activeRoute === '/visitors/approvals') subView = 'APPROVALS';
      else if (activeRoute === '/visitors/verification-queue') subView = 'VERIFICATION_QUEUE';
      else if (activeRoute === '/visitors/overstays') subView = 'OVERSTAYS';
      else if (activeRoute === '/visitors/completed') subView = 'COMPLETED';
      else if (activeRoute === '/visitors/cancelled') subView = 'CANCELLED';
      else if (activeRoute === '/visitors/history') subView = 'HISTORY';
      else if (activeRoute === '/visitors/profiles') subView = 'PROFILES';
      else if (activeRoute === '/visitors/traceability') subView = 'TRACEABILITY';
      else subView = 'ALL';

      return (
        <div className="tw">
        <VisitorManagementView
          initialSubView={subView}
          currentRole={activeRole}
          onNavigateSubView={(nextSub) => {
            const subToRoute: Record<VisitorSubView, string> = {
              DASHBOARD: '/visitors/dashboard',
              ALL: '/visitors',
              NEW: '/visitors/new',
              REPEATED: '/visitors/repeated',
              WALK_IN: '/visitors/walk-in',
              GROUP: '/visitors/group',
              VIP: '/visitors/vip',
              APPOINTMENTS: '/visitors/appointments',
              EXPECTED: '/visitors/expected',
              INSIDE: '/visitors/inside',
              APPROVALS: '/visitors/approvals',
              VERIFICATION_QUEUE: '/visitors/verification-queue',
              OVERSTAYS: '/visitors/overstays',
              COMPLETED: '/visitors/completed',
              CANCELLED: '/visitors/cancelled',
              HISTORY: '/visitors/history',
              PROFILES: '/visitors/profiles',
              TRACEABILITY: '/visitors/traceability',
            };
            setActiveRoute(subToRoute[nextSub] || '/visitors');
          }}
        />
        </div>
      );
    }

    // 6. Customer Management Domain (Part 7 Complete Module)
    if (activeRoute.startsWith('/customers')) {
      let subView: CustomerSubView = 'DASHBOARD';
      if (activeRoute === '/customers/accounts') subView = 'ACCOUNTS';
      else if (activeRoute === '/customers/representatives') subView = 'REPRESENTATIVES';
      else if (activeRoute === '/customers/visits') subView = 'VISITS';
      else if (activeRoute === '/customers/new') subView = 'NEW';
      else if (activeRoute === '/customers/meetings') subView = 'MEETINGS';
      else if (activeRoute === '/customers/audits') subView = 'AUDITS';
      else if (activeRoute === '/customers/inspections') subView = 'INSPECTIONS';
      else if (activeRoute === '/customers/quality') subView = 'QUALITY';
      else if (activeRoute === '/customers/technical') subView = 'TECHNICAL';
      else if (activeRoute === '/customers/plant') subView = 'PLANT';
      else if (activeRoute === '/customers/delegations') subView = 'DELEGATIONS';
      else if (activeRoute === '/customers/expected') subView = 'EXPECTED';
      else if (activeRoute === '/customers/inside') subView = 'INSIDE';
      else if (activeRoute === '/customers/approvals') subView = 'APPROVALS';
      else if (activeRoute === '/customers/nda') subView = 'NDA';
      else if (activeRoute === '/customers/exceptions') subView = 'EXCEPTIONS';
      else if (activeRoute === '/customers/completed') subView = 'COMPLETED';
      else if (activeRoute === '/customers/cancelled') subView = 'CANCELLED';
      else if (activeRoute === '/customers/history') subView = 'HISTORY';
      else if (activeRoute === '/customers/traceability') subView = 'TRACEABILITY';
      else subView = 'DASHBOARD';

      return (
        <div className="tw">
        <CustomerManagementView
          initialSubView={subView}
          currentRole={activeRole}
          siteId={activeSiteContext.siteId}
          onNavigateSubView={(nextSub) => {
            const subToRoute: Record<CustomerSubView, string> = {
              DASHBOARD: '/customers',
              ACCOUNTS: '/customers/accounts',
              REPRESENTATIVES: '/customers/representatives',
              VISITS: '/customers/visits',
              NEW: '/customers/new',
              MEETINGS: '/customers/meetings',
              AUDITS: '/customers/audits',
              INSPECTIONS: '/customers/inspections',
              QUALITY: '/customers/quality',
              TECHNICAL: '/customers/technical',
              PLANT: '/customers/plant',
              DELEGATIONS: '/customers/delegations',
              EXPECTED: '/customers/expected',
              INSIDE: '/customers/inside',
              APPROVALS: '/customers/approvals',
              NDA: '/customers/nda',
              EXCEPTIONS: '/customers/exceptions',
              COMPLETED: '/customers/completed',
              CANCELLED: '/customers/cancelled',
              HISTORY: '/customers/history',
              TRACEABILITY: '/customers/traceability',
            };
            setActiveRoute(subToRoute[nextSub] || '/customers');
          }}
        />
        </div>
      );
    }

    // 7. Contractor Domain Routes (/contractors*)
    if (activeRoute.startsWith('/contractors')) {
      let subView: ContractorSubView = 'DASHBOARD';
      if (activeRoute === '/contractors/companies') subView = 'COMPANIES';
      else if (activeRoute === '/contractors/contracts') subView = 'CONTRACTS';
      else if (activeRoute === '/contractors/work-orders') subView = 'WORK_ORDERS';
      else if (activeRoute === '/contractors/workers') subView = 'WORKER_DIRECTORY';
      else if (activeRoute === '/contractors/returning') subView = 'RETURNING_WORKERS';
      else if (activeRoute === '/contractors/assignments') subView = 'ASSIGNMENTS';
      else if (activeRoute === '/contractors/compliance') subView = 'COMPLIANCE';
      else if (activeRoute === '/contractors/documents') subView = 'DOCUMENT_VERIFICATION';
      else if (activeRoute === '/contractors/training') subView = 'TRAINING_RECORDS';
      else if (activeRoute === '/contractors/inductions') subView = 'SAFETY_INDUCTION';
      else if (activeRoute === '/contractors/qualifications') subView = 'QUALIFICATIONS';
      else if (activeRoute === '/contractors/medical') subView = 'FITNESS_MEDICAL';
      else if (activeRoute === '/contractors/permits') subView = 'PERMITS';
      else if (activeRoute === '/contractors/inside') subView = 'CURRENTLY_ON_SITE';
      else if (activeRoute === '/contractors/attendance') subView = 'DAILY_ATTENDANCE';
      else if (activeRoute === '/contractors/expected') subView = 'EXPECTED_WORKFORCE';
      else if (activeRoute === '/contractors/approvals') subView = 'PENDING_APPROVALS';
      else if (activeRoute === '/contractors/expiring') subView = 'EXPIRING_DOCUMENTS';
      else if (activeRoute === '/contractors/restricted') subView = 'RESTRICTED_WORKERS';
      else if (activeRoute === '/contractors/transport') subView = 'CONTRACTOR_TRANSPORT';
      else if (activeRoute === '/contractors/traceability') subView = 'ESG_TRACEABILITY';
      else if (activeRoute === '/contractors/history') subView = 'CONTRACTOR_HISTORY';
      else if (activeRoute === '/contractors/exceptions') subView = 'EXCEPTIONS';
      else if (activeRoute === '/contractors/reports') subView = 'REPORTS';
      else subView = 'DASHBOARD';

      return (
        <ContractorManagementView
          initialSubView={subView}
          currentRole={activeRole}
          siteId={activeSiteContext.siteId}
          onNavigateSubView={(nextSub) => {
            const subToRoute: Record<ContractorSubView, string> = {
              DASHBOARD: '/contractors',
              COMPANIES: '/contractors/companies',
              COMPANY_REGISTRATION: '/contractors/companies',
              COMPANY_PROFILE: '/contractors/companies',
              CONTRACTS: '/contractors/contracts',
              WORK_ORDERS: '/contractors/work-orders',
              WORKER_DIRECTORY: '/contractors/workers',
              NEW_WORKER: '/contractors/workers',
              RETURNING_WORKERS: '/contractors/returning',
              WORKER_PROFILE: '/contractors/workers',
              ASSIGNMENTS: '/contractors/assignments',
              COMPLIANCE: '/contractors/compliance',
              DOCUMENT_VERIFICATION: '/contractors/documents',
              TRAINING_RECORDS: '/contractors/training',
              SAFETY_INDUCTION: '/contractors/inductions',
              QUALIFICATIONS: '/contractors/qualifications',
              FITNESS_MEDICAL: '/contractors/medical',
              PERMITS: '/contractors/permits',
              ATTENDANCE: '/contractors/attendance',
              DAILY_ATTENDANCE: '/contractors/attendance',
              CURRENTLY_ON_SITE: '/contractors/inside',
              EXPECTED_WORKFORCE: '/contractors/expected',
              PENDING_APPROVALS: '/contractors/approvals',
              EXPIRING_DOCUMENTS: '/contractors/expiring',
              RESTRICTED_WORKERS: '/contractors/restricted',
              CONTRACTOR_TRANSPORT: '/contractors/transport',
              ESG_TRACEABILITY: '/contractors/traceability',
              CONTRACTOR_HISTORY: '/contractors/history',
              EXCEPTIONS: '/contractors/exceptions',
              REPORTS: '/contractors/reports',
              CONTRACTOR_ATTENDANCE: '/contractors/attendance',
              WORKER_ASSIGNMENTS: '/contractors/assignments',
            };
            setActiveRoute(subToRoute[nextSub] || '/contractors');
          }}
        />
      );
    }

    // 8. Service / Work Routes (/services*)
    if (activeRoute.startsWith('/services')) {
      return (
        <GenericDomainListView
          domainTitle="Service & Maintenance Management"
          domainDescription="OEM technician tickets, machine maintenance work orders, and hazardous permits"
          data={DEMO_SERVICES}
          columns={serviceColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'CONTRACTOR' })}
          requiredCapability="SERVICE_READ"
        />
      );
    }

    // 9. Material Logistics Routes (/materials*)
    if (activeRoute.startsWith('/materials')) {
      return (
        <GenericDomainListView
          domainTitle="Material Logistics & Weighbridge Passes"
          domainDescription="Delivery challans, weighbridge inward/outward passes, scrap dispatch, and returnable escrows"
          data={DEMO_MATERIALS}
          columns={materialColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'MATERIAL' })}
          requiredCapability="MATERIAL_READ"
        />
      );
    }

    // 10. Vehicle Domain Routes (/vehicles*)
    if (activeRoute.startsWith('/vehicles')) {
      return (
        <GenericDomainListView
          domainTitle="Commercial Vehicle Hub"
          domainDescription="Commercial freight fleet, driver license validation, breathalyzer logs, and transporter registry"
          data={DEMO_VEHICLES}
          columns={vehicleColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'VEHICLE' })}
          requiredCapability="VEHICLE_READ"
        />
      );
    }

    // 11. Transport Mobility Routes (/transport*)
    if (activeRoute.startsWith('/transport')) {
      return (
        <GenericDomainListView
          domainTitle="Transport & Mobility Ledger"
          domainDescription="Normalized multi-modal commuter journeys, vehicle activities, and source-linked trips"
          data={DEMO_ESG_RECORDS}
          columns={esgColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'VEHICLE' })}
          requiredCapability="TRANSPORT_READ"
        />
      );
    }

    // 12. Gate Subroutes (/gate/exceptions, /gate/passes, /gate/overstay)
    if (activeRoute.startsWith('/gate/')) {
      return (
        <GenericDomainListView
          domainTitle="Gate Passes & Exception Ledger"
          domainDescription="Active gate passes, overstay queues, and denied entry audit trails"
          data={DEMO_MATERIALS}
          columns={materialColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' })}
          requiredCapability="GATE_READ"
        />
      );
    }

    // 13. Access Domain Routes (/access*)
    if (activeRoute.startsWith('/access')) {
      return (
        <GenericDomainListView
          domainTitle="Physical Access Governance"
          domainDescription="Turnstiles, UHF RFID readers, zone access matrices, and biometric credentials"
          data={DEMO_ACCESS_POINTS}
          columns={accessColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' })}
          requiredCapability="ACCESS_READ"
        />
      );
    }

    // 14. Document Domain Routes (/documents*)
    if (activeRoute.startsWith('/documents')) {
      return (
        <GenericDomainListView
          domainTitle="Document Verification Vault"
          domainDescription="Government KYC, Non-Disclosure Agreements, insurance policies, and expiring licenses"
          data={DEMO_DOCUMENTS}
          columns={documentColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' })}
          requiredCapability="DOCUMENT_READ"
        />
      );
    }

    // 15. Safety Domain Routes (/safety*)
    if (activeRoute.startsWith('/safety')) {
      return (
        <GenericDomainListView
          domainTitle="EHS Safety & Permits (PTW)"
          domainDescription="Mandatory safety inductions, hot work permits, height permits, and PPE checklists"
          data={DEMO_SAFETY}
          columns={[
            { key: 'id', header: 'Reference', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
            { key: 'inductionType', header: 'Induction / Permit Name', render: (r) => <strong>{r.inductionType || r.permitType}</strong> },
            { key: 'passingScore', header: 'Criteria' },
            { key: 'validityMonths', header: 'Validity (Months)', align: 'center' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
          ]}
          requiredCapability="SAFETY_READ"
        />
      );
    }

    // 16. Emergency Domain Routes (/emergency*)
    if (activeRoute.startsWith('/emergency')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Banner
            type="emergency"
            title="EMERGENCY MUSTER CONSOLE"
            message="Live site population and muster station headcounts active."
            actionLabel="Open Full Muster Console"
            onAction={() => setIsEmergencyModalOpen(true)}
            isPersistent
          />
          <OperationsDashboardView />
        </div>
      );
    }

    // 17. ESG & GHG Domain Routes (/esg*)
    if (activeRoute.startsWith('/esg')) {
      return (
        <GenericDomainListView
          domainTitle="ESG / GHG Activity Ledger"
          domainDescription="Source-linked mobility and logistics activity automatically captured from operational transactions"
          data={DEMO_ESG_RECORDS}
          columns={esgColumns}
          onOpenDetail={(item) => setSelectedDetailItem({ item, entityType: 'VISITOR' })}
          requiredCapability="ESG_ACTIVITY_READ"
        />
      );
    }

    // 18. Analytics BI Routes (/analytics*)
    if (activeRoute.startsWith('/analytics')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>
                Operational & ESG Analytics
              </h2>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                Throughput BI, Turnstile Heatmaps, Contractor Compliance SLA, and Carbon Disclosures
              </span>
            </div>
          </div>
          <ExecutiveDashboardView />
        </div>
      );
    }

    // 19. AI Copilot Route (/ai)
    if (activeRoute === '/ai') {
      return (
        <Card title="Industrial Operations AI Copilot" subtitle="Natural language query engine grounded in facility telemetry">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#8b5cf6" />
              <div>
                <strong style={{ fontSize: typography.fontSize.sm.size, color: '#581c87' }}>Operational Copilot Ready</strong>
                <div style={{ fontSize: typography.fontSize.xs.size, color: '#7e22ce' }}>
                  Ask questions like: "Which contractors exceeded authorized headcount today?" or "Summarize Scope 3 diesel freight emissions this week."
                </div>
              </div>
            </div>
            <AiCopilotPrompt />
          </div>
        </Card>
      );
    }

    // 20. Task Center (/tasks*)
    if (activeRoute.startsWith('/tasks')) {
      const taskTabs: Record<string, 'MY_PENDING' | 'DELEGATED' | 'OVERDUE' | 'COMPLETED'> = {
        '/tasks': 'MY_PENDING',
        '/tasks/delegated': 'DELEGATED',
        '/tasks/overdue': 'OVERDUE',
        '/tasks/history': 'COMPLETED',
      };
      return <TaskCenterView userRole={activeRole} initialTab={taskTabs[activeRoute] ?? 'MY_PENDING'} />;
    }

    // 21. Specific Enterprise Admin Workspaces (Part 5)
    if (activeRoute === '/admin/master-data') {
      return <MasterDataView userRole={activeRole} />;
    }
    if (activeRoute === '/admin/workflows') {
      return <WorkflowBuilderView userRole={activeRole} />;
    }
    if (activeRoute === '/admin/rules') {
      return <RulesEngineView />;
    }

    // 22. General Administration Routes (/admin*)
    if (activeRoute.startsWith('/admin')) {
      return (
        activeRoute === '/admin/audit' ? (
          <GenericDomainListView
            domainTitle="Audit Logs"
            domainDescription="Append-only record of sign-ins and state changes"
            data={DEMO_AUDIT_EVENTS}
            columns={[
              { key: 'time', header: 'Time', width: '160px' },
              { key: 'action', header: 'Action', render: (r) => <strong>{r.action}</strong> },
              { key: 'actor', header: 'Actor' },
              { key: 'entity', header: 'Entity' },
              { key: 'status', header: 'Result', render: (r) => <StatusBadge status={r.status} size="sm" /> },
            ]}
            requiredCapability="AUDIT_LOG_READ"
          />
        ) : (
        <GenericDomainListView
          domainTitle="Sites & Facilities"
          domainDescription="Facility sites with their gates and zones"
          data={[
            { id: 'ADM-01', name: 'Chennai Radial Tyre Plant', type: 'MANUFACTURING_PLANT', gatesCount: 3, zonesCount: 8, status: 'active' },
            { id: 'ADM-02', name: 'Pune Stamping & Assembly Plant', type: 'MANUFACTURING_PLANT', gatesCount: 2, zonesCount: 6, status: 'active' },
            { id: 'ADM-03', name: 'Jamshedpur Heavy Logistics Complex', type: 'LOGISTICS_HUB', gatesCount: 4, zonesCount: 5, status: 'active' },
          ]}
          columns={[
            { key: 'id', header: 'Facility Code', width: '130px', sortable: true, render: (r) => <span style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>{r.id}</span> },
            { key: 'name', header: 'Site Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'type', header: 'Facility Classification' },
            { key: 'gatesCount', header: 'Active Gates', align: 'center' },
            { key: 'zonesCount', header: 'Security Zones', align: 'center' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
          ]}
          requiredCapability="SYSTEM_ADMIN_MANAGE"
        />
        )
      );
    }

    // Default fallback
    return <ExecutiveDashboardView />;
  };

  // The kiosk is a visitor-facing terminal: full screen, without the operator shell around it.
  if (activeRoute === '/kiosk' && !selectedDetailItem && routeAllowed) {
    return (
      <div className="tw" style={{ minHeight: '100vh', backgroundColor: colors.slate[50] }}>
        <KioskWelcomeView onExitKiosk={() => setActiveRoute('/dashboard')} />
        <ToastHost />
      </div>
    );
  }

  const roleLabel = (r: string) => r.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const shellGroups: ShellNavGroup[] = visibleDomains.map((d) => ({
    id: d.id,
    label: d.label,
    icon: d.icon,
    preview: d.preview,
    items: d.items as ShellNavItem[],
  }));
  // Search opens a palette of the screens this user can reach (plus demo shortcuts in the demo).
  const navCommands = shellGroups.flatMap((g) =>
    g.items.map((i) => ({
      id: `nav-${i.route}`,
      category: 'NAVIGATION' as const,
      title: i.label,
      subtitle: `${g.label}${i.sample || g.preview ? ' · sample data' : ''}`,
      icon: g.icon,
      onSelect: () => goTo(i.route),
    }))
  );
  const switcherSites = (session ? liveSites : DEMO_SITES).map((s) => ({ siteId: s.siteId, siteName: s.siteName }));
  const shellUser = session
    ? { name: session.user.fullName, roleLabel: roleLabel(session.user.role), detail: session.user.email ?? session.user.username }
    : { name: demo?.name ?? 'Demo user', roleLabel: `${roleLabel(activeRole)} · demo`, detail: 'Demo account · sample data only' };
  const userActions: ShellMenuAction[] = session
    ? [
        { label: 'Change password', icon: menuIcons.password, onSelect: session.onChangePassword },
        { label: 'Sign out', icon: menuIcons.signOut, onSelect: session.onSignOut, tone: 'danger' },
      ]
    : [{ label: 'Sign out of demo', icon: menuIcons.signOut, onSelect: () => demo?.onSignOut(), tone: 'danger' }];

  return (
    <>
      <AppShell
        groups={shellGroups}
        activeRoute={activeRoute}
        onNavigate={goTo}
        breadcrumbs={breadcrumbs}
        organizationName={session ? session.user.organizationName || 'Your organization' : activeSiteContext.organizationName}
        user={shellUser}
        userActions={userActions}
        onSearch={() => (session ? setIsCommandPaletteOpen(true) : setIsGlobalSearchOpen(true))}
        banner={
          isEmergencyActive ? (
            <Banner
              type="emergency"
              title="Emergency muster active (demo)"
              message={`Evacuation drill in progress at ${activeSiteContext.siteName}. Turnstiles unlocked for exit.`}
              actionLabel="Open muster board"
              onAction={() => setIsEmergencyModalOpen(true)}
              isPersistent
            />
          ) : undefined
        }
        topbarRight={
          <>
            <SiteSwitcher
              sites={switcherSites}
              currentSiteId={activeSiteContext.siteId}
              onSelect={(siteId) => {
                const next = (session ? liveSites : DEMO_SITES).find((s) => s.siteId === siteId);
                if (next) setActiveSiteContext(next);
              }}
            />
            {/* Demo-only simulations: emergency drill and sample notifications. */}
            {!session && (
              <>
                <button
                  type="button"
                  title={isEmergencyActive ? 'End emergency drill' : 'Start emergency drill'}
                  aria-label={isEmergencyActive ? 'End emergency drill' : 'Start emergency drill'}
                  onClick={() => {
                    setIsEmergencyActive(!isEmergencyActive);
                    if (!isEmergencyActive) setIsEmergencyModalOpen(true);
                  }}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: radius.lg,
                    cursor: 'pointer',
                    border: `1px solid ${isEmergencyActive ? colors.status.danger.solid : colors.slate[200]}`,
                    backgroundColor: isEmergencyActive ? colors.status.danger.solid : '#ffffff',
                  }}
                >
                  <AlertOctagon size={16} color={isEmergencyActive ? '#ffffff' : colors.status.danger.solid} />
                </button>
                <NotificationCenter notifications={DEMO_NOTIFICATIONS} onNavigate={(url) => goTo(url)} />
              </>
            )}
          </>
        }
      >
        {!session && (
          <SampleDataNotice text="Demo environment: every screen shows sample data. Sign in to your organization's server to work with real records." />
        )}
        {renderMainContent()}
      </AppShell>

      <ToastHost />

      {/* 4. MODALS & GLOBAL PALETTES */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={session ? navCommands : [
          {
            id: 'cmd-create-visitor',
            category: 'ACTIONS',
            title: 'New Visitor Pre-Registration',
            subtitle: 'Schedule appointment with host, transport vectors & ESG capture',
            icon: <UserPlus size={16} color={colors.primary[600]} />,
            shortcut: 'V',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/new');
            },
          },
          {
            id: 'cmd-walkin-visitor',
            category: 'ACTIONS',
            title: 'Gate Walk-In Registration (<60s Flow)',
            subtitle: 'Rapid security desk check-in with badge printing',
            icon: <Users size={16} color={colors.primary[600]} />,
            shortcut: 'W',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/walk-in');
            },
          },
          {
            id: 'cmd-expected-visitors',
            category: 'ACTIONS',
            title: 'Expected Visitors Today',
            subtitle: 'View scheduled arrivals and expedited QR check-in roster',
            icon: <CheckCircle2 size={16} color={colors.primary[600]} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/expected');
            },
          },
          {
            id: 'cmd-inside-visitors',
            category: 'ACTIONS',
            title: 'Currently On Premises (Active Visitors)',
            subtitle: 'Live plant floor occupancy and badge verification',
            icon: <Users size={16} color={colors.status.success.solid} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/inside');
            },
          },
          {
            id: 'cmd-group-visitor',
            category: 'ACTIONS',
            title: 'Group Delegation Intake',
            subtitle: 'Bulk roster intake with single transport attribution',
            icon: <Users size={16} color={colors.primary[600]} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/group');
            },
          },
          {
            id: 'cmd-vip-visitor',
            category: 'ACTIONS',
            title: 'VIP Protocol Visitor Intake',
            subtitle: 'Executive escort, private zone & priority gate pass',
            icon: <CheckCircle2 size={16} color="#d97706" />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/vip');
            },
          },
          {
            id: 'cmd-overstay-queue',
            category: 'ACTIONS',
            title: 'View Overstay Exception Queue',
            subtitle: 'Breached visit windows and active security warnings',
            icon: <AlertOctagon size={16} color={colors.status.danger.solid} />,
            shortcut: 'O',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/overstays');
            },
          },
          {
            id: 'cmd-esg-traceability',
            category: 'ACTIONS',
            title: 'Visitor ESG Traceability Ledger',
            subtitle: 'Bidirectional audit trail: Transaction → Activity → GHG record',
            icon: <Leaf size={16} color={colors.esg[600]} />,
            shortcut: 'E',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/visitors/traceability');
            },
          },
          {
            id: 'cmd-create-customer-visit',
            category: 'ACTIONS',
            title: 'New Customer Visit / Audit Intake',
            subtitle: 'Schedule OEM audit, delegation or plant meeting with NDA & mobility',
            icon: <Handshake size={16} color={colors.primary[600]} />,
            shortcut: 'C',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/customers/new');
            },
          },
          {
            id: 'cmd-customer-audits',
            category: 'ACTIONS',
            title: 'Customer Quality & Process Audits',
            subtitle: 'View upcoming external quality audits, lead auditors & compliance',
            icon: <FileCheck size={16} color={colors.primary[600]} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/customers/audits');
            },
          },
          {
            id: 'cmd-customer-delegations',
            category: 'ACTIONS',
            title: 'Customer Delegations Roster',
            subtitle: 'Multi-representative delegations with shared group transport',
            icon: <Users size={16} color={colors.primary[600]} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/customers/delegations');
            },
          },
          {
            id: 'cmd-customer-nda',
            category: 'ACTIONS',
            title: 'Customer NDA & Legal Compliance Vault',
            subtitle: 'Verify active non-disclosure agreements, photo policies & escorts',
            icon: <Shield size={16} color="#d97706" />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/customers/nda');
            },
          },
          {
            id: 'cmd-contractor-company',
            category: 'ACTIONS',
            title: 'Register Contractor Company',
            subtitle: 'Onboard vendor organization, master service agreement & safety rating',
            icon: <Building2 size={16} color={colors.primary[600]} />,
            shortcut: 'C',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/companies');
            },
          },
          {
            id: 'cmd-contractor-worker',
            category: 'ACTIONS',
            title: 'Register Contractor Worker',
            subtitle: 'Onboard personnel with canonical person matching & badge allocation',
            icon: <HardHat size={16} color={colors.primary[600]} />,
            shortcut: 'K',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/workers');
            },
          },
          {
            id: 'cmd-contractor-work-orders',
            category: 'ACTIONS',
            title: 'Contractor Work Orders & Scopes',
            subtitle: 'Authorized work orders, location permits & headcount capacity caps',
            icon: <Wrench size={16} color={colors.primary[600]} />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/work-orders');
            },
          },
          {
            id: 'cmd-contractor-attendance',
            category: 'ACTIONS',
            title: 'Contractor Daily Attendance & Turnstile Gate',
            subtitle: 'Live turnstile check-in, presence ledger & manual corrections',
            icon: <CheckCircle2 size={16} color="#059669" />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/attendance');
            },
          },
          {
            id: 'cmd-contractor-compliance',
            category: 'ACTIONS',
            title: 'Contractor Compliance & Safety Inductions',
            subtitle: 'Trade licenses, EHS induction passports, medical fitness & PTW prerequisites',
            icon: <FileCheck size={16} color="#d97706" />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/compliance');
            },
          },
          {
            id: 'cmd-contractor-transport',
            category: 'ACTIONS',
            title: 'Contractor Commuter Mobility & Scope 3 Cat 7',
            subtitle: 'Shuttle buses, commuter journeys & zero-blocker carbon traceability',
            icon: <Leaf size={16} color="#059669" />,
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/contractors/transport');
            },
          },
          {
            id: 'cmd-open-gate',
            category: 'NAVIGATION',
            title: 'Open Industrial Gate Console (Gate Mode)',
            subtitle: 'Direct high-contrast lane fast scan terminal',
            icon: <Shield size={16} color={colors.primary[600]} />,
            shortcut: 'G',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/gate');
            },
          },
          {
            id: 'cmd-view-approvals',
            category: 'NAVIGATION',
            title: 'View Pending Approvals Queue',
            subtitle: 'Host, Safety PTW and Gate exemptions',
            icon: <CheckCircle2 size={16} color={colors.status.warning.solid} />,
            shortcut: 'A',
            onSelect: () => {
              setSelectedDetailItem(null);
              setActiveRoute('/tasks');
            },
          },
          {
            id: 'cmd-emergency-dashboard',
            category: 'EMERGENCY',
            title: 'Trigger Emergency Muster Dashboard',
            subtitle: 'Live plant headcount and roll-call status',
            icon: <Flame size={16} color={colors.status.danger.solid} />,
            shortcut: '!',
            onSelect: () => {
              setIsEmergencyModalOpen(true);
            },
          },
          ...navCommands,
        ]}
        onNavigate={(path) => {
          setSelectedDetailItem(null);
          setActiveRoute(path);
        }}
      />

      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectResult={(res) => {
          if (res.route) {
            setSelectedDetailItem(null);
            setActiveRoute(res.route);
          }
        }}
      />

      <EmergencyModalView
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        isSirenActive={isSirenActive}
        onToggleSiren={() => setIsSirenActive(!isSirenActive)}
      />
    </>
  );
};

const SampleDataNotice: React.FC<{ text: string }> = ({ text }) => (
  <div
    role="note"
    style={{
      fontSize: '12px',
      color: colors.status.warning.fg,
      backgroundColor: colors.status.warning.bg,
      border: `1px solid ${colors.status.warning.border}`,
      borderRadius: radius.md,
      padding: '8px 12px',
      marginBottom: '12px',
    }}
  >
    {text}
  </div>
);
