# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.28 Deployment stamp pattern (full infrastructure per tenant group)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Stamp sizing applied
- [ ] Stamp distribution across regions applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Under-provisioned stamp resources**: Each stamp needs enough headroom for traffic spikes. Under-provisioning causes noisy neighbor within the stamp. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Each stamp is fully independent and isolated
- [ ] Tenant routed to correct stamp with zero cross-stamp access
- [ ] Stamp deployment complete within 30 minutes via IaC

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Stamp sizing applied
- [ ] Stamp distribution across regions applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Design stamp as a reusable IaC module: database, cache, queue, app server(s), LB completed
- [ ] Assign tenant groups to stamps (enterprise → dedicated stamp, medium → shared stamp) completed
- [ ] Deploy stamp using IaC: `terraform apply -var="tenant_group=enterprise"` completed
- [ ] Configure routing: DNS or LB routes tenant's requests to their stamp completed
- [ ] Migrate tenant data to new stamp if reassigning completed

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

- [ ] Under-provisioned stamp resources**: Each stamp needs enough headroom for traffic spikes. Under-provisioning causes noisy neighbor within the stamp. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Stamp deploys with all required components
- [ ] Tenant correctly routed to their stamp
- [ ] No cross-stamp data access possible
- [ ] Per-stamp monitoring configured
- [ ] Per-stamp backup configured
- [ ] Each stamp is fully independent and isolated
- [ ] Tenant routed to correct stamp with zero cross-stamp access
- [ ] Stamp deployment complete within 30 minutes via IaC
- [ ] All tenant requests correctly routed to their stamp
- [ ] Stamp migration completes within DNS TTL

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
- [ ] Stamp template missing component (no cache, no queue worker) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Under-provisioned stamp resources**: Each stamp needs enough headroom for traffic spikes. Under-provisioning causes noisy neighbor within the stamp. prevented

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
