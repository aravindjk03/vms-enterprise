/**
 * VMS Enterprise: Customer Management Domain REST API Router (Section 35)
 * Handles /api/v1/customers, /api/v1/customer-visits, /api/v1/customer-delegations,
 * and /api/v1/customer-analytics endpoints.
 * Enforces authentication, tenant isolation, site authorization, resource RBAC,
 * and secure standard response envelopes.
 */

import type { UserContext, EnterpriseRole } from '@vms/types';
import type { CustomerService } from './customer.service.js';
import type {
  CreateCustomerAccountInput,
  UpdateCustomerAccountInput,
  CreateCustomerRepresentativeInput,
  UpdateCustomerRepresentativeInput,
  CreateCustomerVisitInput,
  CheckInCustomerParticipantInput,
  CheckOutCustomerParticipantInput,
  CloseCustomerVisitInput,
  RescheduleCustomerVisitInput,
  CancelCustomerVisitInput,
  CustomerAccountQuery,
  CustomerVisitQuery,
} from './types.js';

export interface ApiRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class CustomerApiRouter {
  constructor(private customerService: CustomerService) {}

  /**
   * Main request dispatcher.
   */
  public async handleRequest(req: ApiRequest, user: UserContext): Promise<ApiResponse> {
    if (!user || !user.tenantId) {
      return {
        statusCode: 401,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Valid user session and tenant context required.',
        },
      };
    }

    const { path, method, query = {}, body = {} } = req;
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');

