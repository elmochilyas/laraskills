# 5-13 Tenant Connection Caching Pooling - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | multi-tenancy |
| Knowledge Unit ID | 5-13 | |
| Knowledge Unit | 5-13 Tenant Connection Caching Pooling |
| Total Rules | 5 |
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

## 3. Deploy Server-Side Pooler For PHP-FPM
---
## Category
Architecture
---
## Rule
Always deploy PgBouncer or ProxySQL for PHP-FPM deployments.
---
## Reason
PHP-FPM can't pool connections. 200 workers = 200 direct connections.
---
## Bad Example
200 PHP-FPM workers directly connecting to PostgreSQL
---
## Good Example
PgBouncer 50 backend connections serving 200 workers via transaction pooling
---
## Exceptions
Octane-only apps.
---
## Consequences Of Violation
Connection exhaustion.

---

## 4. Configure Octane Connection Pool
---
## Category
Performance
---
## Rule
Always configure pool settings for database connections in Octane.
---
## Reason
Without pool config, each Octane request creates a new connection.
---
## Bad Example
No pool config in Octane
---
## Good Example
pool min=2 max=10 ttl=60
---
## Exceptions
PHP-FPM deployments.
---
## Consequences Of Violation
Connection overhead.

---

## 5. Review And Apply Core Concepts
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

