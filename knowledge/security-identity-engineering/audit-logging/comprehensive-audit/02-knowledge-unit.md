# Metadata

Domain: Security & Identity Engineering
Subdomain: Audit Logging
Knowledge Unit: Comprehensive audit logging (HMAC, diffs, alerts)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Beyond Spatie's activity feed, comprehensive audit logging packages (`BeakSoftware/laravel-audit-logging`, `dineshstack/laravel-audit`, `Williamug/audited`) provide HMAC checksums for integrity verification, field-level diffs of changes, request tracing via correlation IDs, configurable retention policies, and real-time alert rules. These packages are designed for compliance (SOC2, HIPAA, GDPR) and forensic investigation rather than UI activity feeds. HMAC checksums detect log tampering; field-level diffs show exactly what changed; retention policies auto-purge old logs; alert rules notify on suspicious patterns.

---

# Core Concepts

- **HMAC Checksum**: Each log entry's content is hashed with a secret key, and the hash is stored alongside. Any modification to the log entry changes the hash, making tampering detectable.
- **Field-Level Diff**: Before/after values for each changed attribute. `{'status': {'old': 'draft', 'new': 'published'}}`. Critical for understanding exactly what changed during an operation.
- **Request Tracing**: A unique correlation ID (`X-Request-ID` or `X-Trace-ID`) attached to all log entries created during a request. Traces the full request lifecycle across services.
- **Alert Rules**: Configurable conditions that trigger notifications: "5 failed logins in 1 minute" or "admin role assigned to new user". Evaluate asynchronously (queue).
- **Retention Policy**: Configurable per log table or category. `created_at < now() - 90 days` → archive or delete.

---

# Mental Models

- **Tamper-Evident Log**: HMAC checksums make log entries tamper-evident. An attacker who modifies the database cannot hide the modification — the HMACs won't match.
- **Forensic Audit vs Activity Feed**: Activity feeds (Spatie) show "what happened recently." Forensic logs show "exactly what happened, by whom, and what changed" — immutable, verifiable.

---

# Patterns

## HMAC Chain Verification Pattern
- **Purpose**: Detect log tampering by chaining HMACs.
- **Implementation**: Each entry's HMAC includes the previous entry's HMAC. Tampering with entry N breaks the chain from entry N+1 onward. Periodic verification job checks the entire chain.
- **Benefits**: Tampering at any position is detected by verifying any subsequent entry.
- **Tradeoffs**: Sequential dependency — concurrent log insertion requires careful sequencing (locks or monotonic IDs).

## Correlation ID Everywhere Pattern
- **Purpose**: Trace a request across logs, services, and background jobs.
- **Implementation**: Generate UUID at request entry (middleware), pass to all logged operations via context. Include in queue job payload for worker-side logging.
- **Benefits**: Single ID connects the HTTP request, the controller actions, the queue jobs, and the email sends.

## Risk-Based Alerting Pattern
- **Purpose**: Notify on suspicious activity without drowning in noise.
- **Implementation**: Define alert rules with thresholds: ">10 failed API auth from same IP in 5 min" → Slack/PagerDuty. Lower severity: "password changed" → email.
- **Benefits**: Real-time incident response.
- **Tradeoffs**: Alert fatigue if thresholds are too sensitive. Tuning takes iteration.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| HMAC per entry vs HMAC chain | Verification granularity | Chain for compliance (detect any tampering in any order). Per-entry for simpler implementation |
| Alert evaluation: sync vs async | Real-time vs performance | Async (queue) for all alerts — log writing should never block the request |
| Retention: soft-delete vs hard-delete | Recovery vs storage | Hard-delete with cold storage archive for compliance. Soft-delete for operational audit trails |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| HMAC checksums detect tampering | HMAC computation adds latency (~0.1ms per entry) | Negligible performance impact |
| Field-level diffs show exact changes | Storage doubles for each update log (before + after) | For high-traffic update operations, storage grows 2-3x. Compress or prune aggressively |
| Correlation IDs connect the request chain | Must propagate UUID through all system boundaries (HTTP, queue, email) | Missing correlation ID in a service breaks the chain |

---

# Performance Considerations

- Audit logging adds 1-5ms per logged operation (serialization + DB insert).
- HMAC computation: negligible (~0.05ms per entry with SHA-256).
- Field-level diffs: serializing before/after doubles the properties payload size. Gzip compression can reduce storage by 70%.
- Retention pruning should be a scheduled job, not a trigger-based operation.

---

# Production Considerations

- **HMAC Key Storage**: The HMAC signing key must be stored securely (Vault, APP_KEY, or KMS) and separate from the database. If an attacker gains DB write access, they cannot generate valid HMACs without the key.
- **Alert Fatigue**: Start with broad alert rules and tighten. Every alert should have a clear action (investigate, acknowledge, escalate).
- **Log Shipping**: For compliance, ship audit logs to a separate, append-only system (S3, Splunk, Elasticsearch) that the application cannot modify.
- **CI for Alert Rules**: Alert rules are business logic — test them in CI with sample data.

---

# Common Mistakes

- **Storing HMAC key in the same database as audit logs**: DB compromise exposes both the log data and the key that protects it. HMAC becomes useless.
- **Logging too much**: Every field change, every list view, every search. Storage costs explode. Log intent, not every interaction.
- **Not testing alert rules**: Alert rule is deployed, triggers 1000 false positives in first hour, team disables it. Test rules with historical data before enabling.
- **Synchronous alert evaluation**: Logging an operation triggers an alert check synchronously. A slow alert rule blocks the user's request. Queue alert evaluation.