    try {
      // ----------------------------------------------------------------------
      // 1. /api/v1/customers & /api/v1/customers/:id
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/customers') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const accQuery: CustomerAccountQuery = {
            tenantId: user.tenantId,
            classification: query.classification,
            status: query.status,
            siteId: query.siteId,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const result = this.customerService.getCustomerAccounts(accQuery);
          return { statusCode: 200, data: result };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: CreateCustomerAccountInput = {
            ...body,
            tenantId: user.tenantId,
            createdBy: user.userId,
          };
          const created = await this.customerService.createCustomerAccount(input);
          return { statusCode: 201, data: created };
        }
      }

      if (cleanPath === '/api/v1/customers/export') {
        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const accQuery: CustomerAccountQuery = {
            tenantId: user.tenantId,
            ...query,
            ...body,
          };
          const exported = await this.customerService.exportCustomerAccounts(user, accQuery);
          return { statusCode: 200, data: exported };
        }
      }

      const custMatch = cleanPath.match(/^\/api\/v1\/customers\/([^\/]+)$/);
      if (custMatch) {
        const customerAccountId = custMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const account = await this.customerService.getCustomerAccountById(user.tenantId, customerAccountId);
          if (!account) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: `Customer account '${customerAccountId}' not found.` } };
          }
          return { statusCode: 200, data: account };
        }

        if (method === 'PUT') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: UpdateCustomerAccountInput = {
            ...body,
            tenantId: user.tenantId,
            updatedBy: user.userId,
          };
          const updated = await this.customerService.updateCustomerAccount(customerAccountId, input);
          return { statusCode: 200, data: updated };
        }

        if (method === 'DELETE') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN']);
          const deactivated = await this.customerService.deactivateCustomerAccount(user.tenantId, customerAccountId, user.userId);
          return { statusCode: 200, data: deactivated };
        }
      }

      // Representatives under customer: /api/v1/customers/:id/representatives
      const repsMatch = cleanPath.match(/^\/api\/v1\/customers\/([^\/]+)\/representatives$/);
      if (repsMatch) {
        const customerAccountId = repsMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const reps = await this.customerService.listCustomerRepresentatives(user.tenantId, customerAccountId, user.role);
          return { statusCode: 200, data: reps };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const input: CreateCustomerRepresentativeInput = {
            ...body,
            tenantId: user.tenantId,
            customerAccountId,
            createdBy: user.userId,
          };
          const rep = await this.customerService.createCustomerRepresentative(input);
          return { statusCode: 201, data: rep };
        }
      }

      // ----------------------------------------------------------------------
      // 2. /api/v1/customer-visits
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/customer-visits') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_GUARD', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const visitQuery: CustomerVisitQuery = {
            tenantId: user.tenantId,
            siteId: query.siteId,
            customerAccountId: query.customerAccountId,
            visitTypeCode: query.visitTypeCode,
            stage: query.stage,
            status: query.status,
            hostUserId: query.hostUserId,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const list = this.customerService.getCustomerVisits(visitQuery);
          return { statusCode: 200, data: list };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const input: CreateCustomerVisitInput = {
            ...body,
            tenantId: user.tenantId,
            submittedBy: user.userId,
          };
          const visit = await this.customerService.createCustomerVisit(input);
          return { statusCode: 201, data: visit };
        }
      }

      if (cleanPath === '/api/v1/customer-visits/export') {
        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const visitQuery: CustomerVisitQuery = {
            tenantId: user.tenantId,
            ...query,
            ...body,
          };
          const exported = await this.customerService.exportCustomerVisits(user, visitQuery);
          return { statusCode: 200, data: exported };
        }
      }

      // Single visit: /api/v1/customer-visits/:id
      const visitMatch = cleanPath.match(/^\/api\/v1\/customer-visits\/([^\/]+)$/);
      if (visitMatch) {
        const visitId = visitMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_GUARD', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const { items } = this.customerService.getCustomerVisits({ tenantId: user.tenantId, limit: 1000 });
          const visit = items.find(v => v.transactionId === visitId);
          if (!visit) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: `Customer visit '${visitId}' not found.` } };
          }
          return { statusCode: 200, data: visit };
        }
      }

      // Visit actions
      const visitActionMatch = cleanPath.match(/^\/api\/v1\/customer-visits\/([^\/]+)\/([a-z\-]+)$/);
      if (visitActionMatch) {
        const visitId = visitActionMatch[1];
        const action = visitActionMatch[2];

        if (action === 'approve' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const approved = await this.customerService.approveVisit(user.tenantId, visitId, user.userId, body.notes);
          return { statusCode: 200, data: approved };
        }

        if (action === 'reject' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const rejected = await this.customerService.rejectVisit(user.tenantId, visitId, user.userId, body.reason || 'Rejected by approver');
          return { statusCode: 200, data: rejected };
        }

        if (action === 'request-changes' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const changes = await this.customerService.requestChanges(user.tenantId, visitId, user.userId, body.changeDetails || 'Changes requested');
          return { statusCode: 200, data: changes };
        }

        if (action === 'verify-nda' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'RECEPTIONIST']);
          const verified = await this.customerService.verifyCustomerNda(user.tenantId, visitId, body.documentRef, body.expiryDate);
          return { statusCode: 200, data: verified };
        }

        if (action === 'check-in' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'RECEPTIONIST']);
          const checkedIn = await this.customerService.checkInCustomerVisit({
            tenantId: user.tenantId,
            transactionId: visitId,
            gateId: body.gateId,
            operatorUserId: user.userId,
            notes: body.notes,
          });
          return { statusCode: 200, data: checkedIn };
        }

        if (action === 'close' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const input: CloseCustomerVisitInput = {
            tenantId: user.tenantId,
            transactionId: visitId,
            notes: body.notes || 'Visit completed',
            followUpRequired: body.followUpRequired,
            evidenceDocumentRefs: body.evidenceDocumentRefs,
            closedByUserId: user.userId,
          };
          const closed = await this.customerService.closeCustomerVisit(input);
          return { statusCode: 200, data: closed };
        }

        if (action === 'reschedule' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const rescheduled = await this.customerService.rescheduleCustomerVisit(
            user.tenantId,
            visitId,
            body.newStart,
            body.newEnd,
            user.userId,
            body.reason || 'Rescheduled'
          );
          return { statusCode: 200, data: rescheduled };
        }

        if (action === 'cancel' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST']);
          const cancelled = await this.customerService.cancelCustomerVisit(
            user.tenantId,
            visitId,
            user.userId,
            body.reason || 'Cancelled'
          );
          return { statusCode: 200, data: cancelled };
        }

        if (action === 'traceability' && method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'AUDITOR', 'ESG_MANAGER']);
          const trace = this.customerService.getCustomerActivityTraceability(user.tenantId, visitId);
          return { statusCode: 200, data: trace };
        }

        if (action === 'epass' && method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'RECEPTIONIST']);
          const epass = this.customerService.issueEPass(user.tenantId, visitId, query.participantId);
          return { statusCode: 200, data: epass };
        }
      }

      // Participant check-in/out: /api/v1/customer-visits/:id/participants/:pId/check-in
      const partActionMatch = cleanPath.match(/^\/api\/v1\/customer-visits\/([^\/]+)\/participants\/([^\/]+)\/([a-z\-]+)$/);
      if (partActionMatch) {
        const visitId = partActionMatch[1];
        const participantId = partActionMatch[2];
        const action = partActionMatch[3];

        if (action === 'check-in' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'RECEPTIONIST']);
          const input: CheckInCustomerParticipantInput = {
            tenantId: user.tenantId,
            customerVisitId: visitId,
            participantId,
            siteId: body.siteId,
            gateId: body.gateId,
            operatorUserId: user.userId,
            notes: body.notes,
          };
          const part = await this.customerService.checkInParticipant(input);
          return { statusCode: 200, data: part };
        }

        if (action === 'check-out' && method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'RECEPTIONIST']);
          const input: CheckOutCustomerParticipantInput = {
            tenantId: user.tenantId,
            customerVisitId: visitId,
            participantId,
            siteId: body.siteId,
            gateId: body.gateId,
            operatorUserId: user.userId,
            notes: body.notes,
          };
          const part = await this.customerService.checkOutParticipant(input);
          return { statusCode: 200, data: part };
        }
      }

      // ----------------------------------------------------------------------
      // 3. /api/v1/customer-delegations/:id
      // ----------------------------------------------------------------------
      const delegMatch = cleanPath.match(/^\/api\/v1\/customer-delegations\/([^\/]+)$/);
      if (delegMatch) {
        const visitId = delegMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_GUARD', 'RECEPTIONIST', 'AUDITOR', 'ESG_MANAGER']);
          const view = await this.customerService.getCustomerDelegationSummary(user.tenantId, visitId);
          return { statusCode: 200, data: view };
        }
      }

      // ----------------------------------------------------------------------
      // 4. /api/v1/customer-analytics
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/customer-analytics') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR', 'ESG_MANAGER']);
          const summary = await this.customerService.getCustomerAnalyticsSummary(user.tenantId, query.siteId);
          return { statusCode: 200, data: summary };
        }
      }

      // Unknown route
      return {
        statusCode: 404,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `Endpoint '${method} ${cleanPath}' does not exist in Customer Domain API.`,
        },
      };
    } catch (err: any) {
      const message = err.message || 'Internal server error';
      if (message.includes('already exists') || message.includes('Duplicate')) {
        return { statusCode: 409, error: { code: 'DUPLICATE_RESOURCE', message } };
      }
      if (message.includes('AUTHORIZATION_DENIED') || message.includes('Forbidden')) {
        return { statusCode: 403, error: { code: 'FORBIDDEN', message } };
      }
      if (message.includes('not found')) {
        return { statusCode: 404, error: { code: 'NOT_FOUND', message } };
      }
      if (message.includes('blocked') || message.includes('Cross-site') || message.includes('Mandatory') || message.includes('Precedence')) {
        return { statusCode: 400, error: { code: 'BAD_REQUEST', message } };
      }
      return { statusCode: 500, error: { code: 'INTERNAL_ERROR', message } };
    }
  }

  private assertAuthorized(user: UserContext, allowedRoles: EnterpriseRole[]): void {
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`AUTHORIZATION_DENIED: Role '${user.role}' is not authorized for this resource.`);
    }
  }
}
