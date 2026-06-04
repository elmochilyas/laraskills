# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Audit & Logging
**Knowledge Unit:** Comprehensive audit logging (HMAC, diffs, alerts)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Log shipping not configured**: Audit logs remain modifiable in the application database without append-only external storage
- [ ] Prevent anti-pattern: Correlation ID not propagated**: Log entries lack request tracing across HTTP, queue, and email boundaries
- [ ] Prevent anti-pattern: Field-level diffs on every model**: Storage doubles for models where diffs provide no audit value
- [ ] HMAC checksum on every log entry (tamper-evident)
- [ ] HMAC secret stored securely (secrets manager)
- [ ] Field-level diffs captured for changed attributes
- [ ] Correlation ID on every log entry for request tracing
- [ ] Retention policies configured per log category
- [ ] Avoid: Mistake
- [ ] Avoid: Storing HMAC key in the same database as audit logs
- [ ] Avoid: Logging too much

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Separate audit logging connection from application database â€” prevents data loss during rollbacks
- HMAC per entry for simple implementation; HMAC chain for compliance (detects any tampering)
- Correlation ID propagation through all system boundaries (HTTP, queue, email)
- Alert rule evaluation asynchronously via queue
- Hard-delete with cold storage archive for compliance; soft-delete for operational audit trails

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] HMAC checksum on every log entry (tamper-evident)
- [ ] - [ ] HMAC secret stored securely (secrets manager)
- [ ] - [ ] Field-level diffs captured for changed attributes
- [ ] - [ ] Correlation ID on every log entry for request tracing

# Performance Checklist
- Audit logging adds 1-5ms per logged operation (serialization + DB insert)
- HMAC computation: ~0.05ms per entry with SHA-256 â€” negligible
- Field-level diffs double the payload size â€” gzip compression reduces storage by ~70%
- Retention pruning should be a scheduled job, not a trigger-based operation

# Security Checklist
- **Tamper Evidence**: HMAC checksums make log entries tamper-evident. An attacker who modifies the database cannot hide the modification.
- **HMAC Key Separation**: The signing key must not be in the same database as audit logs. DB compromise exposes both data and the key.
- **Log Shipping**: For compliance, ship audit logs to a separate append-only system (S3, Splunk, Elasticsearch) that the application cannot modify.

# Reliability Checklist
- [ ] Ensure: Beyond Spatie's activity feed, comprehensive audit logging packages (`BeakSoftwa...

# Testing Checklist
- [ ] HMAC checksum on every log entry (tamper-evident)
- [ ] HMAC secret stored securely (secrets manager)
- [ ] Field-level diffs captured for changed attributes
- [ ] Correlation ID on every log entry for request tracing
- [ ] Retention policies configured per log category
- [ ] Alert rules defined for suspicious patterns
- [ ] Avoid: Mistake
- [ ] Avoid: Storing HMAC key in the same database as audit logs
- [ ] Avoid: Logging too much

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Log shipping not configured**: Audit logs remain modifiable in the application database without append-only external storage
- [ ] Prevent: Correlation ID not propagated**: Log entries lack request tracing across HTTP, queue, and email boundaries
- [ ] Prevent: Field-level diffs on every model**: Storage doubles for models where diffs provide no audit value
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Storing HMAC key in the same database as audit logs
- [ ] Avoid mistake: Logging too much
- [ ] Avoid mistake: Not testing alert rules
- [ ] Avoid mistake: Synchronous alert evaluation

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
- Log shipping not configured**: Audit logs remain modifiable in the application database without append-only external storage
- Correlation ID not propagated**: Log entries lack request tracing across HTTP, queue, and email boundaries
- Field-level diffs on every model**: Storage doubles for models where diffs provide no audit value
## Skills
- Implement Comprehensive Audit Logging with HMAC Integrity Verification


