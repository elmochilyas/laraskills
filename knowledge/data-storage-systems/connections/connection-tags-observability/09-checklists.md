# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.8 Connection tags and observability (application_name, per-connection metadata)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always set application_name in config applied
- [ ] Include tenant identifier for multi-tenant apps applied
- [ ] Tag connection purpose, not just application name applied
- [ ] Handle transaction pooling tag loss applied
- [ ] Log connection tags in slow query log applied
- [ ] `application_name` (PostgreSQL) or equivalent (MySQL) is configured in database.php
- [ ] Multi-tenant apps override the tag per-request with tenant ID
- [ ] Purpose-specific tags are set for web, Horizon, and reporting connections
- [ ] No sensitive data (passwords, PII, tokens) in connection tags
- [ ] PgBouncer transaction mode handles tag persistence correctly
- [ ] No connection tags at all prevented
- [ ] Tags in transaction pooling without per-transaction SET prevented
- [ ] Sensitive data in tags prevented
- [ ] Tags too vague prevented
- [ ] No tag in Horizon workers prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Every connection has an identifiable purpose tag
- [ ] Multi-tenant connections include tenant ID
- [ ] No sensitive data in connection tags

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always set application_name in config applied
- [ ] Include tenant identifier for multi-tenant apps applied
- [ ] Tag connection purpose, not just application name applied
- [ ] Handle transaction pooling tag loss applied
- [ ] Log connection tags in slow query log applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Set default `application_name` in config/database.php: completed
- [ ] For PostgreSQL, set per-request tags in middleware: completed
- [ ] For MySQL, use session variables: completed
- [ ] Tag connections by purpose in Horizon worker config: completed
- [ ] Handle PgBouncer transaction pooling tag loss: completed

---

# Performance Checklist

- [ ] Performance: `SET application_name` adds ~0.1ms per statement. Negligible impact.
- [ ] Performance: For transaction pooling, setting on every transaction start adds minimal overhead but ensures correct tagging.
- [ ] Performance: Tagging does not increase connection memory or database load — it only adds metadata to existing connection tracking.
- [ ] Performance: Structured tags with high cardinality (e.g., `user:12345`) create many unique values in `application_name`. This is fine — PostgreSQL does not inde...

---

# Security Checklist

- [ ] Security: Tags are visible in `pg_stat_activity` and database logs. Avoid including sensitive data (passwords, tokens, PII) in tags.
- [ ] Security: Tagging with tenant IDs is acceptable (tenant ID is not secret information).
- [ ] Security: If tags include user IDs, ensure this doesn't violate privacy requirements or data minimization principles.
- [ ] Security: Connection tags are readable by anyone with database access (pg_stat_activity). Restrict database monitoring access appropriately.

---

# Reliability Checklist

- [ ] No connection tags at all prevented
- [ ] Tags in transaction pooling without per-transaction SET prevented
- [ ] Sensitive data in tags prevented
- [ ] Tags too vague prevented
- [ ] No tag in Horizon workers prevented

---

# Testing Checklist

- [ ] `application_name` (PostgreSQL) or equivalent (MySQL) is configured in database.php
- [ ] Multi-tenant apps override the tag per-request with tenant ID
- [ ] Purpose-specific tags are set for web, Horizon, and reporting connections
- [ ] No sensitive data (passwords, PII, tokens) in connection tags
- [ ] PgBouncer transaction mode handles tag persistence correctly
- [ ] `application_name` or equivalent configured in database.php
- [ ] Multi-tenant apps override the tag per-request with tenant ID
- [ ] Purpose-specific tags set for web, Horizon, reporting connections
- [ ] No sensitive data in connection tags
- [ ] PgBouncer transaction mode handles tag persistence correctly
- [ ] Every connection has an identifiable purpose tag
- [ ] Multi-tenant connections include tenant ID
- [ ] No sensitive data in connection tags
- [ ] Tags persist correctly through PgBouncer transaction pooling
- [ ] Monitoring dashboards can filter by connection tags

---

# Maintainability Checklist

- [ ] Always set application_name in config applied
- [ ] Tag connection purpose, not just application name applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] No tagging on migration connections prevented
- [ ] No connection tags at all â€” all connections appear as "PHP" or "PostgreSQL" prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Static tags in dynamic environments prevented
- [ ] No connection tags at all prevented
- [ ] Tags in transaction pooling without per-transaction SET prevented
- [ ] Sensitive data in tags prevented
- [ ] Tags too vague prevented
- [ ] No tag in Horizon workers prevented

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
