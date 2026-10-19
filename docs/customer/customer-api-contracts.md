# Customer Domain REST API Contracts (Section 35)

## 1. Overview & Gateway Integration

The `CustomerApiRouter` (`@vms/customer`) exposes standard enterprise REST endpoints for the customer domain. All endpoints require authenticated user sessions, derive tenant scope strictly from the authenticated identity, and enforce role-based access control (RBAC).

---

## 2. API Route Specifications

### 2.1 Customer Account Endpoints

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST`, `RECEPTIONIST`, `AUDITOR`, `ESG_MANAGER` | List customer accounts with search & pagination |
| `POST` | `/api/v1/customers` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT` | Create new customer account |
| `GET` | `/api/v1/customers/:id` | Read roles | Get customer account by ID |
| `PUT` | `/api/v1/customers/:id` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT` | Update customer account |
| `DELETE` | `/api/v1/customers/:id` | `SUPER_ADMIN`, `SITE_ADMIN` | Deactivate customer account |
| `POST` | `/api/v1/customers/export` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT` | Controlled customer accounts export |
| `GET` | `/api/v1/customers/:id/representatives` | Read roles | List representatives for customer |
| `POST` | `/api/v1/customers/:id/representatives` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Register representative |

### 2.2 Customer Visit Endpoints

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customer-visits` | Read roles + `SECURITY_GUARD` | List customer visits with filtering |
| `POST` | `/api/v1/customer-visits` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Schedule customer visit |
| `GET` | `/api/v1/customer-visits/:id` | Read roles + `SECURITY_GUARD` | Get visit details |
| `POST` | `/api/v1/customer-visits/:id/approve` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Approve customer visit |
| `POST` | `/api/v1/customer-visits/:id/reject` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Reject customer visit |
| `POST` | `/api/v1/customer-visits/:id/request-changes` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Request changes |
| `POST` | `/api/v1/customer-visits/:id/verify-nda` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST`, `RECEPTIONIST` | Verify bilateral NDA |
| `POST` | `/api/v1/customer-visits/:id/check-in` | `SUPER_ADMIN`, `SITE_ADMIN`, `SECURITY_GUARD`, `RECEPTIONIST` | Perform gate check-in |
| `POST` | `/api/v1/customer-visits/:id/participants/:pId/check-in` | `SECURITY_GUARD`, `RECEPTIONIST`, `SITE_ADMIN` | Participant check-in |
| `POST` | `/api/v1/customer-visits/:id/participants/:pId/check-out` | `SECURITY_GUARD`, `RECEPTIONIST`, `SITE_ADMIN` | Participant check-out |
| `POST` | `/api/v1/customer-visits/:id/close` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Close visit with debrief |
| `POST` | `/api/v1/customer-visits/:id/reschedule` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Reschedule visit |
| `POST` | `/api/v1/customer-visits/:id/cancel` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST` | Cancel visit |
| `GET` | `/api/v1/customer-visits/:id/traceability` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST`, `AUDITOR`, `ESG_MANAGER` | Get provenance chain |
| `GET` | `/api/v1/customer-visits/:id/epass` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `HOST`, `RECEPTIONIST` | Issue QR E-Pass |
| `POST` | `/api/v1/customer-visits/export` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT` | Controlled customer visits export |

### 2.3 Delegation & Analytics Endpoints

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customer-delegations/:id` | Read roles + `SECURITY_GUARD` | Delegation real-time summary |
| `GET` | `/api/v1/customer-analytics` | `SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT`, `AUDITOR`, `ESG_MANAGER` | Real operational & ESG analytics |

---

## 3. Standard Response Envelopes & Error Codes

All responses follow a consistent format:
```typescript
interface ApiResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

Standard error codes:
- `400 BAD_REQUEST`: Validation failure, cross-site access violation, or expired appointment window.
- `401 UNAUTHENTICATED`: Missing or invalid session token.
- `403 FORBIDDEN`: Insufficient role permissions or segregated duty violation.
- `404 NOT_FOUND`: Resource ID does not exist in active tenant context.
- `409 DUPLICATE_RESOURCE`: Account code, email, or registration number already exists.
