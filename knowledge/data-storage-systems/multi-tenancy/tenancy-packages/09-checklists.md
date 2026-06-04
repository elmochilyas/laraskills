# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.24 Packages: stancl/tenancy, spatie/laravel-multitenancy
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] stancl/tenancy for complex isolation applied
- [ ] spatie/multitenancy for simple SaaS applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] stancl/tenancy without understanding the internals**: "The package handles everything" — but without understanding how tenant resolution, connection switching, and scope application work, debugging leaks is impossible. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Package correctly implements required isolation model
- [ ] All required features working in production
- [ ] Team can maintain and extend package behavior

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] stancl/tenancy for complex isolation applied
- [ ] spatie/multitenancy for simple SaaS applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Evaluate stancl/tenancy: completed
- [ ] Evaluate spatie/laravel-multitenancy: completed
- [ ] Compare against requirements: completed
- [ ] Install chosen package and configure per documentation completed
- [ ] Test tenant isolation with package features completed

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

- [ ] stancl/tenancy without understanding the internals**: "The package handles everything" — but without understanding how tenant resolution, connection switching, and scope application work, debugging leaks is impossible. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Package supports required isolation model
- [ ] All required features (queue, cache, filesystem) work correctly
- [ ] Tenant resolution works as expected
- [ ] Package performance meets requirements
- [ ] Package installed and configured
- [ ] Package correctly implements required isolation model
- [ ] All required features working in production
- [ ] Team can maintain and extend package behavior
- [ ] Package fully configured and working in production
- [ ] All isolation models working as expected

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
- [ ] Choosing package that doesn't support required isolation model prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] stancl/tenancy without understanding the internals**: "The package handles everything" — but without understanding how tenant resolution, connection switching, and scope application work, debugging leaks is impossible. prevented

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
