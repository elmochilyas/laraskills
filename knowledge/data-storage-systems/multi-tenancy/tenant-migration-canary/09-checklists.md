# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.29 Tenant migration priority and canary rollout
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tenant ring assignment applied
- [ ] Migration window per ring applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Rolling migrations to all tenants simultaneously**: A bad migration corrupts all tenants' data. Canary rollout limits blast radius to a small subset. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Canary detection prevents bad migration from reaching > 5% of tenants
- [ ] Rollback is tested and verified for each migration
- [ ] Zero production incidents from tenant migrations

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Tenant ring assignment applied
- [ ] Migration window per ring applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Assign tenants to rings: completed
- [ ] Apply migration to canary group, monitor for 15 minutes completed
- [ ] Check: error rate change, performance metrics, data integrity completed
- [ ] If canary OK, proceed to Ring 1, monitor 15 minutes completed
- [ ] Continue through rings, monitoring between each completed

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

- [ ] Rolling migrations to all tenants simultaneously**: A bad migration corrupts all tenants' data. Canary rollout limits blast radius to a small subset. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Canary group defined and migrations applied
- [ ] Monitoring thresholds configured and tested
- [ ] Rollback tested for each phase
- [ ] All rings processed with cooldown between
- [ ] Monitoring thresholds configured
- [ ] Canary detection prevents bad migration from reaching > 5% of tenants
- [ ] Rollback is tested and verified for each migration
- [ ] Zero production incidents from tenant migrations
- [ ] Rollback triggered within 60 seconds of threshold breach
- [ ] Rollback completes within deployment window

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
- [ ] Canary group doesn't include diverse schemas â€” misses edge cases prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Rolling migrations to all tenants simultaneously**: A bad migration corrupts all tenants' data. Canary rollout limits blast radius to a small subset. prevented

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
