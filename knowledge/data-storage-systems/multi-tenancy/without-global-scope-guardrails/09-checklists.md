# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.12 withoutGlobalScope guardrails (permitted uses, review requirements)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Annotations/comments applied
- [ ] Custom withoutGlobalScopeFor macro applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] withoutGlobalScope in feature queries**: "Just this one time, I need all tenants' data for a dashboard." — Instead, add a dedicated admin query with explicit authorization. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Zero unauthorized scope bypass calls in production
- [ ] All scope bypass calls are documented, justified, and reviewed
- [ ] CI pipeline flags and blocks new bypass calls without review

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Annotations/comments applied
- [ ] Custom withoutGlobalScopeFor macro applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Audit all existing `withoutGlobalScope()` calls in the codebase completed
- [ ] For each call, verify it has a documented justification comment completed
- [ ] Categorize each call as permitted or prohibited: completed
- [ ] Add authorization check before scope bypass in critical operations completed
- [ ] Create an isolation index that tracks the tenant ID via query log completed

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

- [ ] withoutGlobalScope in feature queries**: "Just this one time, I need all tenants' data for a dashboard." — Instead, add a dedicated admin query with explicit authorization. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All `withoutGlobalScope()` calls have documented justification
- [ ] No user-facing endpoints use `withoutGlobalScope()`
- [ ] Admin-only operations with scope bypass have proper authorization
- [ ] CI rule flags new scope bypass calls for mandatory review
- [ ] CI pipeline blocks PRs with new lint violations
- [ ] Zero unauthorized scope bypass calls in production
- [ ] All scope bypass calls are documented, justified, and reviewed
- [ ] CI pipeline flags and blocks new bypass calls without review
- [ ] Zero new lint violations across all PRs
- [ ] Existing violations resolved or baselined within 30 days

---

# Maintainability Checklist

- [ ] Annotations/comments applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Developer adds scope bypass for convenience without realizing the risk prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] withoutGlobalScope in feature queries**: "Just this one time, I need all tenants' data for a dashboard." — Instead, add a dedicated admin query with explicit authorization. prevented

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
