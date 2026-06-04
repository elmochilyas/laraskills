# Anti-Patterns: Comprehensive Audit Logging (HMAC, diffs, alerts)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Comprehensive Audit Logging (HMAC, diffs, alerts) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-CAL-01 | HMAC Key in Same Database as Audit Logs | Critical | Medium | Medium |
| AP-CAL-02 | Synchronous Alert Rule Evaluation | High | Medium | Medium |
| AP-CAL-03 | No Retention Policy | High | High | Low |
| AP-CAL-04 | Comprehensive Audit for UI Activity Feeds | Medium | High | Low |
| AP-CAL-05 | HMAC Key Without Rotation | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Log shipping not configured**: Audit logs remain modifiable in the application database without append-only external storage
- **Correlation ID not propagated**: Log entries lack request tracing across HTTP, queue, and email boundaries
- **Field-level diffs on every model**: Storage doubles for models where diffs provide no audit value

---

## 1. HMAC Key in Same Database as Audit Logs

### Category
Security · Architecture

### Description
Storing the HMAC signing key — used to verify audit log integrity — in the same database (or the same `.env` file) as the audit logs themselves, making tamper detection trivially bypassable.

### Why It Happens
Convenience drives this anti-pattern. The HMAC key is added to `.env` alongside other configuration values. The audit package reads it from there. It works in development, so it ships to production without considering the security model: a database compromise also exposes the key needed to forge valid HMACs.

### Warning Signs
- HMAC signing key stored in `.env` as `AUDIT_HMAC_KEY`
- The same database user that writes audit logs can read the HMAC key
- No external secrets manager (Vault, KMS) is used for the signing key
- HMAC verification is implemented but the key is in the application config

### Why Harmful
The HMAC checksum provides tamper detection: if an entry is modified, the HMAC no longer matches. But if the attacker also obtains the HMAC key (from the same database or `.env` they already have access to), they can re-compute valid HMACs for modified entries. The tamper detection becomes completely useless.

### Real-World Consequences
- Compliance auditor discovers HMAC key is stored alongside audit data — finding
- Attacker with database access modifies audit logs and re-computes valid HMACs
- Forensic investigation cannot trust HMAC verification results
- Emergency key rotation invalidates all existing HMAC checksums

### Preferred Alternative
Store the HMAC signing key in a secrets manager (Vault, AWS KMS, or encrypted at rest in a separate configuration source). The application reads the key at boot time from the secrets manager, not from the database or `.env`.

### Refactoring Strategy
1. Create a secure storage for the HMAC key (Vault, KMS, or encrypted config service)
2. Remove `AUDIT_HMAC_KEY` from `.env` and database-stored configuration
3. Update the audit package config to read from the secrets manager
4. Rotate the HMAC key: generate a new key, re-compute all HMACs for existing entries
5. Add access audit: log every HMAC key read operation
6. Verify HMAC verification still works after key migration

### Detection Checklist
- [ ] Where is the HMAC signing key stored?
- [ ] Can a database compromise expose the HMAC key?
- [ ] Is the HMAC key stored in `.env` or the application database?
- [ ] Is a secrets manager (Vault, KMS) used?
- [ ] Can the database user read the HMAC key location?

### Related Rules/Skills/Trees
- Store HMAC Signing Key Separately from Audit Database (05-rules.md)
- Configure Comprehensive Audit Logging (06-skills.md)
- Secrets Management for Audit Integrity (06-skills.md)

---

## 2. Synchronous Alert Rule Evaluation

### Category
Performance · Operations

### Description
Evaluating audit alert rules synchronously within the HTTP request lifecycle, causing request latency proportional to alert complexity and blocking user-facing operations.

### Why It Happens
Alert rules are configured alongside audit logging configuration. The default package implementation often evaluates rules immediately after logging. Developers do not recognize that alert evaluation — counting failed logins, checking thresholds — can take 50-500ms depending on rule complexity and data volume.

### Warning Signs
- Alert rule conditions include aggregate queries (COUNT, SUM) over time windows
- Request latency increases when users perform actions that trigger alerts
- Database shows `SELECT COUNT(*) FROM activity_log WHERE ...` during request processing
- Alert rules include multiple conditions evaluated in sequence

