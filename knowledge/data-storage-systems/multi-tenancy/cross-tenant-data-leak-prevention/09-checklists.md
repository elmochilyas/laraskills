# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.11 Cross-tenant data leak prevention (testing, code review, bypass gating)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] TenantPair test helper applied
- [ ] withoutGlobalScope gate applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Zero cross-tenant data leaks in production
- [ ] Isolation tests cover 100% of endpoints
- [ ] All scope bypasses are documented, justified, and limited

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] TenantPair test helper applied
- [ ] withoutGlobalScope gate applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create two tenants with overlapping data (same IDs, similar names) completed
- [ ] For every endpoint, attempt to access Tenant B's data while authenticated as Tenant A completed
- [ ] Test parameter tampering: change `tenant_id`, `organization_id`, or similar in requests completed
- [ ] Test header manipulation: change `X-Tenant-ID` or similar headers completed
- [ ] Test direct IDOR: change resource IDs in URLs to access other tenants' resources completed

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

- [ ] Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Isolation tests cover all endpoints and commands
- [ ] `withoutGlobalScope()` calls are justified and limited
- [ ] Parameter tampering cannot access cross-tenant data
- [ ] Header manipulation is blocked
- [ ] CI pipeline fails on isolation test breach
- [ ] Zero cross-tenant data leaks in production
- [ ] Isolation tests cover 100% of endpoints
- [ ] All scope bypasses are documented, justified, and limited
- [ ] 100% endpoint coverage in isolation tests
- [ ] CI pipeline blocks deployment on isolation failure

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
- [ ] New endpoint added without isolation test prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path. prevented

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
