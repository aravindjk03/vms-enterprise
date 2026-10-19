export class TaskCenterService {
    workflowRepo;
    approvalRepo;
    delegationManager;
    constructor(workflowRepo, approvalRepo, delegationManager) {
        this.workflowRepo = workflowRepo;
        this.approvalRepo = approvalRepo;
        this.delegationManager = delegationManager;
    }
    /**
     * Retrieves task views according to persona and authorization boundaries (Section 23).
     */
    getTasks(query, user) {
        const allTasks = this.workflowRepo.listTasks({});
        const tenantTasks = allTasks.filter((t) => (t.tenant_id || t.tenantId) === user.tenantId);
        const now = new Date();
        const filtered = tenantTasks.filter((task) => {
            // Domain filter
            if (query.domain && task.sourceDomain !== query.domain)
                return false;
            // Site filter
            if (query.siteId && task.siteId && task.siteId !== query.siteId)
                return false;
            const isAssignedDirect = task.assignedToUserId === user.userId ||
                (task.assignedToRole && (user.role === task.assignedToRole || (user.roles || []).includes(task.assignedToRole)));
            const isOverdue = task.slaDueAt && new Date(task.slaDueAt) < now;
            switch (query.view) {
                case 'MY_PENDING':
                case 'ASSIGNED_TO_ME':
                    return (task.status === 'PENDING' || task.status === 'ESCALATED') && isAssignedDirect;
                case 'DELEGATED':
                    if (task.status !== 'PENDING' && task.status !== 'ESCALATED')
                        return false;
                    // Check if assigned to someone who has delegated to this user
                    if (task.assignedToUserId) {
                        const del = this.delegationManager.getActiveDelegationForDelegate(user.userId, task.assignedToUserId, task.sourceDomain, user.tenantId);
                        return del !== null;
                    }
                    return false;
                case 'WAITING_OTHERS':
                    return task.status === 'PENDING' && !isAssignedDirect;
                case 'OVERDUE':
                    return (task.status === 'PENDING' || task.status === 'ESCALATED') && isOverdue;
                case 'ESCALATED':
                    return task.status === 'ESCALATED' || task.slaEscalated === true;
                case 'COMPLETED':
                    return task.status === 'APPROVED' || task.status === 'REJECTED' || task.status === 'CHANGES_REQUESTED';
                default:
                    return true;
            }
        });
        return filtered.map((task) => this.mapToTaskItemView(task, user));
    }
    mapToTaskItemView(task, user) {
        const now = new Date();
        let slaStatus = 'ON_TIME';
        if (task.slaDueAt && new Date(task.slaDueAt) < now) {
            slaStatus = 'OVERDUE';
        }
        else if (task.slaWarningAt && new Date(task.slaWarningAt) < now) {
            slaStatus = 'WARNING';
        }
        const availableActions = ['APPROVE', 'REJECT', 'CHANGES_REQUESTED'];
        if (task.metadata?.delegationAllowed !== false) {
            availableActions.push('DELEGATE');
        }
        // Contextual detail respecting permissions (Section 23 privacy boundary)
        const sanitizedDetails = {
            reference: task.sourceTransactionId,
            domain: task.sourceDomain,
            status: task.status,
            submitted: task.submittedAt,
        };
        return {
            taskId: task.taskId,
            instanceId: task.instanceId,
            sourceDomain: task.sourceDomain,
            sourceTransactionId: task.sourceTransactionId,
            siteId: task.siteId,
            stageName: task.metadata?.stageName || 'Approval Stage',
            assignedApprover: task.assignedToUserId || task.assignedToRole || 'Assigned Pool',
            submittedAt: task.submittedAt,
            slaDueAt: task.slaDueAt,
            slaStatus,
            status: task.status,
            availableActions,
            sanitizedDetails,
        };
    }
}
