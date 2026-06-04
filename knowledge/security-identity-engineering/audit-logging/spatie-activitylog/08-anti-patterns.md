# Anti-Patterns: Spatie laravel-activitylog

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Spatie laravel-activitylog |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SAL-01 | Activitylog as Compliance Audit Trail | High | Medium | High |
| AP-SAL-02 | Logging Sensitive Attributes | Critical | High | Low |
| AP-SAL-03 | No Pruning Schedule | Medium | High | Low |
| AP-SAL-04 | Logging Every Eloquent Event Including Reads | Medium | Medium | Medium |
| AP-SAL-05 | Missing Causer in Queue Jobs | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Using activitylog for compliance-grade forensics**: Lacks cryptographic verification and immutability
- **No distinction between human and system actions**: Log noise from scheduled processes obscures meaningful events
- **Assuming JSON properties column is indexable**: Extracted attributes should use indexed columns for efficient filtering

---

## 1. Activitylog as Compliance Audit Trail

### Category
Architecture · Security

### Description
Using Spatie Activitylog as a compliance-grade audit trail (SOC2, HIPAA, GDPR) when it provides no cryptographic verification, immutability enforcement, or tamper detection.

### Why It Happens
Activitylog is the most visible audit/logging package in the Laravel ecosystem. Developers assume its log entries are trustworthy for compliance because they look like an audit trail. The package name "activitylog" sounds authoritative, and the compliance requirements are not fully understood until audit time.

### Warning Signs
- Activitylog is the only audit mechanism in a regulated application
- No HMAC checksums or hash chains on log entries
- Log entries can be freely deleted or updated via database connection
- Compliance requirements are documented but no cryptographic verification exists

### Why Harmful
Activitylog entries are mutable — anyone with database write access can modify or delete entries without detection. A compliance auditor discovering mutable audit trails may trigger a finding, leading to failed certification, fines, or required remediation under tight deadlines.

### Real-World Consequences
- SOC2/HIPAA auditor flags mutable audit trails as a finding
- Forensic investigation cannot prove log entries are untampered
- Emergency migration to comprehensive audit logging during audit preparation
- Legal defensibility of log entries is challenged

### Preferred Alternative
Use comprehensive audit logging packages (`BeakSoftware/laravel-audit-logging`, immutable hash chains) for compliance-grade audit trails. Use Activitylog for UI activity feeds and operational logging only.

### Refactoring Strategy
1. Keep Activitylog for UI activity feeds where mutability is acceptable
2. Implement complementary comprehensive audit logging for compliance-scoped events
3. Map which events need cryptographic verification vs. which are for display only
4. Configure HMAC checksums or hash chains on the compliance audit trail
5. Retain Activitylog for its batch UUIDs, causer tracking, and properties logging
6. Document the two-tier audit strategy in the compliance documentation

### Detection Checklist
- [ ] Are there regulatory compliance requirements (SOC2, HIPAA, GDPR)?
- [ ] Is Activitylog the only audit mechanism implemented?
- [ ] Can log entries be modified or deleted via the database?
- [ ] Are HMAC checksums or hash chains present on log entries?
- [ ] Is there any cryptographic verification of log integrity?

### Related Rules/Skills/Trees
- Use Appropriate Audit Tool for Compliance Requirements (05-rules.md)
- Configure Comprehensive Audit Logging (06-skills.md)
- Spatie Activitylog Configuration (06-skills.md)

---

## 2. Logging Sensitive Attributes

### Category
Security · Compliance

### Description
Including sensitive model attributes (passwords, tokens, PII) in the `$logAttributes` configuration, causing plaintext sensitive data to be stored in the `activity_log` table's `properties` JSON column.

### Why It Happens
The path of least resistance is to log all model attributes. Developers omit the `$logAttributes` configuration or use a catch-all value, not realizing that the `properties` column stores before/after values in plaintext. Password reset flows and token regeneration are common triggers.

### Warning Signs
- `$logAttributes` is not explicitly defined on the model
- Passwords, `remember_token`, or `api_token` appear in activity log `properties`
- `$logOnlyDirty` is `false`, logging unchanged values including sensitive fields
- Activity log database export includes plaintext credentials

