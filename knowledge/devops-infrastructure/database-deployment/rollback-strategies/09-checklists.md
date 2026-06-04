# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** rollback-strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Shadow table pattern understood (pt-online-schema-change or gh-ost)
- [ ] 3-deploy phased schema evolution strategy defined
- [ ] Migration throttling configured to manage replication lag
- [ ] MySQL `ALTER TABLE` locking problem acknowledged
- [ ] `pt-online-schema-change` or `gh-ost` installed and tested
- [ ] Large table migration plan documented

---

# Architecture Checklist

- [ ] Shadow table pattern designed (create new table, migrate data, swap)
- [ ] 3-deploy phased evolution designed (add -> use -> remove)
- [ ] Migration throttling strategy defined (replication lag threshold)
- [ ] Tool selected (pt-osc for Percona users, gh-ost for GitHub-style)
- [ ] Lock wait timeout configured as safety net

---

# Implementation Checklist

- [ ] `pt-online-schema-change` or `gh-ost` installed on database server
- [ ] Phased migration written (Deploy 1: add column nullable; Deploy 2: populate + make required; Deploy 3: drop old)
- [ ] Migration throttling parameters configured (max-lag, check-interval)
- [ ] Dry-run mode tested before production execution
- [ ] Rollback plan for each phase (reverse migration)
- [ ] Replication lag monitoring configured during migration

---

# Performance Checklist

- [ ] Shadow table migration tested on production-scale data volume
- [ ] Chunk size tuned for optimal throughput (500-2000 rows typical)
- [ ] Replication lag threshold set (1-5 seconds)
- [ ] Peak-traffic migration avoided (schedule during low traffic)
- [ ] Table size estimated before choosing strategy

---

# Security Checklist

- [ ] Database credentials stored as secrets
- [ ] pt-osc/gh-ost run from secure jump host (not public)
- [ ] Migration tool permissions scoped to single database
- [ ] Audit log enabled for DDL operations
- [ ] Rollback capability confirmed (reverse migration defined)

---

# Reliability Checklist

- [ ] Migration throttling active (stop if replication lag > threshold)
- [ ] Dry-run executed before production (--dry-run or --execute=false)
- [ ] Abort procedure defined (Ctrl+C or kill migration tool)
- [ ] Backup created before migration
- [ ] Replication lag dashboard monitored during migration

---

# Testing Checklist

- [ ] pt-osc/gh-ost tested on staging with similar data volume
- [ ] Phased migration tested end-to-end (all 3 deploys)
- [ ] Throttling verified (introduce lag, confirm throttle)
- [ ] Rollback tested (reverse migration)
- [ ] Table size measured for impact assessment

---

# Maintainability Checklist

- [ ] Migration strategy documented per table (small tables use ALTER, large use pt-osc)
- [ ] Phased deployment timeline documented
- [ ] pt-osc/gh-ost version pinned in requirements
- [ ] Runbook created for zero-downtime migration execution
- [ ] Table inventory with row counts maintained

---

# Anti-Pattern Prevention Checklist

- [ ] No direct `ALTER TABLE` on large production tables
- [ ] No migration without throttling configured
- [ ] No schema change without backward compatibility (Deploy 1: add, not rename)
- [ ] No migration during peak traffic hours
- [ ] No unmonitored migration (always watch replication lag)

---

# Production Readiness Checklist

- [ ] pt-osc/gh-ost tested and ready on production DB
- [ ] Replication lag monitoring active
- [ ] Backup completed before migration window
- [ ] Migration script with dry-run pre-check
- [ ] Abort and rollback procedures documented
- [ ] Team notified of migration window

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: shadow table pattern, 3-deploy phases designed
- [ ] Security requirements satisfied: credentials secured, permissions scoped, audit
- [ ] Performance requirements satisfied: chunk size, throttling, timing tuned
- [ ] Testing requirements satisfied: staging test, dry-run, rollback, throttling verified
- [ ] Anti-pattern checks passed: no ALTER on large tables, throttling active, backward compatible
- [ ] Production readiness verified: backup, monitoring, team notification, abort procedure

---

# Related References

- Database Migration in CI (KU-019) -- migration execution in deployment
- Envoyer Zero-Downtime Deployments (KU-003) -- migration ordering
- Kubernetes for Laravel (KU-013) -- migration Job pattern for zero-downtime
- Performance optimization (cross-domain) -- query optimization for minimal lock contention