### Why Harmful
Synchronous alert evaluation means a slow alert rule directly impacts user experience. A "5 failed logins in 1 minute" rule must count recent entries — a query that slows as the log table grows. The user waits for this query to complete before receiving their response. As audit data grows, the problem gets progressively worse.

### Real-World Consequences
- Alert rule queries cause request timeouts during peak traffic
- Database load spikes from alert evaluations block critical application queries
- Users experience slow responses for common operations (login, update profile)
- Emergency alert rule disablement during production incident — losing security monitoring

### Preferred Alternative
Queue all alert rule evaluations. The log write returns immediately; the queue worker evaluates rules asynchronously and sends notifications as needed.

### Refactoring Strategy
1. Create a queued job: `EvaluateAlertRule` with the log entry ID and rule configuration
2. Move alert evaluation logic from the HTTP request lifecycle to the job's `handle()`
3. Configure the queue connection for alert evaluation (separate from application queue)
4. Set concurrency limits on the alert evaluation queue to prevent database overload
5. Add monitoring: alert evaluation queue backlog alerts
6. Test rule evaluation times in the queue worker under production data volume

### Detection Checklist
- [ ] Are alert rules evaluated in the same request as log writing?
- [ ] Do alert rules include aggregate queries over time windows?
- [ ] Is alert evaluation queued?
- [ ] Is there a dedicated queue for alert evaluation?
- [ ] Does request latency correlate with alert rule evaluation?

### Related Rules/Skills/Trees
- Queue All Alert Rule Evaluations (05-rules.md)
- Configure Comprehensive Audit Logging (06-skills.md)
- Laravel Queue Configuration for Audit Processing (06-skills.md)

---

## 3. No Retention Policy

### Category
Operations · Compliance

### Description
Deploying comprehensive audit logging without a retention policy, causing the audit log table to grow unbounded and eventually impact performance, storage costs, and compliance.

### Why It Happens
Audit logging packages typically have no default retention policy — they log everything forever. Developers focus on the logging implementation and forget operational cleanup. The audit table grows gradually, and the impact is not felt until the table reaches millions of rows.

### Warning Signs
- No pruning job or scheduled task references the audit log table
- Audit log table row count exceeds 10M rows
- Queries against audit log become slow despite indexing
- Database backup size grows disproportionately from the audit table
- No documented retention period in the compliance documentation

### Why Harmful
Unbounded audit tables degrade database performance, increase storage costs, and violate data minimization principles in GDPR and other regulations. Old audit data — past any possible investigation window — provides no value but carries liability.

### Real-World Consequences
- Database performance degrades as audit table grows
- Storage costs increase monthly for zero-value old data
- GDPR violation: holding personal data longer than necessary
- Emergency table truncation during performance incident — losing possibly needed data
- Compliance audit identifies lack of data retention policy as a finding

### Preferred Alternative
Configure a retention policy per event category. Archive to cold storage for compliance, delete for operational data.

### Refactoring Strategy
1. Define retention periods: forensic compliance (7 years), security alerts (90 days), operational logs (30 days)
2. Implement per-category pruning: category-based WHERE clause in the pruning job
3. Schedule the pruning job in `routes/console.php`: daily or weekly
4. For retention-required data, implement cold storage archiving before deletion
5. Add monitoring: alert if audit table exceeds expected size thresholds
6. Document retention policy in the compliance runbook

### Detection Checklist
- [ ] Is there a scheduled retention pruning job?
- [ ] What is the retention period for each audit category?
- [ ] How large is the audit log table? Is it growing unbounded?
- [ ] Is there a cold storage archiving process for retention-required data?
- [ ] Is the retention policy documented and compliance-reviewed?

### Related Rules/Skills/Trees
- Define and Enforce Audit Log Retention Policy (05-rules.md)
- Configure Comprehensive Audit Logging (06-skills.md)
- Data Retention and Archiving (06-skills.md)

---

## 4. Comprehensive Audit for UI Activity Feeds

### Category
Architecture · Cost

### Description
Using comprehensive audit logging packages (HMAC checksums, field-level diffs, alert rules) to power simple UI activity feeds that only need a list of recent actions with timestamps.

### Why It Happens
Teams choose the most feature-rich audit package upfront, assuming it covers future needs. "We'll need compliance logging eventually" drives the decision. The HMAC computation, field-level diffs, and alert rules add complexity and storage cost for a use case that needs none of them.

