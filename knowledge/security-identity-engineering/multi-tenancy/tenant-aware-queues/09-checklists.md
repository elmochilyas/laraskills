# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Tenant-aware queues and job context
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Batch jobs without individual tenant context**: Each job in a batch must carry its own tenant ID
- [ ] Prevent anti-pattern: Admin-distpached jobs not documented**: System-level jobs should be explicitly marked as tenant-agnostic
- [ ] Prevent anti-pattern: No tests for queue tenant context isolation**: Writing tests is essential to verify correct propagation
- [ ] Tenant ID serialized in every job payload
- [ ] Context restored before job execution
- [ ] Job fails if tenant context cannot be initialized
- [ ] Cross-tenant data access tested in CI
- [ ] Queue worker restart does not leak tenant context across jobs
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting tenant_id in job payload
- [ ] Avoid: Not restoring context in handle()

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- stancl/tenancy: jobs dispatched inside a tenant request automatically include tenant ID
- Manual approach: job constructor receives and stores `$tenantId`; `handle()` calls `tenancy()->initialize()`
- Jobs dispatched from admin context (no tenant) should explicitly pass a tenant ID
- Batch jobs: each job in a batch must carry its own tenant context
- Failed jobs: retry should still restore tenant context (stored in serialized payload)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Tenant ID serialized in every job payload
- [ ] - [ ] Context restored before job execution
- [ ] - [ ] Job fails if tenant context cannot be initialized
- [ ] - [ ] Cross-tenant data access tested in CI

# Performance Checklist
- Tenant context restoration: ~1-5ms per job initialization
- No additional load on the queue worker â€” context is restored per-job
- Serialization overhead: `tenant_id` string in job payload â€” negligible

# Security Checklist
- **Missing Tenant Context = Data Leak**: A job without tenant context runs queries without tenant scoping. Returns ALL tenants' data â€” or writes to the wrong tenant.
- **Cross-Tenant Contamination**: A job dispatched from a tenant request but processed in a different tenant context operates on wrong data.
- **Job Failure with Wrong Context**: If context restoration fails half-way, partial operations may affect wrong tenants. Use database transactions.
- **Admin Queue Jobs**: Admin-dispatched jobs (e.g., global system maintenance) should explicitly not have tenant context. Document which jobs are intentionally tenant-agnostic.

# Reliability Checklist
- [ ] Ensure: Tenant-aware queues ensure that queue jobs execute in the correct tenant context...

# Testing Checklist
- [ ] Tenant ID serialized in every job payload
- [ ] Context restored before job execution
- [ ] Job fails if tenant context cannot be initialized
- [ ] Cross-tenant data access tested in CI
- [ ] Queue worker restart does not leak tenant context across jobs
- [ ] Audit log includes tenant context for queued operations
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting tenant_id in job payload
- [ ] Avoid: Not restoring context in handle()

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Batch jobs without individual tenant context**: Each job in a batch must carry its own tenant ID
- [ ] Prevent: Admin-distpached jobs not documented**: System-level jobs should be explicitly marked as tenant-agnostic
- [ ] Prevent: No tests for queue tenant context isolation**: Writing tests is essential to verify correct propagation
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Forgetting tenant_id in job payload
- [ ] Avoid mistake: Not restoring context in handle()
- [ ] Avoid mistake: Processing job without context
- [ ] Avoid mistake: Using global state for tenant context

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Batch jobs without individual tenant context**: Each job in a batch must carry its own tenant ID
- Admin-distpached jobs not documented**: System-level jobs should be explicitly marked as tenant-agnostic
- No tests for queue tenant context isolation**: Writing tests is essential to verify correct propagation
## Skills
- Implement Tenant-Aware Queue Jobs for Cross-Tenant Data Safety


