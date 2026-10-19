/**
 * VMS Enterprise: Contractor Management REST API Router (Part 8)
 * Handles /api/v1/contractors/* endpoints.
 * Enforces tenant isolation, RBAC role authorization, and standardized response envelopes.
 */

import type { UserContext, EnterpriseRole } from '@vms/types';
import type { ContractorService } from './contractor.service.js';
import type {
  CreateContractorCompanyInput,
  UpdateContractorCompanyInput,
  ContractorCompanyQuery,
  CreateContractInput,
  UpdateContractInput,
  RenewContractInput,
  ContractorContractQuery,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  ContractorWorkOrderQuery,
  RegisterContractorWorkerInput,
  UpdateContractorWorkerInput,
  ContractorWorkerQuery,
  AssignWorkerInput,
  ReassignWorkerInput,
  EndAssignmentInput,
  EvaluateWorkerComplianceInput,
  RecordWorkerTrainingInput,
  RecordWorkerQualificationInput,
  VerifyComplianceDocumentInput,
  CheckInContractorWorkerInput,
  CheckOutContractorWorkerInput,
  CorrectAttendanceInput,
  ContractorAttendanceQuery,
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

export class ContractorApiRouter {
  constructor(private contractorService: ContractorService) {}

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
      // 1. Companies (/api/v1/contractors/companies)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/companies') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'GATE_OPERATOR', 'AUDITOR', 'ESG_MANAGER']);
          const q: ContractorCompanyQuery = {
            tenantId: user.tenantId,
            status: query.status,
            classification: query.classification,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const result = this.contractorService.getContractorCompanies(q);
          return { statusCode: 200, data: result };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: CreateContractorCompanyInput = {
            ...body,
            tenantId: user.tenantId,
            createdBy: user.userId,
          };
          const created = await this.contractorService.createContractorCompany(input);
          return { statusCode: 201, data: created };
        }
      }

      const companyMatch = cleanPath.match(/^\/api\/v1\/contractors\/companies\/([^/]+)$/);
      if (companyMatch) {
        const companyId = companyMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR', 'ESG_MANAGER']);
          const company = await this.contractorService.getContractorCompanyById(companyId, user.tenantId);
          if (!company) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: 'Contractor company not found' } };
          }
          return { statusCode: 200, data: company };
        }

        if (method === 'PUT' || method === 'PATCH') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: UpdateContractorCompanyInput = {
            ...body,
            tenantId: user.tenantId,
            updatedBy: user.userId,
          };
          const updated = await this.contractorService.updateContractorCompany(companyId, input);
          return { statusCode: 200, data: updated };
        }
      }

      // ----------------------------------------------------------------------
      // 2. Contracts (/api/v1/contractors/contracts)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/contracts') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR']);
          const q: ContractorContractQuery = {
            tenantId: user.tenantId,
            companyId: query.companyId,
            status: query.status,
            siteId: query.siteId,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const result = this.contractorService.getContracts(q);
          return { statusCode: 200, data: result };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: CreateContractInput = {
            ...body,
            tenantId: user.tenantId,
            createdBy: user.userId,
          };
          const created = await this.contractorService.createContract(input);
          return { statusCode: 201, data: created };
        }
      }

      if (cleanPath === '/api/v1/contractors/contracts/expiring') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR']);
          const daysThreshold = query.days ? Number(query.days) : 30;
          const expiring = await this.contractorService.getExpiringContracts(user.tenantId, daysThreshold);
          return { statusCode: 200, data: expiring };
        }
      }

      const contractRenewMatch = cleanPath.match(/^\/api\/v1\/contractors\/contracts\/([^/]+)\/renew$/);
      if (contractRenewMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const contractId = contractRenewMatch[1];
        const input: RenewContractInput = {
          tenantId: user.tenantId,
          contractId,
          newEndDate: body.newEndDate,
          renewalReason: body.renewalReason || 'Standard Contract Extension',
          approvedByUserId: user.userId,
        };
        const renewed = await this.contractorService.renewContract(input);
        return { statusCode: 200, data: renewed };
      }

      const contractMatch = cleanPath.match(/^\/api\/v1\/contractors\/contracts\/([^/]+)$/);
      if (contractMatch) {
        const contractId = contractMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR']);
          const contract = await this.contractorService.getContractById(contractId, user.tenantId);
          if (!contract) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: 'Contract not found' } };
          }
          return { statusCode: 200, data: contract };
        }

        if (method === 'PUT' || method === 'PATCH') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: UpdateContractInput = {
            ...body,
            tenantId: user.tenantId,
            updatedBy: user.userId,
          };
          const updated = await this.contractorService.updateContract(contractId, input);
          return { statusCode: 200, data: updated };
        }
      }

      // ----------------------------------------------------------------------
      // 3. Work Orders (/api/v1/contractors/work-orders)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/work-orders') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR', 'ESG_MANAGER']);
          const q: ContractorWorkOrderQuery = {
            tenantId: user.tenantId,
            siteId: query.siteId,
            companyId: query.companyId,
            contractId: query.contractId,
            status: query.status,
            workCategory: query.workCategory,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const result = this.contractorService.getWorkOrders(q);
          return { statusCode: 200, data: result };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: CreateWorkOrderInput = {
            ...body,
            tenantId: user.tenantId,
            createdBy: user.userId,
          };
          const created = await this.contractorService.createWorkOrder(input);
          return { statusCode: 201, data: created };
        }
      }

      const woSubmitMatch = cleanPath.match(/^\/api\/v1\/contractors\/work-orders\/([^/]+)\/submit$/);
      if (woSubmitMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const workOrderId = woSubmitMatch[1];
        const submitted = await this.contractorService.submitWorkOrder({
          tenantId: user.tenantId,
          workOrderId,
          submittedByUserId: user.userId,
        });
        return { statusCode: 200, data: submitted };
      }

      const woApproveMatch = cleanPath.match(/^\/api\/v1\/contractors\/work-orders\/([^/]+)\/approve$/);
      if (woApproveMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const workOrderId = woApproveMatch[1];
        const approved = await this.contractorService.approveWorkOrder({
          tenantId: user.tenantId,
          workOrderId,
          approvedByUserId: user.userId,
          remarks: body.remarks,
        });
        return { statusCode: 200, data: approved };
      }

      const woRejectMatch = cleanPath.match(/^\/api\/v1\/contractors\/work-orders\/([^/]+)\/reject$/);
      if (woRejectMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const workOrderId = woRejectMatch[1];
        const rejected = await this.contractorService.rejectWorkOrder({
          tenantId: user.tenantId,
          workOrderId,
          rejectedByUserId: user.userId,
          reason: body.reason || 'Work order rejected by management',
        });
        return { statusCode: 200, data: rejected };
      }

      const woMatch = cleanPath.match(/^\/api\/v1\/contractors\/work-orders\/([^/]+)$/);
      if (woMatch) {
        const workOrderId = woMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR', 'ESG_MANAGER']);
          const wo = await this.contractorService.getWorkOrderById(workOrderId, user.tenantId);
          if (!wo) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: 'Work order not found' } };
          }
          return { statusCode: 200, data: wo };
        }

        if (method === 'PUT' || method === 'PATCH') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
          const input: UpdateWorkOrderInput = {
            ...body,
            tenantId: user.tenantId,
            updatedBy: user.userId,
          };
          const updated = await this.contractorService.updateWorkOrder(workOrderId, input);
          return { statusCode: 200, data: updated };
        }
      }

      // ----------------------------------------------------------------------
      // 4. Workers (/api/v1/contractors/workers)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/workers') {
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR']);
          const q: ContractorWorkerQuery = {
            tenantId: user.tenantId,
            companyId: query.companyId,
            workerCategory: query.workerCategory,
            status: query.status,
            search: query.search,
            limit: query.limit ? Number(query.limit) : 50,
            offset: query.offset ? Number(query.offset) : 0,
          };
          const result = this.contractorService.listWorkers(q);
          return { statusCode: 200, data: result };
        }

        if (method === 'POST') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR']);
          const input: RegisterContractorWorkerInput = {
            ...body,
            tenantId: user.tenantId,
            createdBy: user.userId,
          };
          const registered = await this.contractorService.registerContractorWorker(input);
          return { statusCode: 201, data: registered };
        }
      }

      if (cleanPath === '/api/v1/contractors/workers/check-duplicate' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR']);
        const dupResult = await this.contractorService.checkWorkerDuplicate(user.tenantId, body);
        return { statusCode: 200, data: dupResult };
      }

      const workerMatch = cleanPath.match(/^\/api\/v1\/contractors\/workers\/([^/]+)$/);
      if (workerMatch) {
        const workerId = workerMatch[1];
        if (method === 'GET') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'HOST', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR']);
          const worker = await this.contractorService.getWorkerById(workerId, user.tenantId);
          if (!worker) {
            return { statusCode: 404, error: { code: 'NOT_FOUND', message: 'Worker profile not found' } };
          }
          return { statusCode: 200, data: worker };
        }

        if (method === 'PUT' || method === 'PATCH') {
          this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR']);
          const input: UpdateContractorWorkerInput = {
            ...body,
            tenantId: user.tenantId,
            updatedBy: user.userId,
          };
          const updated = await this.contractorService.updateContractorWorker(workerId, input);
          return { statusCode: 200, data: updated };
        }
      }

      // ----------------------------------------------------------------------
      // 5. Assignments (/api/v1/contractors/assignments)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/assignments' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const input: AssignWorkerInput = {
          ...body,
          tenantId: user.tenantId,
          assignedByUserId: user.userId,
        };
        const assignment = await this.contractorService.assignWorker(input);
        return { statusCode: 201, data: assignment };
      }

      const assignReassignMatch = cleanPath.match(/^\/api\/v1\/contractors\/assignments\/([^/]+)\/reassign$/);
      if (assignReassignMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const currentAssignmentId = assignReassignMatch[1];
        const input: ReassignWorkerInput = {
          tenantId: user.tenantId,
          currentAssignmentId,
          newWorkOrderId: body.newWorkOrderId,
          assignedFrom: body.assignedFrom,
          assignedTo: body.assignedTo,
          reassignedByUserId: user.userId,
          reason: body.reason,
        };
        const reassigned = await this.contractorService.reassignWorker(input);
        return { statusCode: 200, data: reassigned };
      }

      const assignEndMatch = cleanPath.match(/^\/api\/v1\/contractors\/assignments\/([^/]+)\/end$/);
      if (assignEndMatch && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const assignmentId = assignEndMatch[1];
        const input: EndAssignmentInput = {
          tenantId: user.tenantId,
          assignmentId,
          endedByUserId: user.userId,
          reason: body.reason,
        };
        const ended = await this.contractorService.endAssignment(input);
        return { statusCode: 200, data: ended };
      }

      // ----------------------------------------------------------------------
      // 6. Compliance & Safety (/api/v1/contractors/compliance/*)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/compliance/evaluate' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR']);
        const input: EvaluateWorkerComplianceInput = {
          tenantId: user.tenantId,
          workerId: body.workerId,
          workOrderId: body.workOrderId,
          siteId: body.siteId,
        };
        const decision = await this.contractorService.evaluateWorkerCompliance(input);
        return { statusCode: 200, data: decision };
      }

      if (cleanPath === '/api/v1/contractors/compliance/training' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR']);
        const input: RecordWorkerTrainingInput = {
          ...body,
          tenantId: user.tenantId,
          verifiedByUserId: user.userId,
        };
        const training = await this.contractorService.recordWorkerTraining(input);
        return { statusCode: 201, data: training };
      }

      if (cleanPath === '/api/v1/contractors/compliance/qualification' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const input: RecordWorkerQualificationInput = {
          ...body,
          tenantId: user.tenantId,
          verifiedByUserId: user.userId,
        };
        const qual = await this.contractorService.recordWorkerQualification(input);
        return { statusCode: 201, data: qual };
      }

      if (cleanPath === '/api/v1/contractors/compliance/verify' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR']);
        const input: VerifyComplianceDocumentInput = {
          ...body,
          tenantId: user.tenantId,
          verifiedByUserId: user.userId,
        };
        const verified = await this.contractorService.verifyComplianceDocument(input);
        return { statusCode: 200, data: verified };
      }

      if (cleanPath === '/api/v1/contractors/compliance/expiring' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR']);
        const days = query.days ? Number(query.days) : 30;
        const expiring = await this.contractorService.getExpiringDocuments(user.tenantId, days);
        return { statusCode: 200, data: expiring };
      }

      if (cleanPath === '/api/v1/contractors/compliance/restricted' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR']);
        const restricted = await this.contractorService.getRestrictedWorkers(user.tenantId);
        return { statusCode: 200, data: restricted };
      }

      // ----------------------------------------------------------------------
      // 7. Attendance & Gate (/api/v1/contractors/attendance/*)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/attendance/check-in' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'RECEPTIONIST']);
        const input: CheckInContractorWorkerInput = {
          ...body,
          tenantId: user.tenantId,
          operatorUserId: user.userId,
        };
        const checkIn = await this.contractorService.checkInWorker(input);
        return { statusCode: 201, data: checkIn };
      }

      if (cleanPath === '/api/v1/contractors/attendance/check-out' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'RECEPTIONIST']);
        const input: CheckOutContractorWorkerInput = {
          ...body,
          tenantId: user.tenantId,
          operatorUserId: user.userId,
        };
        const checkOut = await this.contractorService.checkOutWorker(input);
        return { statusCode: 200, data: checkOut };
      }

      if (cleanPath === '/api/v1/contractors/attendance/correct' && method === 'POST') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT']);
        const input: CorrectAttendanceInput = {
          ...body,
          tenantId: user.tenantId,
          correctedByUserId: user.userId,
        };
        const corrected = await this.contractorService.correctAttendance(input);
        return { statusCode: 200, data: corrected };
      }

      if (cleanPath === '/api/v1/contractors/attendance/currently-on-site' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'RECEPTIONIST', 'AUDITOR']);
        const onSite = await this.contractorService.getCurrentlyOnSite(user.tenantId, query.siteId);
        return { statusCode: 200, data: onSite };
      }

      if (cleanPath === '/api/v1/contractors/attendance/expected' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'RECEPTIONIST']);
        const expected = await this.contractorService.getExpectedWorkforce(user.tenantId, query.siteId || 'DEFAULT', query.date);
        return { statusCode: 200, data: expected };
      }

      if (cleanPath === '/api/v1/contractors/attendance' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'SECURITY_MANAGER', 'GATE_OPERATOR', 'AUDITOR']);
        const q: ContractorAttendanceQuery = {
          tenantId: user.tenantId,
          siteId: query.siteId,
          workOrderId: query.workOrderId,
          companyId: query.companyId,
          workerId: query.workerId,
          shiftDate: query.shiftDate,
          presenceStatus: query.presenceStatus,
          limit: query.limit ? Number(query.limit) : 50,
          offset: query.offset ? Number(query.offset) : 0,
        };
        const result = this.contractorService.getDailyAttendance(q);
        return { statusCode: 200, data: result };
      }

      // ----------------------------------------------------------------------
      // 8. Analytics (/api/v1/contractors/analytics)
      // ----------------------------------------------------------------------
      if (cleanPath === '/api/v1/contractors/analytics' && method === 'GET') {
        this.assertAuthorized(user, ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR', 'ESG_MANAGER']);
        const summary = await this.contractorService.getContractorAnalyticsSummary(user.tenantId, query.siteId);
        return { statusCode: 200, data: summary };
      }

      return {
        statusCode: 404,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `Endpoint '${method} ${path}' not recognized in Contractor Management API.`,
        },
      };
    } catch (err: any) {
      const isAuthError = err.message?.startsWith('AUTHORIZATION_DENIED');
      const isDuplicate = err.message?.startsWith('DUPLICATE_') || err.message?.startsWith('ALREADY_');
      const isAccessDenied = err.message?.startsWith('GATE_ACCESS_DENIED') || err.message?.startsWith('CONTRACT_');

      let statusCode = 500;
      if (isAuthError) statusCode = 403;
      else if (isDuplicate) statusCode = 409;
      else if (isAccessDenied) statusCode = 422;
      else if (err.message?.includes('not found')) statusCode = 404;

      return {
        statusCode,
        error: {
          code: isAuthError ? 'FORBIDDEN' : isDuplicate ? 'CONFLICT' : 'BUSINESS_RULE_VIOLATION',
          message: err.message || 'An unexpected server error occurred.',
        },
      };
    }
  }

  private assertAuthorized(user: UserContext, allowedRoles: EnterpriseRole[]): void {
    if (user.role === 'SUPER_ADMIN') return;
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`AUTHORIZATION_DENIED: Role '${user.role}' lacks permission for this contractor management operation.`);
    }
  }
}
