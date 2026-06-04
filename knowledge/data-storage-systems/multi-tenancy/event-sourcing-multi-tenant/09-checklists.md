# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.26 Event sourcing in multi-tenant contexts (per-tenant event streams)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tenant-aware projectors applied
- [ ] Tenant-scoped replay applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Global event replay across tenants**: Rebuilding projections from all events overwrites one tenant's read model with another's. Always scope replay to tenant. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Events properly isolated per tenant
- [ ] Projection rebuild scoped to single tenant completes correctly
- [ ] Zero cross-tenant event access possible

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Tenant-aware projectors applied
- [ ] Tenant-scoped replay applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Choose event store isolation: completed
- [ ] For shared store: add `tenant_id` to `stored_events` table, index it, always filter by it completed
- [ ] Create tenant-scoped stream: `$eventStore->streamName('orders', $tenantId)` completed
- [ ] Implement tenant-scoped projection rebuild: `$projection->rebuild(tenantId: $tenantId)` completed
- [ ] Ensure projection queries filter by tenant_id completed

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

- [ ] Global event replay across tenants**: Rebuilding projections from all events overwrites one tenant's read model with another's. Always scope replay to tenant. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Events tagged with tenant_id in shared store
- [ ] Projections filter by tenant_id
- [ ] Rebuild scoped to single tenant
- [ ] Cross-tenant event access blocked
- [ ] Command rebuilds projection for specified tenant only
- [ ] Events properly isolated per tenant
- [ ] Projection rebuild scoped to single tenant completes correctly
- [ ] Zero cross-tenant event access possible
- [ ] Projection rebuild for single tenant completes correctly
- [ ] Other tenants unaffected by rebuild

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
- [ ] Projection rebuild replays all tenants' events (slow and data leak) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Global event replay across tenants**: Rebuilding projections from all events overwrites one tenant's read model with another's. Always scope replay to tenant. prevented

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
