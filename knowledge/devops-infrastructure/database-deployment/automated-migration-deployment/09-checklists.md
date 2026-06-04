# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** automated-migration-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Migration idempotency verified (safe to run multiple times)
- [ ] `--force` flag used in production deployment to bypass confirmation
- [ ] Migration ordering relative to code deployment determined
- [ ] Forward-compatible migration pattern understood (old code works with new schema)
- [ ] Deployment migration strategy selected (symlink-swap, K8s Job, Vapor hook)
- [ ] Rollback migration strategy defined (down method written)

---

# Architecture Checklist

- [ ] Forward-compatible migration pattern designed (add before use, remove after)
- [ ] Deployment migration ordering defined (run before, during, or after code swap)
- [ ] Zero-downtime migration tension addressed (old + new code run simultaneously)
- [ ] Symlink-swap pattern vs K8s Job vs Vapor hook migration approach chosen
- [ ] Rollback migration steps documented

---

# Implementation Checklist

- [ ] Migration files written with both `up` and `down` methods
- [ ] `php artisan migrate --force` added to deployment script
- [ ] Idempotent migration patterns used (`updateOrCreate`, schema checks)
- [ ] Deployment script migration placement decided (before or after symlink swap)
- [ ] CI/CD pipeline executes migrations as separate step
- [ ] Migration dry-run tested in staging before production

---

# Performance Checklist

- [ ] Large table migrations evaluated for lock time impact
- [ ] Batch processing for data migrations (chunk results)
- [ ] Migration execution time measured (target under 30 seconds)
- [ ] Indexes created concurrently where possible (MySQL 8.0+)
- [ ] Lock wait timeout configured for critical migrations

---

# Security Checklist

- [ ] Database credentials stored as secrets (not in migration files)
- [ ] `--force` flag only used in CI/CD, not in local dev
- [ ] Migration files reviewed for SQL injection in raw queries
- [ ] Production database connection confirmed (not staging)
- [ ] Rollback capability confirmed before production apply

---

# Reliability Checklist

- [ ] Failed migration auto-rollback not assumed (manual intervention plan)
- [ ] Idempotent migrations prevent duplicate execution issues
- [ ] Migration checkpoint after each step (partial migration handling)
- [ ] Database backup before production migration
- [ ] Rollback tested in staging

---

# Testing Checklist

- [ ] Migrations pass in CI pipeline (SQLite or dedicated MySQL)
- [ ] Idempotency tested (run migration twice, no errors)
- [ ] Rollback tested (`migrate:rollback` reverts correctly)
- [ ] `--force` flag tested in CI environment
- [ ] Migration timing measured under production-like data volume

---

# Maintainability Checklist

- [ ] Migration naming convention followed (YYYY_MM_DD_HHmmSS)
- [ ] Each migration does one logical change
- [ ] Raw SQL migrations documented with purpose
- [ ] Rollback migration always tested alongside forward migration
- [ ] Migration runbook created for production operations

---

# Anti-Pattern Prevention Checklist

- [ ] No data-only migrations without batch processing (avoid memory overflow)
- [ ] No migrations that lock production tables for extended periods
- [ ] No migrations without `down` method (unreversible)
- [ ] No `--force` without verifying correct database connection
- [ ] No migration after code swap that breaks old code during zero-downtime

---

# Production Readiness Checklist

- [ ] Production database backup before migration
- [ ] Migration tested on staging with production-like data volume
- [ ] Rollback migration tested end-to-end
- [ ] CI/CD pipeline runs migrations as separate step
- [ ] Migration execution time under 30 seconds
- [ ] Rollback plan documented and team informed

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: forward-compatible pattern, deployment ordering
- [ ] Security requirements satisfied: database credentials secured, --force scoped to CI
- [ ] Performance requirements satisfied: large table strategies, batch processing, timing
- [ ] Testing requirements satisfied: CI run, idempotency, rollback, --force verified
- [ ] Anti-pattern checks passed: no long locks, no data-only without batching, no --force misuse
- [ ] Production readiness verified: backup, staging test, rollback plan, CI integration

---

# Related References

- Zero-Downtime Migration Strategies (KU-020) -- advanced patterns for large schema changes
- Envoyer Zero-Downtime Deployments (KU-003) -- migration ordering in deployment flow
- Kubernetes for Laravel (KU-013) -- migration Job pattern
- Laravel Vapor (KU-015) -- migration in deploy hooks
