# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.10 Tenant provisioning and lifecycle (create, migrate, seed, deactivate, archive, delete)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Provisioning pipeline applied
- [ ] Deletion gate applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Synchronous provisioning**: User signs up, waits 30s for migrations and seeding. Queue provisioning; show "setting up your workspace" screen. prevented
- [ ] No archival before deletion**: Accidental permanent delete without backup. Always archive before delete. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] New tenant provisioned and accessible within 10 seconds (sync)
- [ ] Zero provisioning failures due to race conditions or timeouts
- [ ] All provisioned resources are monitored and accounted for

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Provisioning pipeline applied
- [ ] Deletion gate applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create tenant record in central database with `provisioning` status completed
- [ ] Provision isolation resources: completed
- [ ] Run migrations against tenant's schema/database completed
- [ ] Seed default data (settings, roles, categories, default content) completed
- [ ] Initialize tenant-specific infrastructure: completed

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

- [ ] Synchronous provisioning**: User signs up, waits 30s for migrations and seeding. Queue provisioning; show "setting up your workspace" screen. prevented
- [ ] No archival before deletion**: Accidental permanent delete without backup. Always archive before delete. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tenant database/schema created and migrations applied
- [ ] Seed data present and correct
- [ ] Queue routing configured for tenant jobs
- [ ] Cache prefix set and isolated
- [ ] Storage path/bucket created with access
- [ ] New tenant provisioned and accessible within 10 seconds (sync)
- [ ] Zero provisioning failures due to race conditions or timeouts
- [ ] All provisioned resources are monitored and accounted for
- [ ] Tenant deactivated within 5 seconds of request
- [ ] Archival completes within retention period SLA

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
- [ ] Provisioning times out â€” tenant stuck in `provisioning` state prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Synchronous provisioning**: User signs up, waits 30s for migrations and seeding. Queue provisioning; show "setting up your workspace" screen. prevented
- [ ] No archival before deletion**: Accidental permanent delete without backup. Always archive before delete. prevented

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
