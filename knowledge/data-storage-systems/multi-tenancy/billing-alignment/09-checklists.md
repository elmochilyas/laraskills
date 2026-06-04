# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.21 Billing alignment with isolation model (DB-per-tenant for spend correlation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tiered pricing with usage caps applied
- [ ] Cloud cost allocation tags applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Flat pricing regardless of usage**: Power users consume 100x resources of light users at same price. Margin erodes. Usage-based pricing aligns cost with revenue. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Cost attribution accuracy > 95% for shared, > 99% for dedicated
- [ ] Billing reports generated within 24 hours of period end
- [ ] Tenants can view up-to-date usage data

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Tiered pricing with usage caps applied
- [ ] Cloud cost allocation tags applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] For DB-per-tenant: collect per-database metrics from RDS/CloudWatch or PostgreSQL `pg_stat_database` completed
- [ ] For shared-table: estimate usage via proxy metrics: rows per tenant, query count per tenant, storage bytes per tenant completed
- [ ] Collect API request counts per tenant (from application logs or middleware) completed
- [ ] Transform raw metrics into billable units: GB-months, million queries, API calls completed
- [ ] Apply rate card to calculate usage cost per tenant completed

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

- [ ] Flat pricing regardless of usage**: Power users consume 100x resources of light users at same price. Margin erodes. Usage-based pricing aligns cost with revenue. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Usage data collected for all tenants
- [ ] Cost attribution is accurate (±5% for shared, ±1% for dedicated)
- [ ] Billing reports generated on schedule
- [ ] Tenants can view their usage in dashboard
- [ ] All tenants have usage metrics collected
- [ ] Cost attribution accuracy > 95% for shared, > 99% for dedicated
- [ ] Billing reports generated within 24 hours of period end
- [ ] Tenants can view up-to-date usage data
- [ ] Per-tenant usage data available within 5 minutes of activity
- [ ] Storage and query metrics accurate within 5%

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
- [ ] Shared-table attribution is inaccurate (all tenants share same pool) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Flat pricing regardless of usage**: Power users consume 100x resources of light users at same price. Margin erodes. Usage-based pricing aligns cost with revenue. prevented

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
