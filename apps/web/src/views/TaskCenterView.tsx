import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  FileQuestion,
  UserPlus,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Shield,
  X,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card, StatusBadge,
  showToast,
} from '@vms/ui';
import type { WorkflowDomain, EnterpriseRole } from '@vms/types';
import type { TaskItemView } from '../../../../services/workflow/src/task/task-center.service.js';

export type TaskCenterTab = 'MY_PENDING' | 'ASSIGNED_TO_ME' | 'DELEGATED' | 'WAITING_OTHERS' | 'OVERDUE' | 'ESCALATED' | 'COMPLETED';

export interface TaskCenterViewProps {
  /** Tab opened by the menu item (Pending approvals, Delegated, Overdue, Completed history). */
  initialTab?: TaskCenterTab;
  userRole?: EnterpriseRole;
  userId?: string;
  tenantId?: string;
}

// Initial mock task items for interactive Task Center
const INITIAL_TASKS: TaskItemView[] = [
  {
    taskId: 'tsk-001',
    instanceId: 'inst-101',
    sourceDomain: 'VISITOR',
    sourceTransactionId: 'VIS-9401',
    siteId: 'site-chennai-01',
    requesterName: 'Dr. Evelyn Reed (Siemens Healthineers)',
    stageName: 'Designated Host Approval',
    assignedApprover: 'Vikram Mehta (Plant Operations Lead)',
    submittedAt: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
    slaDueAt: new Date(Date.now() + 85 * 60 * 1000), // due in 85 min
    slaStatus: 'ON_TIME',
    status: 'PENDING',
    availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
    sanitizedDetails: {
      visitorType: 'VIP_GUEST',
      purpose: 'Technical OEM Plant Acceptance Audit',
      scheduledDate: '2026-10-12',
      escortRequired: true,
      mobilityMode: 'CAR (Electric SUV)',
    },
  },
  {
    taskId: 'tsk-002',
    instanceId: 'inst-102',
    sourceDomain: 'CONTRACTOR',
    sourceTransactionId: 'CONT-8812',
    siteId: 'site-chennai-01',
    requesterName: 'Larsen & Toubro Heavy Civil',
    stageName: 'EHS Safety Officer Sign-Off',
    assignedApprover: 'EHS_MANAGER',
    submittedAt: new Date(Date.now() - 110 * 60 * 1000), // 110 min ago
    slaDueAt: new Date(Date.now() - 10 * 60 * 1000), // Breached 10 min ago
    slaStatus: 'OVERDUE',
    status: 'ESCALATED',
    availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED'],
    sanitizedDetails: {
      workOrder: 'WO-2026-LNT-041 (Structural Foundation Retrofit)',
      workersCount: 14,
      safetyInductionComplete: true,
      ptwType: 'PTW_HOT_WORK_LEVEL_3',
    },
  },
  {
    taskId: 'tsk-003',
    instanceId: 'inst-103',
    sourceDomain: 'MATERIAL',
    sourceTransactionId: 'MAT-7731',
    siteId: 'site-chennai-01',
    requesterName: 'Tata Steel Logistics',
    stageName: 'Material Store Manager Clearance',
    assignedApprover: 'Storekeeper / Org Admin',
    submittedAt: new Date(Date.now() - 45 * 60 * 1000),
    slaDueAt: new Date(Date.now() + 15 * 60 * 1000), // Warning zone
    slaStatus: 'WARNING',
    status: 'PENDING',
    availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
    sanitizedDetails: {
      challanNumber: 'DC-99201-TATA',
      movement: 'INWARD',
      classification: 'RETURNABLE_CONTAINERS',
      grossWeightKg: 18500,
    },
  },
  {
    taskId: 'tsk-004',
    instanceId: 'inst-104',
    sourceDomain: 'CUSTOMER',
    sourceTransactionId: 'CUST-3310',
    siteId: 'site-pune-01',
    requesterName: 'Daimler Truck Global Delegation',
    stageName: 'Plant Director / Security Clearance',
    assignedApprover: 'SITE_ADMIN',
    submittedAt: new Date(Date.now() - 15 * 60 * 1000),
    slaDueAt: new Date(Date.now() + 165 * 60 * 1000),
    slaStatus: 'ON_TIME',
    status: 'PENDING',
    availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
    sanitizedDetails: {
      account: 'Daimler India Commercial Vehicles',
      delegationSize: 5,
      ndaSigned: true,
      visitWindow: '2026-10-15 to 2026-10-16',
    },
  },
  {
    taskId: 'tsk-005',
    instanceId: 'inst-105',
    sourceDomain: 'SERVICE',
    sourceTransactionId: 'SRV-5521',
    siteId: 'site-chennai-01',
    requesterName: 'Atlas Copco Air Power',
    stageName: 'Maintenance Lead & Site Manager Approval',
    assignedApprover: 'Delegated to Proxy (EHS Manager)',
    submittedAt: new Date(Date.now() - 60 * 60 * 1000),
    slaDueAt: new Date(Date.now() + 60 * 60 * 1000),
    slaStatus: 'ON_TIME',
    status: 'PENDING',
    availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED'],
    sanitizedDetails: {
      equipmentTag: 'COMPRESSOR-MAIN-02',
      serviceType: 'OEM_BREAKDOWN_PREVENTIVE',
      technician: 'Ramesh Sundaram (OEM Certified)',
      lotoPermitAttached: true,
    },
  },
];

