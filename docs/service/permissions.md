# Service Permissions (role-based access)

Authorization is enforced **on the server** in every route (`authorize` → `evaluateAccess` in `@vms/permissions`):
RBAC, site scope (users act only on their assigned sites; SUPER_ADMIN and ORGANIZATION_ADMIN are tenant-wide), and
segregation of duties. Tenant isolation is enforced again by PostgreSQL row-level security. The web navigation is
derived from the permissions the server returns (`serviceNavFor`), but hiding a screen is never the control.

| Permission | Grants |
|---|---|
| SERVICE_READ | View providers, technicians, requests at the user's sites, work orders, calendar, schedules, exceptions, analytics |
| SERVICE_WRITE | Legacy general write (kept for earlier modules) |
| SERVICE_REQUEST_CREATE | Raise requests; see one's own requests |
| SERVICE_APPROVE | Approve or reject requests, work orders and recurring schedules |
| SERVICE_MANAGE | Providers, technicians, work orders, assignments, schedules, generation, missed sweep, exceptions, close |
| SERVICE_EXECUTE | Start, pause and resume work; evidence; journeys; submit completion |
| SERVICE_ARRIVAL_RECORD | Record reported arrival and departure only |
| SERVICE_ACCEPT | Accept or return submitted completion |
| SERVICE_PREREQ_VERIFY | Manually verify safety prerequisites (until Part 14) |

Role matrix (generated from `ROLE_PERMISSIONS`):

| Role | READ | WRITE | REQUEST_CREATE | APPROVE | MANAGE | EXECUTE | ARRIVAL_RECORD | ACCEPT | PREREQ_VERIFY |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SITE_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SERVICE_MANAGER (new) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| ORGANIZATION_ADMIN | ✓ | ✓ |  |  | ✓ |  |  |  |  |
| EHS_MANAGER | ✓ |  |  |  |  |  |  |  | ✓ |
| SECURITY_MANAGER | ✓ |  |  |  |  |  | ✓ |  |  |
| SECURITY_GUARD | ✓ |  |  |  |  |  | ✓ |  |  |
| GATE_OPERATOR | ✓ |  |  |  |  |  | ✓ |  |  |
| RECEPTIONIST | ✓ |  |  |  |  |  | ✓ |  |  |
| HOST |  |  | ✓ |  |  |  |  |  |  |
| ESG_MANAGER, AUDITOR, MANAGEMENT | ✓ |  |  |  |  |  |  |  |  |
| HR, HR_MANAGER, LEGAL, LEGAL_USER, ESG_METHODOLOGY_ADMIN, IT_ADMIN |  |  |  |  |  |  |  |  |  |

Segregation of duties (all return 403 `FORBIDDEN`):

* A requester cannot approve their own request; the creator of a work order or schedule cannot approve it.
* The person who submitted completion cannot accept or return it (also a database CHECK constraint).
* SERVICE_MANAGER cannot verify safety prerequisites; that stays with EHS.

Because a SERVICE_MANAGER cannot approve their own work orders, a site needs two people with SERVICE_APPROVE
(or a SITE_ADMIN) to run the full flow. The migration adds the SERVICE_MANAGER role to every existing tenant.
