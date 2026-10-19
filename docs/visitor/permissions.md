# Visitor Domain Security & Capability Matrix

## 1. Overview

Access to visitor information and operational gate actions is governed by a defense-in-depth security model combining **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)**. 

Security rules are strictly enforced server-side within `VisitorService` and repository guards; frontend navigation hiding serves solely as visual ergonomics.

---

## 2. Granular Capability Matrix

| Capability String | Security Guard | Receptionist | Plant Host | EHS Officer | ESG Manager | Auditor | Super Admin |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `visitor.read` | Yes (Site) | Yes (Site) | Yes (Owned) | Yes (Site) | Yes (Masked) | Yes (Tenant) | Yes (All) |
| `visitor.create` | Yes | Yes | Yes | No | No | No | Yes |
| `visitor.approve` | No | No | Yes (Owned) | Yes (Safety) | No | No | Yes |
| `visitor.verify_identity`| Yes | Yes | No | No | No | No | Yes |
| `visitor.checkin` | Yes | Yes | No | No | No | No | Yes |
| `visitor.checkout` | Yes | Yes | No | No | No | No | Yes |
| `visitor.overstay_manage`| Yes | No | Yes (Owned) | No | No | No | Yes |
| `visitor.esg_view` | No | No | No | No | Yes (Full) | Yes (Full) | Yes (Full) |
| `visitor.pii_view` | Yes (Govt ID) | Yes (Govt ID) | Yes (Contact) | No | **No (Masked)** | **No (Masked)**| Yes |
| `visitor.audit_read` | No | No | No | Yes | Yes | Yes | Yes |

---

## 3. ABAC Contextual Rules

In addition to static roles, ABAC rules evaluate situational context:

1. **Host Ownership Rule**: A standard employee (`HOST`) can only approve, reschedule, or cancel visitor appointments where `hostUserId == currentUser.id` or where active delegation is assigned.
2. **Site Scoping Rule**: A `SECURITY_GUARD` assigned to the Chennai Radial Tyre Plant (`siteId: 'SITE-CHN-01'`) cannot view or check in visitors for the Pune Assembly Plant (`siteId: 'SITE-PUN-02'`).
3. **ESG Privacy Boundary**: An `ESG_MANAGER` has full access to distance, fuel, transport mode, and CO2e emissions, but personal phone numbers, emails, and identity card scans are strictly redacted.
4. **Emergency Override Rule**: During an active `EMERGENCY_MUSTER` state, emergency commanders inherit temporary bypass privileges to view on-premises rosters across all zones and gates.
