# Skill: Implement Tenant-Aware Queue Jobs for Cross-Tenant Data Safety

## Purpose
Ensure queue jobs dispatched in a multi-tenant application execute in the correct tenant context to prevent cross-tenant data leakage and ensure data isolation.

## When To Use
- Every multi-tenant Laravel application — any queued job could touch tenant-scoped data
- Jobs sending emails, generating reports, processing uploads
- Any job dispatched from a tenant-scoped request

## When NOT To Use
- Single-tenant applications (no tenant context needed)
- Jobs operating exclusively on non-tenant data

## Prerequisites
- Multi-tenancy implementation (stancl/tenancy or custom)
- Queue system configured (database, Redis, SQS)

## Workflow
1. Ensure tenant context serialization: tenant ID stored in job payload on dispatch
2. For stancl/tenancy: verify automatic context propagation is configured
3. For manual implementation: add `$tenantId` property to each job class
4. Restore tenant context at the start of `handle()`: `tenancy()->initialize($this->tenantId)`
5. Fail job if tenant context cannot be restored — never process without context
6. Test queue tenant context: dispatch job in tenant A → verify it operates on tenant A's data
7. Log tenant context at job start and end for audit trail
8. Handle queue worker restarts: tenant context must be re-initialized per job

## Validation Checklist
- [ ] Tenant ID serialized in every job payload
- [ ] Context restored before job execution
- [ ] Job fails if tenant context cannot be initialized
- [ ] Cross-tenant data access tested in CI
- [ ] Queue worker restart does not leak tenant context across jobs
- [ ] Audit log includes tenant context for queued operations
