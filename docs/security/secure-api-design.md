# VMS Enterprise: Secure API Design & Ingress Defense

## 1. Secure API Guidelines

All public and internal endpoints follow strict defensive API engineering rules:

1. **Explicit API Versioning**: All production routes reside under immutable versioned namespaces (`/api/v1/visitors`, `/api/v1/auth`, `/api/v1/gates`).
2. **Standardized Safe Error Responses**: Internal errors (stack traces, filesystem paths, SQL syntax, table names, encryption keys) are stripped before transmission. Production APIs emit standardized response envelopes:

```json
{
  "code": "AUTHORIZATION_DENIED",
  "message": "Access to the requested resource is denied.",
  "requestId": "REQ-2026-001042",
  "timestamp": "2026-10-09T06:00:00.000Z"
}
```

---

## 2. Standardized Security Error Codes

| Error Code | HTTP Status | Trigger Condition |
|---|---|---|
| `AUTHENTICATION_FAILED` | 401 | Missing, malformed, or invalid credentials/session. |
| `SESSION_EXPIRED` | 401 | Session has reached its inactivity or absolute timeout. |
| `MFA_REQUIRED` | 403 / 200 | Primary credentials valid; pending secondary MFA token. |
| `AUTHORIZATION_DENIED` | 403 | Tenant mismatch, missing RBAC capability, site scoping failure, or segregation of duties violation. |
| `RESOURCE_NOT_FOUND` | 404 | Entity ID does not exist within the requesting tenant boundary. |
| `VALIDATION_ERROR` | 400 | Payload failed schema validation (missing required fields, format violations). |
| `RATE_LIMITED` | 429 | Sliding-window threshold exceeded. |
| `INTERNAL_ERROR` | 500 | Unhandled operational exception (all details sanitized). |

---

## 3. Web Application Security Headers

The `SecurityHeadersService` automatically applies production headers on every HTTP response:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(), geolocation=(self), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## 4. CORS Governance

- **No Wildcards**: `Access-Control-Allow-Origin: *` is strictly forbidden on authenticated enterprise endpoints.
- **Explicit Allowed Origins**: CORS validation checks against an explicit list configured per environment (e.g., `https://app.vms.internal`, `https://admin.vms.internal`).
- **Pre-Flight Validation**: `OPTIONS` requests verify allowed methods (`GET, POST, PUT, DELETE, PATCH`) and allowed headers (`Content-Type, Authorization, X-Correlation-ID`).

---

## 5. Input Validation & Injection Defenses

1. **SQL Injection Defense**: All database operations use parameterized queries or typed relational ORM repository methods. Raw SQL string concatenation is prohibited.
2. **Path Traversal Defense**: File paths in storage services are generated via cryptographic random UUIDs (`crypto.randomUUID()`) and validated against alphanumeric patterns, preventing directory traversal (`../`).
3. **Cross-Site Scripting (XSS) Defense**: Output encoding and React JSX automatic DOM escaping neutralize stored and reflected XSS vulnerabilities. Strict CSP prevents script injection.
