# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.8 Tenant-aware commands (--tenant option, batch processing)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] TenantCommand base class applied
- [ ] Error isolation applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No progress output**: Multi-tenant commands processing 1000+ tenants run for hours with no feedback. Always show progress. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Commands run correctly for single or all tenants
- [ ] One tenant failure doesn't block others
- [ ] Progress visible and actionable in CLI output

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] TenantCommand base class applied
- [ ] Error isolation applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create base `TenantCommand` class extending `Command` completed
- [ ] Add `--tenant` option: `{--tenant= : The tenant ID to run for}` completed
- [ ] In `handle()`, if `--tenant` is provided, run for that single tenant completed
- [ ] If no `--tenant`, iterate all tenants, bind context per iteration completed
- [ ] Provide progress feedback: `$this->output->progressStart(count($tenants))` completed

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

- [ ] No progress output**: Multi-tenant commands processing 1000+ tenants run for hours with no feedback. Always show progress. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `--tenant` option works for single-tenant execution
- [ ] Batch mode iterates all tenants without failing on individual errors
- [ ] Progress feedback visible during batch execution
- [ ] Context rebound correctly per tenant iteration
- [ ] Iterator works for all tenant isolation models
- [ ] Commands run correctly for single or all tenants
- [ ] One tenant failure doesn't block others
- [ ] Progress visible and actionable in CLI output
- [ ] Iterator handles 1000+ tenants without memory issues
- [ ] Error isolation prevents single tenant failure from stopping batch

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
- [ ] Shared state between tenant iterations (static variables, cached data) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No progress output**: Multi-tenant commands processing 1000+ tenants run for hours with no feedback. Always show progress. prevented

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
