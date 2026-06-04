# Skill: Implement Comprehensive Audit Logging with HMAC Integrity Verification

## Purpose
Deploy compliance-grade audit logging with HMAC checksums for tamper detection, field-level diffs, correlation IDs for request tracing, configurable retention, and real-time alert rules.

## When To Use
- Compliance requirements (SOC2, HIPAA, GDPR, PCI DSS) requiring tamper-evident audit trails
- Forensic investigation requiring field-level diffs and correlation IDs
- Real-time security monitoring with alert rules
- Any scenario where Spatie Activitylog's immutability guarantees are insufficient

## When NOT To Use
- Simple activity feeds for UI display (use Spatie Activitylog)
- Projects without compliance or forensics requirements
- When HMAC key management overhead is not justified

## Prerequisites
- Compliance-grade audit package (BeakSoftware/laravel-audit-logging or similar)
- HMAC secret key stored securely (secrets manager, not .env)
- Correlation ID middleware for request tracing

## Workflow
1. Install compliance audit logging package
2. Generate and store HMAC secret key in secrets manager
3. Configure HMAC checksums on all audit log entries for tamper detection
4. Enable field-level diffs (before/after values for changed attributes)
5. Implement correlation ID middleware: attach unique ID to every request
6. Configure retention policies per log category (30d, 90d, 7y based on compliance)
7. Set up alert rules (5 failed logins in 1 min, admin role assignment)
8. Process alerts asynchronously via queue to avoid blocking requests
9. Test tamper detection: modify a log entry directly in DB, verify HMAC breaks

## Validation Checklist
- [ ] HMAC checksum on every log entry (tamper-evident)
- [ ] HMAC secret stored securely (secrets manager)
- [ ] Field-level diffs captured for changed attributes
- [ ] Correlation ID on every log entry for request tracing
- [ ] Retention policies configured per log category
- [ ] Alert rules defined for suspicious patterns
- [ ] Tamper detection verified (manual DB modification detected)
