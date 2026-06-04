# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.27 Per-tenant database backups and restore
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Backup schedule per tier applied
- [ ] Self-service restore applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using only shared database snapshots**: Snapshot contains all tenants' data. Restoring for one tenant requires restoring all tenants. Use per-tenant dumps for independent restore. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Per-tenant backup completes within backup window
- [ ] Restore for single tenant completes within SLA (e.g., 4 hours)
- [ ] Zero cross-tenant data contamination during restore

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Backup schedule per tier applied
- [ ] Self-service restore applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] For DB-per-tenant: use `pg_dump -d tenant_db_name` or `mysqldump tenant_db_name` per tenant completed
- [ ] For shared-table: export data filtered by tenant_id: `SELECT * INTO OUTFILE ... WHERE tenant_id = ?` completed
- [ ] Name backup files with tenant ID and timestamp: `backup_{tenant_id}_{YYYYMMDDHHMMSS}.sql` completed
- [ ] Store backups in tenant-scoped storage path: `backups/{tenant_id}/{filename}` completed
- [ ] Schedule backup per tenant based on plan (daily for pro, hourly for enterprise) completed

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

- [ ] Using only shared database snapshots**: Snapshot contains all tenants' data. Restoring for one tenant requires restoring all tenants. Use per-tenant dumps for independent restore. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Per-tenant backup files generated correctly
- [ ] Restore process restores only the specified tenant
- [ ] Backup retention enforced per schedule
- [ ] Restore tested and verified for data integrity
- [ ] Cross-tenant data isolation verified after restore
- [ ] Per-tenant backup completes within backup window
- [ ] Restore for single tenant completes within SLA (e.g., 4 hours)
- [ ] Zero cross-tenant data contamination during restore
- [ ] Backup retention enforced and monitored
- [ ] All tenants backed up within their schedule window

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
- [ ] Shared-table backup includes all tenants' data (not per-tenant) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using only shared database snapshots**: Snapshot contains all tenants' data. Restoring for one tenant requires restoring all tenants. Use per-tenant dumps for independent restore. prevented

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