### Why Harmful
Storing plaintext passwords, API tokens, or PII in the activity log creates a secondary data breach surface. The activity log often has less restrictive access controls than the source table. This violates GDPR data minimization principles and creates a compliance liability.

### Real-World Consequences
- Data breach via activity log export — passwords and tokens leaked
- GDPR fine for storing PII in unintended location without consent
- Security audit identifies plaintext credentials in log storage
- Emergency data sanitization of the entire activity_log table

### Preferred Alternative
Explicitly define `$logAttributes` excluding all sensitive fields. Use `$attributeRawValues` for computed safe values. Set `$logOnlyDirty = true` to reduce storage.

### Refactoring Strategy
1. Define `$logAttributes` on every logged model — list only non-sensitive fields
2. Set `$logOnlyDirty = true` on all models
3. Run a data sanitization migration: nullify or redact sensitive values in existing `properties` JSON
4. Add automated tests that verify sensitive fields are not logged
5. Configure `$attributeRawValues` for computed safe representations where needed
6. Review all models using `LogsActivity` trait for compliance

### Detection Checklist
- [ ] Is `$logAttributes` explicitly defined and does it exclude sensitive fields?
- [ ] Does the activity_log table contain passwords, tokens, or PII?
- [ ] Is `$logOnlyDirty` set to `true`?
- [ ] Are there automated tests verifying sensitive field exclusion?
- [ ] Is the activity_log database access as restricted as the source data?

### Related Rules/Skills/Trees
- Exclude Sensitive Attributes from Activity Logging (05-rules.md)
- Configure Spatie Activitylog (06-skills.md)
- Comprehensive Audit Logging Configuration (06-skills.md)

---

## 3. No Pruning Schedule

### Category
Performance · Operations

### Description
Deploying Activitylog without a scheduled pruning job, causing the `activity_log` table to grow unbounded, degrading query performance and increasing backup size and cost.

### Why It Happens
Activitylog works perfectly out of the box with zero configuration. Developers focus on feature implementation and forget operational maintenance. The table growth is gradual — 50K rows today, 500K next quarter — the performance impact creeps up unnoticed until it becomes critical.

### Warning Signs
- `activity_log` table exceeds 500K rows
- Queries on `activity_log` table take >1 second
- Database backup size has grown significantly without schema changes
- No scheduled task or cron entry references activity log pruning

### Why Harmful
An unbounded activity log table degrades database performance for all operations, not just activity queries. Backups take longer and cost more. Indexes become less effective. Maintenance operations (ALTER TABLE, OPTIMIZE) take longer and require more downtime windows.

### Real-World Consequences
- Database slow queries and timeouts during peak usage
- Backup window exceeds maintenance window
- Storage costs increase linearly with no business value from old entries
- Emergency truncation during production incident — losing possibly needed data

### Preferred Alternative
Implement a scheduled pruning command that deletes entries older than the retention period. Common retention: 30-90 days for UI feeds, longer only if business requirements mandate.

### Refactoring Strategy
1. Define retention policy per use case (activity feed: 30 days, operational: 90 days)
2. Create a scheduled task in `routes/console.php`: `Activity::where('created_at', '<', now()->subDays(90))->delete();`
3. Add the task to the scheduler: `php artisan schedule:run`
4. For very large tables, implement chunked deletion: `Activity::where(...)->each(fn($log) => $log->delete());` or use DB-level partitioning
5. Add monitoring: alert if table row count exceeds threshold
6. Document the retention policy in the operations runbook

### Detection Checklist
- [ ] Is there a scheduled task for activity log pruning?
- [ ] How old are the oldest entries in the activity_log table?
- [ ] What is the row count of the activity_log table?
- [ ] Is there a documented retention policy for activity logs?
- [ ] Is the activity_log table growing month-over-month?

### Related Rules/Skills/Trees
- Schedule Activity Log Pruning (05-rules.md)
- Configure Spatie Activitylog (06-skills.md)
- Database Maintenance Scheduling (06-skills.md)

---

## 4. Logging Every Eloquent Event Including Reads

### Category
Performance · Architecture

### Description
Configuring Activitylog to log every Eloquent model event including read/view operations, producing millions of unnecessary log entries that degrade performance and fill storage with noise.