---

# Failure Modes

- **HMAC Key Rotation Without Re-signing**: HMAC key changed. Existing log entries were signed with the old key. Verification fails for all historical entries. Re-sign all entries with the new key after rotation.
- **Alert Rule Flood**: A misconfigured rule (e.g., "trigger on every login") fires 10,000 alerts per hour. Team ignores alerts. Set a max alert rate per rule (cooldown period).
- **Correlation ID Collision**: Two parallel requests have the same correlation ID (UUID generation bug). Log entries from both requests become indistinguishable. Use UUID v4 with sufficient randomness.

---

# Related Knowledge Units

- Prerequisites: Spatie laravel-activitylog, HMAC/SHA-256 fundamentals
- Related: Immutable audit hash chains (SHA-256), Multi-tenant audit logging
- Advanced Follow-up: SIEM integration for Laravel audit streams, Real-time anomaly detection on audit events, Regulatory compliance (SOC2, HIPAA) audit trail requirements

## Ecosystem Usage
- **Spatie Laravel Activitylog**: The most widely installed audit logging package (48M+ installs); provides trait-based automatic model event logging, named logs for logical partitioning, and attribute change tracking.
- **Multi-tenant audit**: Audit logs synchronized across tenant contexts; separate audit database connections or named logs ensure tenant isolation while maintaining centralized audit querying.
- **Immutable audit chains**: Cryptographic hash chains link consecutive audit entries with hash pointers; tampering with historical entries breaks the chain, enabling detection of unauthorized audit modification.
- **Comprehensive audit logging**: Captures before/after state, request context (IP, user agent), causer identification, and timestamp. Dedicated audit storage separate from application data prevents data loss during application rollbacks.
- **Audit event filtering**: Configurable audit event types (created, updated, deleted, restored, forceDeleted); custom events via manual activity recording. Named log separation for billing, security, and content audit trails.
- **Audit data retention**: model:prune integration for automated audit data lifecycle management; configurable retention periods per audit namespace.
- **Audit integrations**: Filament admin panels display audit trails with formatted diffs; Nova resources integrate via custom fields; custom admin UIs use the Activity model directly.
- **Audit middleware alignment**: Audit packages integrate with Laravel's middleware pipeline, request lifecycle, and model events; causer resolution uses the auth guard chain.

## Research Notes
- Spatie Laravel Activitylog v5 (March 2026) introduced a dedicated ttribute_changes column separating model changes from user-provided properties — this enables cleaner queries and avoids JSON pollution in the properties column.
- Immutable audit chains compute a cumulative hash over consecutive audit entries — each entry includes a hash pointer to the previous entry, and tampering with any entry breaks the chain. This is additive security and does not prevent tampering but makes it detectable.
- Multi-tenant audit logging in shared-database setups requires tenant-aware causer resolution and per-tenant query scoping — without this, audit queries from one tenant can expose another tenant's activity data.
- Audit log retention requirements vary by regulation: GDPR requires erasure of personal data on request but may retain audit metadata; PCI DSS requires 12-month retention with 3-month immediate accessibility; SOC2 recommends 6-12 months.
- The Activitylog v5 buffer system collects activity objects in memory during a request and flushes them as a single bulk INSERT after the response — this improves throughput for write-heavy applications but means activities have no DB ID until flush completes.
- Community packages for comprehensive audit logging (dineshstack-audit, laravel-audit-chain) provide features beyond basic activity logging — field-level diffs, batch grouping, custom alert rules, and cryptographic audit chain verification.
- Audit log overload is a common failure mode — logging every Eloquent event including etrieved reads can produce millions of unnecessary audit entries; careful event type filtering is essential for production audit log management.
- The Activitylog package's eforeLogging hook enables cross-cutting enrichment (request ID, tenant context, IP address) without subclassing the logger — this is the recommended pattern for multi-tenant and distributed audit environments.

## Internal Mechanics
- **Spatie Activitylog v5 Resolution Flow**: Model event fires (updated, created, deleted) → LogsActivity trait's event listeners fire → the trait's handler builds an ActivityLog instance with causer, subject, event type, and attribute changes → the activity is passed to the configured LogActivityAction class → the action's save() method writes the activity to the ctivity_log table (or appends to the in-memory buffer if buffering is enabled).
- **Activity Buffer Flushing**: The ActivityBuffer singleton collects ActivityLog instances during the request lifecycle → lush() is called in the 	erminating middleware and as a PHP shutdown function (egister_shutdown_function) → buffered activities are bulk-INSERTed in a single query → buffer is cleared after flush.
- **Named Logs Implementation**: ctivity()->inLog('billing') sets the log_name column on the ActivityLog instance → querying named logs uses ActivityLog::query()->where('log_name', 'billing') — this is a simple column filter, not a separate table or partition.
- **Comprehensive Audit Diffs**: Attribute changes are computed by comparing $model->getOriginal() (database state before the change) with $model->getAttributes() (current state after the change) → only changed attributes are stored in the activity log → the diff format varies by package (Spatie v5 stores in ttribute_changes JSON column as {attributes: {...}, old: {...}}).
- **Causer Resolution**: The default causer is resolved from Auth::user() via CauserResolver → if no authenticated user (e.g., CLI command, queue worker without auth), the causer is null → Activity::defaultCauser() can override the causer for a specific code block in v5.
- **Immutable Audit Chain**: Each audit entry includes a hash_pointer column containing the hash of the previous entry → the hash is computed as hash('sha256',  .  . ) → verifying the chain re-computes each hash from the first entry to the last and confirms the chain is unbroken.
