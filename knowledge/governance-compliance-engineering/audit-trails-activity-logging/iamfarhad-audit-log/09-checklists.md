# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** audit-trails-activity-logging
**Knowledge Unit:** iamfarhad-audit-log
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] iamfarhad/laravel-audit-log installed with entity-specific audit table pattern
- [ ] One audit table per tracked model created via migration
- [ ] Source tracking configured to distinguish HTTP, CLI, and queued job origins
- [ ] Smart retention strategy selected: anonymize, archive, or delete
- [ ] Queue processing enabled for async audit log writes

---

# Architecture Checklist

- [ ] Entity-specific audit tables chosen over polymorphic single-table approach
- [ ] Each tracked model has a dedicated audit migration and model
- [ ] Source tracking context populated for each audit event
- [ ] Retention strategy per entity type defined in configuration
- [ ] Queue connection configured for async audit processing

---

# Implementation Checklist

- [ ] Audit migration created per entity with relevant columns
- [ ] `Auditable` trait applied and source context provider configured
- [ ] Retention strategy configured per model with cron schedule
- [ ] Queue job tested for FIFO ordering of audit events
- [ ] Source identification middleware registered (HTTP, CLI, queue)

---

# Performance Checklist

- [ ] Entity-specific audit tables queried with dedicated indexes
- [ ] Queue audit writes benchmarked against synchronous approach
- [ ] Retention strategy (anonymize/archive/delete) performance tested
- [ ] Source tracking does not add measurable latency to requests
- [ ] Archive retention process monitored for disk/storage capacity

---

# Security Checklist

- [ ] Source tracking distinguishes automated CLI/queue actions from user actions
- [ ] Anonymize retention strategy reviewed to ensure irreversible PII removal
- [ ] Archive retention strategy ensures archived data is encrypted at rest
- [ ] Delete retention strategy includes hard-delete verification
- [ ] Audit table access restricted via Policy (one Policy per entity)

---

# Reliability Checklist

- [ ] Queue worker configured with sufficient concurrency for audit jobs
- [ ] Retention cron monitored for successful execution
- [ ] Archive process retries on storage failure
- [ ] Source tracking fallback for undetermined origin

---

# Testing Checklist

- [ ] Audit entry created per entity CRUD operation tested
- [ ] Source tracking accuracy verified for HTTP, CLI, and queue contexts
- [ ] Retention anonymization tested with validation of irreversibility
- [ ] Archive retention tested with export verification
- [ ] Queue failure handling tested

---

# Maintainability Checklist

- [ ] Entity audit table schema documented per model
- [ ] Source tracking context maintained as cross-cutting concern
- [ ] Retention strategy overrides documented per entity
- [ ] Migration files named consistently per entity
- [ ] Related skills (Spatie Activitylog, Laravel Prunable Trait) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No duplicate audit entries across entity-specific and global audit tables
- [ ] No retention strategy ignoring legal holds
- [ ] No synchronous audit writes on hot request paths
- [ ] No source tracking considered for event-sourced audit entries
- [ ] No forgetting to add audit migration when creating a new auditable model

---

# Production Readiness Checklist

- [ ] Entity audit table sizes monitored and compared to retention expectations
- [ ] Queue backlog for audit jobs tracked
- [ ] Archive storage location verified for durability
- [ ] Retention cron reviewed for overlap with business hours
- [ ] Rollback script prepared for retention strategy changes

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: entity-specific tables, source tracking done
- [ ] Security requirements satisfied: anonymization irreversible, encryption for archive
- [ ] Performance requirements satisfied: indexes, queue async, retention monitored
- [ ] Testing requirements satisfied: source tracking, retention, queue tests pass
- [ ] Anti-pattern checks passed: no duplicates, no sync writes, legal hold respected
- [ ] Production readiness verified: monitoring, archive storage, rollback ready

---

# Related References

- GCE-AUD-001 (spatie-activitylog-v5) — Single-table polymorphic approach
- GCE-DRA-001 (laravel-prunable-trait) — Pruning patterns for data lifecycle
- GCE-DRA-003 (laravel-data-scrubber) — Anonymization strategies for retention
