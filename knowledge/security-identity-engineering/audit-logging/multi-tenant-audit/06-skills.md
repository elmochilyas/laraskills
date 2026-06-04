# Skill: Implement Multi-Tenant Audit Logging with Tenant Isolation

## Purpose
Configure audit logging in multi-tenant applications so each tenant's activity log is isolated, scoped, and queryable without cross-tenant data leakage.

## When To Use
- Multi-tenant applications requiring audit logging per tenant
- SaaS platforms where tenants must not see other tenants' activity
- Compliance requiring tenant-scoped audit trail retention
- Tenant-specific audit export requirements

## When NOT To Use
- Single-tenant applications (no tenant isolation needed)
- Centralized operations logging (platform-level, not tenant-level)

## Prerequisites
- Multi-tenancy implementation (stancl/tenancy, shared DB with scopes, or DB-per-tenant)
- Audit logging in place (Spatie Activitylog or compliance package)

## Workflow
1. Ensure tenant context is available when logging — attach `tenant_id` to every log entry
2. For shared-database: add `tenant_id` column to activity log table and filter queries
3. For DB-per-tenant: activity logs are naturally isolated per database
4. Create tenant-scoped activity log retrieval: `Activity::where('tenant_id', tenancy()->tenantId())`
5. Implement tenant-specific retention policies (some tenants may require longer retention)
6. Provide tenant admin UI for viewing own activity logs only
7. Ensure queue jobs log with correct tenant context (queue tenant context propagation)
8. Log platform-level administrative actions with `tenant_id` = null for cross-tenant operations

## Validation Checklist
- [ ] `tenant_id` attached to every tenant-scoped log entry
- [ ] Activity queries scoped to current tenant
- [ ] Tenant admin UI only shows own tenant's logs
- [ ] Queue jobs restore tenant context before logging
- [ ] Retention policies configurable per tenant
- [ ] Cross-tenant data leakage tested in CI