### Why It Happens
Activitylog's trait-based auto-logging is so easy that developers sometimes extend it to non-CRUD events like `retrieved` (read). The intent is often "complete audit trails" without recognizing that read events are orders of magnitude more frequent than write events.

### Warning Signs
- `activity_log` has entries with event type `retrieved`
- Log entries per day exceeds 100K for a moderate-traffic application
- Most log entries have no meaningful state change (before = after)
- The activity_log table is the largest table in the database by row count

### Why Harmful
Read events produce millions of log entries with no audit value — reads cannot modify data. This creates write contention on the activity log table, fills storage, slows down queries, and buries meaningful audit events in noise. The log becomes useless for its intended purpose.

### Real-World Consequences
- Activity log is too noisy to query for meaningful events
- Storage costs explode for zero-value data
- Write throughput on activity_log table causes database bottlenecks
- Meaningful audit events (permission changes, sensitive data edits) are buried
- Backups become bloated with log noise

### Preferred Alternative
Only log mutating events (created, updated, deleted) and manually log meaningful business events. Use `$logOnlyDirty = true` to avoid logging no-change events.

### Refactoring Strategy
1. Remove any trait or observer that logs `retrieved` events
2. Set `$logOnlyDirty = true` on all models
3. Define business events manually: `activity()->log('Export completed')`
4. Query meaningful events via named logs: `activity()->inLog('billing')->get()`
5. Archive or delete existing read-event noise from the table
6. Add query pattern to distinguish meaningful events from noise

### Detection Checklist
- [ ] Are read events (`retrieved`) being logged?
- [ ] Is `$logOnlyDirty` set to `true` across models?
- [ ] What is the daily log entry volume? Is it proportional to write operations?
- [ ] Do most entries show before-are-after values?
- [ ] Are named logs used to separate event types?

### Related Rules/Skills/Trees
- Log Only Mutating Events, Not Reads (05-rules.md)
- Configure Spatie Activitylog (06-skills.md)
- Activity Logging Best Practices (06-skills.md)

---

## 5. Missing Causer in Queue Jobs

### Category
Auditing · Operations

### Description
Queue jobs logging activity without explicitly setting the causer, resulting in audit entries with `causer_id = null` that cannot be attributed to a specific user.

### Why It Happens
Inside a web request, Activitylog automatically captures the authenticated user as the causer. In queue jobs, there is no request context and no authenticated user. Developers assume causer auto-capture works in all contexts, missing that queue execution has no auth session.

### Warning Signs
- Activity log entries from queue jobs have `causer_id = null`
- Job logs show actions without identifiable user
- Audit trail has gaps where actions cannot be attributed
- Queue job logging does not explicitly pass `->causedBy()`

### Why Harmful
Untracked causers create audit gaps. A forensic investigation cannot determine who triggered a queued action — was it the user who dispatched the job, or the admin, or a system process? This undermines the entire purpose of audit logging for actions triggered asynchronously.

### Real-World Consequences
- Failed audit: "Who approved this export?" cannot be answered
- Security incident investigation cannot trace unauthorized actions to a user
- Compliance finding: audit trail has un-attributable entries
- Manual grep of application logs required to correlate job dispatch with causer

### Preferred Alternative
In every queue job that logs activity, explicitly pass the causer via `->causedBy($userId)`. For system actions, use a dedicated system user account.

### Refactoring Strategy
1. Identify all queue jobs that call `activity()->log()`
2. Add the causer: `->causedBy($this->user ?? $this->tenant->owner)`
3. For jobs dispatched from web requests, serialize the user ID in the job payload
4. Create a system user for non-attributable actions: `System::id = 0`
5. Add a default causer middleware to the queue worker for consistent attribution
6. Write tests that verify causer is set in all job log entries

### Detection Checklist
- [ ] Do queue job log entries have `causer_id = null`?
- [ ] Is `->causedBy()` called in every job that logs activity?
- [ ] Is the user ID serialized in the job payload?
- [ ] Are system actions attributed to a dedicated system user?
- [ ] Are there tests verifying causer attribution in queued actions?

### Related Rules/Skills/Trees
- Always Pass Causer in Queue Job Logging (05-rules.md)
- Configure Spatie Activitylog (06-skills.md)
- Tenant-Aware Queue Context (06-skills.md)
