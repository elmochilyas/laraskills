# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.23 Multi-region tenant placement (data residency requirements)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Region-aware connection resolution applied
- [ ] Latency-optimized routing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Single-region deployment for global SaaS**: GDPR fine of 4% of global revenue for storing EU data outside EU. Multi-region is not optional for EU customers. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] All tenant data stored in correct region
- [ ] Zero cross-region data transfer violations
- [ ] Tenant latency optimized for their geographic location

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Region-aware connection resolution applied
- [ ] Latency-optimized routing applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Determine tenant region: from IP geolocation, billing address, or explicit selection completed
- [ ] Provision tenant resources in the selected region: completed
- [ ] Configure tenant's connection to point to region-specific endpoints completed
- [ ] Enforce data residency: block cross-region data transfer unless explicitly allowed completed
- [ ] For cross-region analytics: use CDC with region-to-region replication (Kafka MirrorMaker) completed

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

- [ ] Single-region deployment for global SaaS**: GDPR fine of 4% of global revenue for storing EU data outside EU. Multi-region is not optional for EU customers. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tenant data stored in correct region
- [ ] Cross-region data transfer blocked
- [ ] Analytics pipeline respects region boundaries
- [ ] Region-specific endpoints configured and tested
- [ ] Tenant routed to correct region
- [ ] All tenant data stored in correct region
- [ ] Zero cross-region data transfer violations
- [ ] Tenant latency optimized for their geographic location
- [ ] All tenant requests processed in correct region
- [ ] Zero data residency violations

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
- [ ] Tenant provisioned in wrong region (IP geolocation inaccurate) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Single-region deployment for global SaaS**: GDPR fine of 4% of global revenue for storing EU data outside EU. Multi-region is not optional for EU customers. prevented

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
