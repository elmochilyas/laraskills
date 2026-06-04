# 1-21 Multi Tenant Migration Orchestration - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | schema |
| Knowledge Unit ID | 1-21 | |
| Knowledge Unit | 1-21 Multi Tenant Migration Orchestration |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Test Migrations Before Production
---
## Category
Testing
---
## Rule
Always test ALL migrations on a production-scale staging database before deploying.
---
## Reason
Migration behavior differs dramatically between small dev DB and production-scale data. A migration that takes 1 second in dev may take 30 minutes in production.
---
## Bad Example
Testing migrations only on an empty local database.
---
## Good Example
Replaying migrations on a production-size clone and measuring execution time.
---
## Exceptions
Trivial metadata-only migrations (add column, no default).
---
## Consequences Of Violation
Production downtime from unexpectedly slow or locking migrations.

---

## 2. Never Use Eloquent Models Inside Migrations
---
## Category
Maintainability
---
## Rule
Never reference Eloquent models or classes in migration files.
---
## Reason
Models change over time. A migration referencing a model will break when the model is refactored or deleted.
---
## Bad Example
User::where('status', 'active')->update(['type' => 'customer']); // in a migration
---
## Good Example
DB::table('users')->where('status', 'active')->update(['type' => 'customer']);
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Broken fresh migrations, failed CI/CD pipelines.

---

## 3. Separate Schema Changes From Data Changes
---
## Category
Code Organization
---
## Rule
Never mix schema DDL and data DML in the same migration file.
---
## Reason
Coupling schema and data changes in one migration prevents partial rollback and complicates debugging.
---
## Bad Example
Schema::create('roles', ...); DB::table('roles')->insert([...]); // in same file
---
## Good Example
// Migration 1: create_roles_table. Migration 2: seed_roles_data.
---
## Exceptions
Small lookup tables (<20 rows) that define the schema.
---
## Consequences Of Violation
Complex rollbacks, unrecoverable migration states.

---

## 4. Never Trust Tenant ID From Request
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

## 5. Always Index Tenant ID As Leading Column
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

