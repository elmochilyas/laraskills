# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Audit & Logging
**Knowledge Unit:** Spatie laravel-activitylog
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Using activitylog for compliance-grade forensics**: Lacks cryptographic verification and immutability
- [ ] Prevent anti-pattern: No distinction between human and system actions**: Log noise from scheduled processes obscures meaningful events
- [ ] Prevent anti-pattern: Assuming JSON properties column is indexable**: Extracted attributes should use indexed columns for efficient filtering
- [ ] `LogsActivity` trait added to audited models
- [ ] Sensitive fields excluded from `$logAttributes`
- [ ] `$logOnlyDirty = true` for most models
- [ ] Pruning schedule configured (daily/weekly)
- [ ] Manual logging for business events (login, export, permission changes)
- [ ] Avoid: Mistake
- [ ] Avoid: Logging sensitive attributes
- [ ] Avoid: Not pruning the activity log

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Auto-logging via trait for standard CRUD models
- Manual logging for business events (login, export, permission change)
- Use named logs (`inLog('billing')`) for logical partitioning of activity streams
- For queue jobs, pass causer explicitly: `activity()->causedBy($userId)`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `LogsActivity` trait added to audited models
- [ ] - [ ] Sensitive fields excluded from `$logAttributes`
- [ ] - [ ] `$logOnlyDirty = true` for most models
- [ ] - [ ] Pruning schedule configured (daily/weekly)

# Performance Checklist
- Each log entry inserts a row into `activity_log` â€” high-traffic updates create write load
- The `activity_log` table grows fast â€” implement a pruning schedule
- JSON `properties` column is not indexable â€” extract key properties into indexed columns for filtering
- v5 buffer system collects activities in memory during request and bulk-INSERTs after response

# Security Checklist
- **Not Immutable**: `laravel-activitylog` does not enforce immutability. Rows can be updated or deleted by anyone with database write access.
- **Sensitive Data**: Never log sensitive attributes (passwords, tokens). The `properties` column could store plaintext if misconfigured.
- **Missing Causer**: Queue jobs without auth context produce entries with `causer_id = null` â€” less useful for auditing.

# Reliability Checklist
- [ ] Ensure: Spatie `laravel-activitylog` is the standard package for logging model events in...

# Testing Checklist
- [ ] `LogsActivity` trait added to audited models
- [ ] Sensitive fields excluded from `$logAttributes`
- [ ] `$logOnlyDirty = true` for most models
- [ ] Pruning schedule configured (daily/weekly)
- [ ] Manual logging for business events (login, export, permission changes)
- [ ] Causer explicitly set in queue jobs
- [ ] Avoid: Mistake
- [ ] Avoid: Logging sensitive attributes
- [ ] Avoid: Not pruning the activity log

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Using activitylog for compliance-grade forensics**: Lacks cryptographic verification and immutability
- [ ] Prevent: No distinction between human and system actions**: Log noise from scheduled processes obscures meaningful events
- [ ] Prevent: Assuming JSON properties column is indexable**: Extracted attributes should use indexed columns for efficient filtering
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Logging sensitive attributes
- [ ] Avoid mistake: Not pruning the activity log
- [ ] Avoid mistake: Assuming logs are immutable
- [ ] Avoid mistake: Not excluding system events

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Using activitylog for compliance-grade forensics**: Lacks cryptographic verification and immutability
- No distinction between human and system actions**: Log noise from scheduled processes obscures meaningful events
- Assuming JSON properties column is indexable**: Extracted attributes should use indexed columns for efficient filtering
## Skills
- Log Model Events and Business Activities with Spatie Activitylog


