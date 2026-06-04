# 5-28 Deployment Stamp Pattern - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | multi-tenancy |
| Knowledge Unit ID | 5-28 | |
| Knowledge Unit | 5-28 Deployment Stamp Pattern |
| Total Rules | 4 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Never Trust Tenant ID From Request
---
## Category
Security
---
## Rule
Always resolve the current tenant from authenticated context, never from user input.
---
## Reason
Accepting client-provided tenant_id enables cross-tenant attacks.
---
## Bad Example
$tenantId = $request->input tenant_id ;
---
## Good Example
$tenantId = $request->user ->tenant_id ;
---
## Exceptions
Admin impersonation with audit logging.
---
## Consequences Of Violation
Cross-tenant data breach.

---

## 2. Always Index Tenant ID As Leading Column
---
## Category
Performance
---
## Rule
Always include tenant_id as the leading column in composite indexes for shared-table multi-tenancy.
---
## Reason
Without tenant_id leading, the index is not used for tenant filtering.
---
## Bad Example
INDEX created_at, tenant_id // not leading
---
## Good Example
INDEX tenant_id, created_at // enables partition elimination
---
## Exceptions
Schema-per-tenant or DB-per-tenant isolation.
---
## Consequences Of Violation
Full table scans on every tenant query.

---

## 3. Review And Apply Core Concepts
---
## Category
Design
---
## Rule
Always understand and apply the core concepts documented in this knowledge unit before making implementation decisions.
---
## Reason
Core concepts define the foundational principles that correct implementation depends on.
---
## Bad Example
Implementing without understanding core concepts.
---
## Good Example
Reviewing core concepts before implementation.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Implementation errors, unexpected behavior.

---

## 4. Consider Architecture Guidelines
---
## Category
Architecture
---
## Rule
Always review the architecture guidelines section when designing systems that involve this knowledge area.
---
## Reason
Architecture guidelines provide decision frameworks for selecting between approaches.
---
## Bad Example
Choosing an approach without comparing alternatives.
---
## Good Example
Using the architecture decision table to make informed choices.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Suboptimal architectural decisions.

---