### Warning Signs
- UI activity feed shows a simple list: "User X did action Y at time Z"
- No compliance or regulatory requirements exist
- Field-level diffs are computed but never displayed or used
- HMAC checksums are computed but never verified
- Alert rules are configured but no one monitors the notifications

### Why Harmful
Comprehensive audit packages are 3-5x more storage-intensive (field diffs, HMAC hashes, correlation IDs) and more complex to operate (key management, alert configuration, log shipping) than a simple activity logger. This complexity and cost provides zero value for UI feeds.

### Real-World Consequences
- Storage costs 3-5x higher than necessary for the use case
- HMAC key management overhead without compliance need
- Operational complexity (alert configuration, log shipping) without benefit
- Developer time spent on HMAC verification features no one uses

### Preferred Alternative
Use Spatie Activitylog for UI activity feeds. Migrate to comprehensive audit logging only when compliance requirements (SOC2, HIPAA, GDPR) demand it.

### Refactoring Strategy
1. Replace comprehensive audit with Activitylog for UI-facing activity feeds
2. Keep compliance-scoped comprehensive audit for regulated events only
3. Remove HMAC computation, field diffs, and alert rules from non-regulated models
4. Migrate existing data: copy relevant entries to Activitylog table
5. Update the UI feed to query from Activitylog instead of comprehensive audit table
6. Document which events require compliance-grade logging

### Detection Checklist
- [ ] Are there regulatory compliance requirements?
- [ ] Are HMAC checksums verified by any process?
- [ ] Are field-level diffs displayed or queried?
- [ ] Are alert rules actively monitored?
- [ ] Is the UI feed powered by the comprehensive audit table?

### Related Rules/Skills/Trees
- Use Appropriate Audit Tool for Compliance Requirements (05-rules.md)
- Configure Spatie Activitylog (06-skills.md)
- Choose Audit Logging Approach (07-decision-trees.md)

---

## 5. HMAC Key Without Rotation

### Category
Security · Operations

### Description
Using the same HMAC signing key across environments (dev, staging, production) without periodic rotation, allowing a key compromise in a lower-security environment to affect the production audit trail integrity.

### Why It Happens
The HMAC key is generated once during setup and never revisited. Rotation is perceived as complex — re-computing all HMACs seems expensive. The key is shared in `.env` files across environments for consistency in development. Key rotation is not built into the deployment process.

### Warning Signs
- Same HMAC key in `.env.dev`, `.env.staging`, `.env.production`
- No key rotation date or rotation schedule documented
- HMAC key has been in use for >12 months
- No key rotation procedure exists in the operations runbook
- Contractor or former employee had access to the `.env` file

### Why Harmful
A compromised HMAC key allows an attacker to forge valid HMAC checksums on modified audit entries. If the key is shared across environments, a dev environment breach (common, lower security) compromises production audit integrity. Without rotation, a known-compromised key continues to be used.

### Real-World Consequences
- Dev environment breach allows attacker to compute production-valid HMACs
- Compliance requires key rotation every 90 days — non-compliance finding
- Emergency rotation required after employee departure who had key access
- All existing HMAC checksums become invalid after rotation — must re-compute

### Preferred Alternative
Use separate HMAC keys per environment. Implement automated key rotation every 90 days with a re-computation strategy.

### Refactoring Strategy
1. Generate unique HMAC keys per environment: dev, staging, production
2. Remove shared keys from version-controlled `.env` files
3. Implement key rotation automation: generate new key, re-compute HMACs, swap key
4. Document the rotation schedule and procedure
5. During rotation, keep the previous key for a transition period to re-verify old entries
6. Add key age monitoring: alert if key exceeds rotation threshold

### Detection Checklist
- [ ] Is the same HMAC key used in multiple environments?
- [ ] When was the HMAC key last rotated?
- [ ] Is there a documented key rotation schedule?
- [ ] Is the HMAC key in version control?
- [ ] Is there a key rotation automation script?

### Related Rules/Skills/Trees
- Rotate HMAC Signing Keys Periodically (05-rules.md)
- Configure Comprehensive Audit Logging (06-skills.md)
- Secrets Rotation and Key Management (06-skills.md)
