# Rules & Policy Engine Architecture & Conflict Resolution

## 1. Executive Overview

The VMS Enterprise Rules & Policy Engine enables administrators to declare sophisticated business logic that evaluates transactional data dynamically. Policies dictate whether a transaction is permitted, requires additional approvals, mandates specific compliance documents, or must be denied outright.

All rule expressions are evaluated safely via declarative condition interpreters without using JavaScript `eval()` or unvetted expression injection.

---

## 2. Policy Conflict Resolution & Precedence Hierarchy

When multiple policies match a single transaction, the engine applies strict precedence rules to resolve conflicting actions:

```mermaid
graph TD
    subgraph Precedence Ordering (Priority 1 to 4)
        P1[Priority 1: Transaction-Specific Conditions<br/>Explicit flags e.g. Blacklisted = True]
        P2[Priority 2: Site-Specific Policies<br/>Site override rules e.g. Chennai Plant high-heat PPE]
        P3[Priority 3: Domain-Specific Policies<br/>General domain rules e.g. Contractor work category]
        P4[Priority 4: Global Tenant Default Policies<br/>Baseline enterprise rules]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4

    subgraph Action Dominance Resolution
        DENY[DENY Action<br/>Highest Dominance]
        APPR[REQUIRE_APPROVAL Action]
        DOC[REQUIRE_DOCUMENT Action]
        ALLOW[ALLOW Action<br/>Lowest Dominance]
    end

    P1 -.->|Overrides| DENY
    P2 -.->|Overrides| APPR
    P3 -.->|Overrides| DOC
    P4 -.->|Default| ALLOW
```

---

## 3. Declarative Condition Operators

Condition expressions evaluate against context payloads using the following typed operators:

| Operator | Semantics | Example |
|---|---|---|
| `EQUALS` | Value equality (type-tolerant for strings/numbers) | `visitor_type == 'VIP'` |
| `NOT_EQUALS` | Value inequality | `status != 'CANCELLED'` |
| `GREATER_THAN` | Numeric comparison | `delegation_size > 5` |
| `LESS_THAN` | Numeric comparison | `temperature_c < 100` |
| `CONTAINS` | Substring match or array containment | `authorized_zones contains 'R_AND_D'` |
| `IN` | Context value matches any item in array | `fuel_type in ['DIESEL', 'PETROL']` |
| `NOT_IN` | Context value not present in array | `category not in ['HAZARDOUS']` |
| `EXISTS` | Field is defined, non-null, and non-empty | `passport_number exists` |
| `IS_VALID` | Value represents an affirmative valid state | `nda_signed == true` |
| `IS_EXPIRED` | Date timestamp is strictly in the past | `safety_induction_date is expired` |

Conditions can be grouped with `AND` or `OR` conjunction logic.

---

## 4. Conflict Resolution Rules
1. **Deny Overrides All**: If any evaluated rule produces a `DENY` decision, the entire transaction is immediately denied (`allowed = false`), halting further rule evaluation.
2. **Specific Beats General**: Site-specific policies take precedence over tenant-wide global policies. A site rule requiring a special gate pass overrides a general rule that might have permitted standard entry.
3. **Auditability**: Every evaluation produces a `PolicyEvaluationRecord` recording the input payload, matched rules, winning decision, and plain-English explanation for audit scrutiny.
