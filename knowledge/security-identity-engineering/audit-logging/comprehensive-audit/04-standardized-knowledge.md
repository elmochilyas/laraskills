# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Comprehensive Audit Logging (HMAC, diffs, alerts) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Beyond Spatie's activity feed, comprehensive audit logging packages (`BeakSoftware/laravel-audit-logging`, `dineshstack/laravel-audit`, `Williamug/audited`) provide HMAC checksums for integrity verification, field-level diffs of changes, request tracing via correlation IDs, configurable retention policies, and real-time alert rules. These packages are designed for compliance (SOC2, HIPAA, GDPR) and forensic investigation rather than UI activity feeds. HMAC checksums detect log tampering; field-level diffs show exactly what changed; retention policies auto-purge old logs; alert rules notify on suspicious patterns.

---

## Core Concepts

- **HMAC Checksum**: Each log entry's content is hashed with a secret key, and the hash is stored alongside. Any modification to the log entry changes the hash, making tampering detectable.
- **Field-Level Diff**: Before/after values for each changed attribute. `{'status': {'old': 'draft', 'new': 'published'}}`. Critical for understanding exactly what changed.
- **Request Tracing**: A unique correlation ID (`X-Request-ID` or `X-Trace-ID`) attached to all log entries created during a request. Traces the full lifecycle across services.
- **Alert Rules**: Configurable conditions that trigger notifications: "5 failed logins in 1 minute" or "admin role assigned to new user". Evaluate asynchronously via queue.
- **Retention Policy**: Configurable per log table or category. `created_at < now() - 90 days` → archive or delete.

---

## When To Use

- Compliance requirements (SOC2, HIPAA, GDPR, PCI DSS) requiring tamper-evident audit trails
- Forensic investigation — field-level diffs and correlation IDs
- Real-time security monitoring with alert rules

## When NOT To Use

- Simple activity feeds for UI display (use Spatie Activitylog)
- Projects without compliance or forensics requirements
- When HMAC key management overhead is not justified

---

## Best Practices

- **HMAC Key Storage**: Store the HMAC signing key securely (Vault, APP_KEY, or KMS) separate from the database. DB compromise should not expose the signing key.
- **Async Alert Evaluation**: Queue all alert evaluations — log writing should never block the request.
- **Test Alert Rules**: Deploy alert rules with historical data to verify thresholds before enabling.
- **Log Intent, Not Every Interaction**: Field-level diffs double storage for updates. Compress or prune aggressively.

---

## Architecture Guidelines

- Separate audit logging connection from application database — prevents data loss during rollbacks
- HMAC per entry for simple implementation; HMAC chain for compliance (detects any tampering)
- Correlation ID propagation through all system boundaries (HTTP, queue, email)
- Alert rule evaluation asynchronously via queue
- Hard-delete with cold storage archive for compliance; soft-delete for operational audit trails

---

## Performance Considerations

- Audit logging adds 1-5ms per logged operation (serialization + DB insert)
- HMAC computation: ~0.05ms per entry with SHA-256 — negligible
- Field-level diffs double the payload size — gzip compression reduces storage by ~70%
- Retention pruning should be a scheduled job, not a trigger-based operation

---

## Security Considerations

- **Tamper Evidence**: HMAC checksums make log entries tamper-evident. An attacker who modifies the database cannot hide the modification.
- **HMAC Key Separation**: The signing key must not be in the same database as audit logs. DB compromise exposes both data and the key.
- **Log Shipping**: For compliance, ship audit logs to a separate append-only system (S3, Splunk, Elasticsearch) that the application cannot modify.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Storing HMAC key in the same database as audit logs | Convenience over security | DB compromise invalidates tamper detection | Store HMAC key in Vault, APP_KEY, or KMS |
| Logging too much | Logging every field change and list view | Storage costs explode | Log intent, not every interaction |
| Not testing alert rules | Deploying untested thresholds | False positive flood — team disables alerts | Test rules with historical data |
| Synchronous alert evaluation | Implementing alert check in request flow | Slow alert rules block user requests | Queue alert evaluation |

---

## Anti-Patterns

- **Using comprehensive audit packages for UI activity feeds**: Over-engineered for simple display
- **Storing HMAC keys in .env without rotation**: Key reuse across environments compromises security
- **No retention policy**: Audit tables grow unbounded, impacting performance and storage costs

---

## Examples

**Correlation ID middleware:**
```php
// app/Http/Middleware/AssignRequestId.php
public function handle(Request $request, Closure $next): Response
{
    $requestId = $request->header('X-Request-ID') ?? (string) Str::uuid();
    $request->attributes->set('correlation_id', $requestId);
    
    $response = $next($request);
    $response->headers->set('X-Request-ID', $requestId);
    
    return $response;
}
```

**Alert rule configuration:**
```php
// Example: configure alert rules in audit package config
'alert_rules' => [
    'brute_force' => [
        'condition' => 'failed_login > 5 WITHIN 1 MINUTE PER IP',
        'action' => 'notify:security@company.com',
        'cooldown' => 300, // seconds
    ],
],
```

---

## Related Topics

- Spatie laravel-activitylog
- Immutable audit hash chains (SHA-256)
- Multi-tenant audit logging
- HMAC/SHA-256 fundamentals

---

## AI Agent Notes

- Comprehensive audit logging is a step up from Activitylog — evaluate whether the project needs compliance-grade auditing.
- HMAC key management is the most critical and most commonly misconfigured aspect. Always recommend separate key storage.
- For SOC2/HIPAA/GDPR compliance, comprehensive audit logging is a prerequisite, not optional.

---

## Verification

- [ ] HMAC checksum implementation verified
- [ ] HMAC signing key stored separately from audit database
- [ ] Field-level diffs configured for relevant models
- [ ] Correlation ID propagation through all services
- [ ] Alert rules tested with historical data
- [ ] Retention policy configured and enforced
- [ ] Alert evaluation queued (not synchronous)
- [ ] Log shipping to append-only external storage (if compliance required)