export const TaskCenterView: React.FC<TaskCenterViewProps> = ({
  initialTab = 'MY_PENDING',
  userRole = 'SUPER_ADMIN',
  userId = 'user-01',
}) => {
  // Navigation tab state (follows the menu item that opened the view)
  const [activeTab, setActiveTab] = useState<TaskCenterTab>(initialTab);
  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItemView[]>(INITIAL_TASKS);

  // Modals state
  const [activeActionModal, setActiveActionModal] = useState<{
    task: TaskItemView;
    action: 'APPROVE' | 'REJECT' | 'CHANGES_REQUESTED' | 'DELEGATE';
  } | null>(null);

  const [remarksInput, setRemarksInput] = useState<string>('');
  const [delegateTargetInput, setDelegateTargetInput] = useState<string>('user-proxy-02');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskItemView | null>(null);

  // Tab counts
  const counts = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'PENDING' || t.status === 'ESCALATED').length,
      overdue: tasks.filter((t) => t.slaStatus === 'OVERDUE' || t.status === 'ESCALATED').length,
      delegated: tasks.filter((t) => t.assignedApprover.includes('Delegated')).length,
      escalated: tasks.filter((t) => t.status === 'ESCALATED').length,
      completed: tasks.filter((t) => t.status === 'APPROVED' || t.status === 'REJECTED').length,
    };
  }, [tasks]);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'MY_PENDING' || activeTab === 'ASSIGNED_TO_ME') {
        if (task.status !== 'PENDING' && task.status !== 'ESCALATED') return false;
      } else if (activeTab === 'DELEGATED') {
        if (!task.assignedApprover.includes('Delegated')) return false;
      } else if (activeTab === 'OVERDUE') {
        if (task.slaStatus !== 'OVERDUE' && task.status !== 'ESCALATED') return false;
      } else if (activeTab === 'ESCALATED') {
        if (task.status !== 'ESCALATED') return false;
      } else if (activeTab === 'COMPLETED') {
        if (task.status !== 'APPROVED' && task.status !== 'REJECTED') return false;
      }

      // Domain filter
      if (domainFilter !== 'ALL' && task.sourceDomain !== domainFilter) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchRef = task.sourceTransactionId.toLowerCase().includes(q);
        const matchReq = (task.requesterName || '').toLowerCase().includes(q);
        const matchStage = task.stageName.toLowerCase().includes(q);
        if (!matchRef && !matchReq && !matchStage) return false;
      }

      return true;
    });
  }, [tasks, activeTab, domainFilter, searchQuery]);

  // Execute decision
  const handleConfirmDecision = () => {
    if (!activeActionModal) return;
    const { task, action } = activeActionModal;

    if (action === 'REJECT' && !remarksInput.trim()) {
      showToast('Rejection remarks are required.', 'warning');
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.taskId !== task.taskId) return t;
        if (action === 'APPROVE') {
          return { ...t, status: 'APPROVED' };
        }
        if (action === 'REJECT') {
          return { ...t, status: 'REJECTED' };
        }
        if (action === 'CHANGES_REQUESTED') {
          return { ...t, status: 'CHANGES_REQUESTED' };
        }
        if (action === 'DELEGATE') {
          return { ...t, assignedApprover: `Delegated to ${delegateTargetInput}` };
        }
        return t;
      })
    );

    setActiveActionModal(null);
    setRemarksInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={24} color={colors.primary[600]} />
            <h1 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>
              Enterprise Task Center
            </h1>
          </div>
          <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
            Unified authorization queue across Visitor, Contractor, Customer, Service, and Material workflows
          </span>
        </div>

        {/* Quick KPI stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md }}>
            <Clock size={16} color={colors.primary[600]} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.slate[600] }}>Pending:</span>
            <strong style={{ fontSize: '12px', color: colors.slate[900] }}>{counts.pending}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: radius.md }}>
            <AlertTriangle size={16} color="#be123c" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9f1239' }}>Overdue:</span>
            <strong style={{ fontSize: '12px', color: '#be123c' }}>{counts.overdue}</strong>
          </div>
        </div>
      </div>

      {/* 2. Persona Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.slate[200]}`, gap: '4px', overflowX: 'auto', maxWidth: '100%', minWidth: 0 }}>
        {[
          { id: 'MY_PENDING', label: 'Pending Approvals', count: counts.pending, icon: <Clock size={14} /> },
          { id: 'DELEGATED', label: 'Delegated Tasks', count: counts.delegated, icon: <UserCheck size={14} /> },
          { id: 'OVERDUE', label: 'Overdue / Escalated', count: counts.overdue, icon: <AlertTriangle size={14} />, isAlert: counts.overdue > 0 },
          { id: 'COMPLETED', label: 'History / Completed', count: counts.completed, icon: <CheckCircle2 size={14} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                borderBottom: `2.5px solid ${isActive ? colors.primary[700] : 'transparent'}`,
                backgroundColor: 'transparent',
                color: isActive ? colors.primary[800] : colors.slate[600],
                fontSize: typography.fontSize.xs.size,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 100ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: tab.isAlert ? '#be123c' : isActive ? colors.primary[100] : colors.slate[100],
                  color: tab.isAlert ? '#ffffff' : isActive ? colors.primary[900] : colors.slate[700],
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search and Domain Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: colors.slate[400] }} />
            <input
              type="text"
              placeholder="Search reference, requester, or stage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                paddingLeft: '32px',
                paddingRight: '12px',
                border: `1px solid ${colors.slate[300]}`,
                borderRadius: radius.md,
                fontSize: typography.fontSize.xs.size,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: colors.slate[600] }}>Domain:</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            style={{
              height: '34px',
              padding: '0 8px',
              borderRadius: radius.md,
              border: `1px solid ${colors.slate[300]}`,
              backgroundColor: '#ffffff',
              fontSize: typography.fontSize.xs.size,
              outline: 'none',
            }}
          >
            <option value="ALL">All Domains</option>
            <option value="VISITOR">Visitor Management</option>
            <option value="CUSTOMER">Customer Audits</option>
            <option value="CONTRACTOR">Contractor Safety</option>
            <option value="SERVICE">Service & Maintenance</option>
            <option value="MATERIAL">Material Logistics</option>
          </select>

          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} displayed
          </span>
        </div>
      </div>

      {/* 4. Task Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '40px', textAlign: 'center', color: colors.slate[500] }}>
            <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
            <strong style={{ display: 'block', fontSize: typography.fontSize.sm.size, color: colors.slate[800] }}>
              All Caught Up!
            </strong>
            <span style={{ fontSize: '12px' }}>No pending approval tasks in this view matching criteria.</span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = task.slaStatus === 'OVERDUE';
            const isWarning = task.slaStatus === 'WARNING';
            const isResolved = task.status === 'APPROVED' || task.status === 'REJECTED';

            return (
              <div
                key={task.taskId}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${isOverdue ? '#fca5a5' : isWarning ? '#fde047' : colors.slate[200]}`,
                  borderRadius: radius.md,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Task Header: Domain, Reference, Status, SLA Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: colors.primary[50],
                        color: colors.primary[700],
                        borderRadius: radius.sm,
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {task.sourceDomain}
                    </span>
                    <strong style={{ fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                      {task.sourceTransactionId}
                    </strong>
                    <span style={{ color: colors.slate[400] }}>•</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.slate[700] }}>
                      {task.stageName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* SLA Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: radius.sm,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isOverdue ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4',
                        color: isOverdue ? '#be123c' : isWarning ? '#b45309' : '#15803d',
                        border: `1px solid ${isOverdue ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0'}`,
                      }}
                    >
                      <Clock size={11} />
                      {isOverdue ? 'SLA BREACHED (Escalated)' : isWarning ? 'SLA Warning (< 30m)' : 'On Schedule'}
                    </span>

                    <StatusBadge
                      status={task.status === 'APPROVED' ? 'approved' : task.status === 'REJECTED' ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Task Body: Requester, Assigned Approver, Submitted details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                  <div>
                    <span style={{ color: colors.slate[500], display: 'block' }}>Subject / Requester:</span>
                    <strong style={{ color: colors.slate[800] }}>{task.requesterName}</strong>
                  </div>
                  <div>
                    <span style={{ color: colors.slate[500], display: 'block' }}>Assigned Approver:</span>
                    <span style={{ fontWeight: 600, color: colors.slate[800] }}>{task.assignedApprover}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.slate[500], display: 'block' }}>Submitted:</span>
                    <span>{new Date(task.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Task Context Attributes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', backgroundColor: colors.slate[50], padding: '8px 12px', borderRadius: radius.sm, fontSize: '11px' }}>
                  {Object.entries(task.sanitizedDetails).map(([k, v]) => (
                    <span key={k} style={{ marginRight: '12px' }}>
                      <span style={{ color: colors.slate[500] }}>{k}:</span> <strong>{String(v)}</strong>
                    </span>
                  ))}
                </div>

                {/* Action Buttons Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: `1px solid ${colors.slate[100]}`, paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskDetail(task)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.primary[700],
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Eye size={12} /> Inspect Full Record
                  </button>

                  {!isResolved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="ghost"
                        size="dense"
                        leftIcon={<UserPlus size={12} />}
                        onClick={() => setActiveActionModal({ task, action: 'DELEGATE' })}
                      >
                        Delegate
                      </Button>
                      <Button
                        variant="secondary"
                        size="dense"
                        onClick={() => setActiveActionModal({ task, action: 'CHANGES_REQUESTED' })}
                      >
                        Request Changes
                      </Button>
                      <Button
                        variant="danger"
                        size="dense"
                        leftIcon={<XCircle size={12} />}
                        onClick={() => setActiveActionModal({ task, action: 'REJECT' })}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="dense"
                        leftIcon={<CheckCircle2 size={12} />}
                        onClick={() => setActiveActionModal({ task, action: 'APPROVE' })}
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: colors.slate[500], fontWeight: 600 }}>
                      Resolved: {task.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL: Decision & Remarks Dialog */}
      {activeActionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} color={colors.primary[600]} />
                <h3 style={{ margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }}>
                  {activeActionModal.action === 'APPROVE' && 'Confirm Approval Decision'}
                  {activeActionModal.action === 'REJECT' && 'Confirm Rejection (Mandatory Remarks)'}
                  {activeActionModal.action === 'CHANGES_REQUESTED' && 'Request Changes from Requester'}
                  {activeActionModal.action === 'DELEGATE' && 'Delegate Task to Proxy Approver'}
                </h3>
              </div>
              <button type="button" onClick={() => setActiveActionModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={colors.slate[500]} />
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
              Transaction: <strong>{activeActionModal.task.sourceTransactionId}</strong> ({activeActionModal.task.sourceDomain})
            </div>

            {activeActionModal.action === 'DELEGATE' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[700] }}>
                  Select Qualified Proxy Approver:
                </label>
                <select
                  value={delegateTargetInput}
                  onChange={(e) => setDelegateTargetInput(e.target.value)}
                  style={{ height: '34px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                >
                  <option value="user-proxy-02">Rohan Sharma (Site Safety Lead)</option>
                  <option value="user-proxy-03">Ananya Sen (Assistant Plant Manager)</option>
                  <option value="user-proxy-04">Vikram Mehta (Shift Incharge)</option>
                </select>
                <span style={{ fontSize: '10px', color: colors.slate[500] }}>
                  Underlying permissions will be validated before delegation authorization is sealed.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[700] }}>
                  {activeActionModal.action === 'REJECT' ? 'Documented Reason for Rejection *' : 'Remarks / Comments (Optional)'}
                </label>
                <textarea
                  rows={3}
                  required={activeActionModal.action === 'REJECT'}
                  placeholder={
                    activeActionModal.action === 'REJECT'
                      ? 'State the non-compliance or business justification for denying access...'
                      : 'Add any optional verification notes...'
                  }
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  style={{ padding: '8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" size="normal" onClick={() => setActiveActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={activeActionModal.action === 'REJECT' ? 'danger' : 'primary'}
                size="normal"
                onClick={handleConfirmDecision}
              >
                Confirm {activeActionModal.action}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Record Inspection Drawer */}
      {selectedTaskDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }}>
                  Transaction Overview: {selectedTaskDetail.sourceTransactionId}
                </h3>
                <span style={{ fontSize: '11px', color: colors.slate[500] }}>
                  Domain: {selectedTaskDetail.sourceDomain} | Site: {selectedTaskDetail.siteId}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedTaskDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={colors.slate[500]} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: typography.fontSize.xs.size }}>
              <div style={{ padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
                <strong>Requester / Subject:</strong> {selectedTaskDetail.requesterName}
              </div>
              <div style={{ padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
                <strong>Current Workflow Stage:</strong> {selectedTaskDetail.stageName}
              </div>
              <div style={{ padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
                <strong>SLA Due Date:</strong> {selectedTaskDetail.slaDueAt ? new Date(selectedTaskDetail.slaDueAt).toLocaleString() : 'N/A'}
              </div>
              <div style={{ padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
                <strong>Context Details:</strong>
                <pre style={{ margin: '6px 0 0 0', fontFamily: typography.fontFamily.mono, fontSize: '10px' }}>
                  {JSON.stringify(selectedTaskDetail.sanitizedDetails, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" size="normal" onClick={() => setSelectedTaskDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
