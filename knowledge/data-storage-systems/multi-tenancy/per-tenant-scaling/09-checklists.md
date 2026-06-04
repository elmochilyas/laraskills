# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.16 Per-tenant scaling (whale tenants on dedicated resources)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Multi-tier isolation model applied
- [ ] Automated whale promotion applied
- [ ] Gradual resource increase applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Treating all tenants equally**: One tenant at 10x the average consumption degrades experience for everyone. Whale tenants must pay more or move to dedicated resources. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Whale tenants automatically detected and migrated
- [ ] Zero data loss during any isolation escalation
- [ ] Tenant performance improves to within platform average after migration

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Multi-tier isolation model applied
- [ ] Automated whale promotion applied
- [ ] Gradual resource increase applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Monitor per-tenant metrics: storage, query volume, IOPS, connection count completed
- [ ] Flag tenants exceeding 2× platform median for any metric completed
- [ ] Evaluate isolation escalation options: completed
- [ ] Schedule migration during low-usage window completed
- [ ] Execute migration: export data, create new isolation layer, import, verify, switch completed

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

- [ ] Treating all tenants equally**: One tenant at 10x the average consumption degrades experience for everyone. Whale tenants must pay more or move to dedicated resources. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Whale detection thresholds configured and accurate
- [ ] Migration pipeline tested for each isolation escalation path
- [ ] Tenant performance improves after migration
- [ ] Downtime during migration is within SLA
- [ ] All tiers have clear resource limits and triggering conditions
- [ ] Whale tenants automatically detected and migrated
- [ ] Zero data loss during any isolation escalation
- [ ] Tenant performance improves to within platform average after migration
- [ ] All tenants have an appropriate isolation tier based on their usage
- [ ] Escalation is automatic and within SLA

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
- [ ] Whale detection too aggressive â€” tenant migrated unnecessarily prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Treating all tenants equally**: One tenant at 10x the average consumption degrades experience for everyone. Whale tenants must pay more or move to dedicated resources. prevented

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
