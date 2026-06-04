# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** database-migration-ci
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Migration idempotency verified (safe to run multiple times)
- [ ] `--force` flag configured in CI/CD pipeline for production
- [ ] Migration ordering relative to code deployment determined
- [ ] Forward-compatible migration pattern implemented
- [ ] Symlink-swap vs K8s Job vs Vapor hook migration strategy selected
- [ ] Rollback migration tested (artisan migrate:rollback)

---

# Architecture Checklist

- [ ] Forward-compatible migration pattern designed (add columns, remove later)
- [ ] Deployment migration ordering defined (before or after symlink swap)
- [ ] Zero-downtime tension addressed (old + new code during deployment)
- [ ] Platform-specific strategy selected (Envoyer symlink, K8s Job, Vapor hook)
- [ ] Rollback procedure designed

---

# Implementation Checklist

- [ ] Migrations written with idempotent patterns (`updateOrCreate`, schema checks)
- [ ] `php artisan migrate --force` in CI/CD pipeline
- [ ] Deployment script places migration step at correct position
- [ ] CI/CD pipeline has separate migration job/stage
- [ ] Rollback migration (`down` method) included for each change
- [ ] Migration tested on staging with production-like data volume

---

# Performance Checklist

- [ ] Large table schema changes evaluated for lock impact
- [ ] Data migrations use chunked processing (Model::chunk)
- [ ] Migration execution time measured (target under 30s)
- [ ] Index creation strategy evaluated (online operations)
- [ ] Lock wait timeout configured for critical tables

---

# Security Checklist

- [ ] Database credentials stored as CI/CD secrets
- [ ] `--force` only used in automated pipelines (not local)
- [ ] Migration files reviewed for SQL injection
- [ ] Production database target confirmed
- [ ] Rollback capability confirmed before apply

---

# Reliability Checklist

- [ ] Failed migration plan documented (no auto-rollback)
- [ ] Idempotent migrations prevent duplicate issues
- [ ] Database backup before production migration
- [ ] Migration checkpoint strategy for multi-step changes
- [ ] Rollback tested in staging

---

# Testing Checklist

- [ ] All migrations pass in CI pipeline
- [ ] Idempotency verified (run twice, no errors)
- [ ] Rollback tested (migrate:rollback reverts correctly)
- [ ] `--force` tested in CI environment
- [ ] Migration timing measured under production data volume

---

# Maintainability Checklist

- [ ] Migration naming convention followed consistently
- [ ] Each migration does one logical change
- [ ] Raw SQL migrations documented
- [ ] Rollback migration always tested
- [ ] Migration runbook documented

---

# Anti-Pattern Prevention Checklist

- [ ] No batch data migrations without chunk processing
- [ ] No long-locking schema changes on large tables
- [ ] No migrations without `down` method
- [ ] No `--force` without verifying DB target
- [ ] No migration after code swap that breaks old code

---

# Production Readiness Checklist

- [ ] Production database backed up before migration
- [ ] Migration tested on staging with production data volume
- [ ] Rollback migration tested
- [ ] CI/CD pipeline runs migrations as separate step
- [ ] Migration execution timed (<30s)
- [ ] Rollback plan documented

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: forward-compatible, deployment ordering designed
- [ ] Security requirements satisfied: credentials in secrets, --force in CI only
- [ ] Performance requirements satisfied: chunking, lock management, timing measured
- [ ] Testing requirements satisfied: CI run, idempotency, rollback, --force verified
- [ ] Anti-pattern checks passed: no long locks, no --force misuse, down methods present
- [ ] Production readiness verified: backup, staging test, rollback plan ready

---

# Related References

- Zero-Downtime Migration Strategies (KU-020) -- advanced patterns for large schema changes
- Envoyer Zero-Downtime Deployments (KU-003) -- migration ordering in deployment flow
- Kubernetes for Laravel (KU-013) -- migration Job pattern
- Laravel Vapor (KU-015) -- migration in deploy hooks
