# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** data-retention-anonymization
**Knowledge Unit:** laravel-prunable-trait
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `Prunable` trait applied to models requiring scheduled hard-deletion
- [ ] `prunable()` query scope defined to filter records for deletion by retention period
- [ ] `model:prune` Artisan command scheduled in kernel
- [ ] `MassPrunable` trait evaluated for bulk pruning scenarios
- [ ] Pruning vs `SoftDeletes` interaction reviewed

---

# Architecture Checklist

- [ ] `Prunable` trait chosen for hard-deletion retention enforcement per model
- [ ] `prunable()` method implements `created_at` + retention period filtering
- [ ] `MassPrunable` trait used for high-volume pruning without model events
- [ ] `SoftDeletes` relationship with `Prunable` understood: soft-deleted models can also be pruned
- [ ] Pruning chain invokes related model pruning via `pruning()` method override

---

# Implementation Checklist

- [ ] `Prunable` trait imported and applied to eligible models
- [ ] `prunable()` scope written with retention period logic (e.g., `where('created_at', '<', now()->subDays(90))`)
- [ ] `model:prune` command scheduled in `App\Console\Kernel` for daily run
- [ ] `pruning()` method override for cascading prune to related models
- [ ] Test/mock models created to verify pruning logic

---

# Performance Checklist

- [ ] Pruning query analyzed for full table scans; index on `created_at` confirmed
- [ ] Batch pruning chunk size tuned for production data volume
- [ ] `MassPrunable` performance compared to standard trait for bulk operations
- [ ] Pruning job scheduled during off-peak hours
- [ ] Pruning duration logged for trend tracking

---

# Security Checklist

- [ ] Hard-deleted records verified unrecoverable (no backup rollback of pruned data)
- [ ] Legal hold mechanism prevents pruning of records under hold
- [ ] Pruning scope does not accidentally delete records outside retention period
- [ ] `pruning()` method cascading does not delete unrelated data
- [ ] Pruning audit logged with record count and affected models

---

# Reliability Checklist

- [ ] Pruning failure does not prevent future pruning runs (idempotent)
- [ ] Legal hold bypass for pruning handled with explicit exclusion scope
- [ ] Pruning dry-run mode available for manual verification
- [ ] Cascading prune rollback not possible; tested thoroughly

---

# Testing Checklist

- [ ] Pruning query scope tested with fixed dates to verify boundary conditions
- [ ] Pruning executed in test environment and verified records deleted
- [ ] Legal hold exclusion tested: held records not pruned
- [ ] Cascading prune tested with related models
- [ ] Dry-run mode output matches actual prune results

---

# Maintainability Checklist

- [ ] Retention period documented per model in model docblock
- [ ] Pruning schedule documented in console kernel
- [ ] `pruning()` method cascading documented for data lifecycle
- [ ] Model retention policy linked to data classification tier
- [ ] Related skills (Retainable Contract, Data Scrubber, GDPR toolkits) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No pruning without retention policy documentation
- [ ] No hard-delete on records that should be anonymized instead
- [ ] No overlapping `prunable()` and `SoftDeletes` without documented interaction
- [ ] No pruning of records subject to active legal hold
- [ ] No forgetting to schedule `model:prune` in kernel

---

# Production Readiness Checklist

- [ ] Pruning dry-run executed before production activation
- [ ] Pruning log review cadence established
- [ ] Legal hold integration verified for pruned models
- [ ] Pruning duration alert set for unusually long runs
- [ ] Rollback plan: pruned data is not recoverable, verify retention scopes

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Prunable/MassPrunable applied per model
- [ ] Security requirements satisfied: legal hold respected, audit logged, no accidental delete
- [ ] Performance requirements satisfied: `created_at` index, off-peak schedule, chunk size
- [ ] Testing requirements satisfied: boundary conditions, legal hold, cascading tested
- [ ] Anti-pattern checks passed: no prune without policy, no soft-delete confusion, legal hold
- [ ] Production readiness verified: dry-run, log review, alerting, rollback considered

---

# Related References

- GCE-DRA-002 (retainable-contract-pattern) — Alternative for field-level retention/anonymization
- GCE-DRA-003 (laravel-data-scrubber) — Scrubbing strategies complement pruning
- GCE-GDP-001 (rylxes-laravel-gdpr) — Right to erasure integrates with pruning workflow
