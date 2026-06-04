# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** zero-downtime-migration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] MySQL `ALTER TABLE` locking problem understood (schema locks on large tables)
- [ ] Shadow table pattern selected (pt-online-schema-change or gh-ost)
- [ ] `pt-online-schema-change` or `gh-ost` installed and tested
- [ ] 3-deploy phased schema evolution strategy defined
- [ ] Migration throttling configured (replication lag threshold)
- [ ] Dry-run mode tested before production execution

---

# Architecture Checklist

- [ ] Shadow table pattern designed (trigger-based sync, swap on completion)
- [ ] pt-osc vs gh-ost architecture differences understood
- [ ] 3-deploy phased evolution: Deploy 1 (add column, nullable), Deploy 2 (populate + make required), Deploy 3 (drop old)
- [ ] Migration throttling architecture (replication lag, chunk time, load thresholds)
- [ ] Large table vs small table strategy differentiated

---

# Implementation Checklist

- [ ] pt-osc or gh-ost installed on DB server
- [ ] Phased migration written for each schema change
- [ ] Throttling configured (max-lag 1s, check-interval 100ms)
- [ ] Dry-run mode executed for each production migration
- [ ] Rollback plan defined per phase
- [ ] Replication lag monitoring set up during migrations

---

# Performance Checklist

- [ ] Shadow table tested on production-scale data volume
- [ ] Chunk size tuned (500-2000 rows per chunk)
- [ ] Replication lag threshold: 1-5 seconds
- [ ] Migration scheduled during low-traffic window
- [ ] Table size measured to estimate migration duration

---

# Security Checklist

- [ ] Migration tool runs from secure host
- [ ] DB credentials stored as secrets
- [ ] Tool permissions scoped to single database
- [ ] DDL audit logging enabled
- [ ] Rollback plan confirmed before execution

---

# Reliability Checklist

- [ ] Throttling stops migration if replication lag exceeds threshold
- [ ] Dry-run executed first (no actual changes)
- [ ] Abort procedure defined (Ctrl+C kills gracefully)
- [ ] Backup completed before migration
- [ ] Replication lag monitored in real-time

---

# Testing Checklist

- [ ] pt-osc/gh-ost tested on staging with production data volume
- [ ] Phased migration tested end-to-end
- [ ] Throttling verified (simulate lag, confirm pause)
- [ ] Rollback tested (reverse phase)
- [ ] Table size measured for strategy decisions

---

# Maintainability Checklist

- [ ] Small vs large table migration strategy documented
- [ ] Phased deployment timeline documented
- [ ] Tool version pinned (pt-osc/gh-ost)
- [ ] Migration runbook created
- [ ] Table inventory with row counts maintained

---

# Anti-Pattern Prevention Checklist

- [ ] No `ALTER TABLE` on tables > 1M rows without shadow tool
- [ ] No migration without throttling
- [ ] No backward-incompatible schema change (add, don't rename)
- [ ] No migration during peak hours
- [ ] No migration without replication lag monitoring

---

# Production Readiness Checklist

- [ ] Migration tool installed and tested on production
- [ ] Replication lag monitoring active
- [ ] Database backup completed
- [ ] Migration script includes dry-run step
- [ ] Abort and rollback procedures documented
- [ ] Team notified of migration window

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: shadow table or 3-deploy phased strategy chosen
- [ ] Security requirements satisfied: credentials secured, tool on secure host, scoped perms
- [ ] Performance requirements satisfied: chunk size, throttling, timing for low traffic
- [ ] Testing requirements satisfied: staging with production volume, dry-run, throttling
- [ ] Anti-pattern checks passed: no ALTER on big tables, backward compatible changes
- [ ] Production readiness verified: backup, lag monitoring, abort procedure, team notified

---

# Related References

- Database Migration in CI (KU-019) -- migration execution in deployment
- Envoyer Zero-Downtime Deployments (KU-003) -- migration ordering
- Kubernetes for Laravel (KU-013) -- migration Job pattern for zero-downtime
- Performance optimization (cross-domain) -- query optimization for minimal lock contention
