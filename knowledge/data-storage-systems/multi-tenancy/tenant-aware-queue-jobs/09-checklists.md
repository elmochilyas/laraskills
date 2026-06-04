# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.7 Tenant-aware queue jobs (tenant_id in payload, re-bind context in handle)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] TenantAware job base class applied
- [ ] queue:work per tenant (high isolation) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Forgetting to rebind context**: Job runs but queries are unscoped or in wrong database. Hardest-to-detect cross-tenant leak. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] All tenant-scoped jobs execute with correct tenant context
- [ ] Zero jobs processed in wrong tenant context
- [ ] Horizon dashboard shows per-tenant job metrics

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] TenantAware job base class applied
- [ ] queue:work per tenant (high isolation) applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create a `TenantAware` base job class with `public $tenantId` property completed
- [ ] In the constructor, store `$this->tenantId = tenant()->id` completed
- [ ] In `handle()`, call `$this->rebindTenantContext()` before business logic completed
- [ ] `rebindTenantContext()`: sets `app(CurrentTenant::class)`, configures DB connection, purges stale connection completed
- [ ] Tag Horizon jobs: `$this->tags = ['tenant:'.$this->tenantId]` for per-tenant monitoring completed

---

# Performance Checklist

- [ ] Performance: Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Forgetting to rebind context**: Job runs but queries are unscoped or in wrong database. Hardest-to-detect cross-tenant leak. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tenant ID is serialized in job payload
- [ ] Context is rebound before any logic executes in handle()
- [ ] Jobs are tagged with tenant ID for monitoring
- [ ] Failed jobs include tenant context for debugging
- [ ] Per-tenant queues are configured in Horizon
- [ ] All tenant-scoped jobs execute with correct tenant context
- [ ] Zero jobs processed in wrong tenant context
- [ ] Horizon dashboard shows per-tenant job metrics
- [ ] No tenant can starve another tenant's job processing
- [ ] Per-tenant queue metrics available and monitored

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Tenant ID not serialized â€” job runs in wrong or no tenant context prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Forgetting to rebind context**: Job runs but queries are unscoped or in wrong database. Hardest-to-detect cross-tenant leak. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
