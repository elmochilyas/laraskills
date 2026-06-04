# Metadata

Domain: Security & Identity Engineering
Subdomain: Audit Logging
Knowledge Unit: Spatie laravel-activitylog
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Spatie `laravel-activitylog` is the standard package for logging model events in Laravel. It provides a `LogsActivity` trait that automatically logs `created`, `updated`, `deleted` events, along with a manual logging facade for custom events. Each log entry captures the subject (model), causer (user), event description, and properties (changes, context). The package integrates with Spatie's ecosystem conventions (trait-based, config-published, cache-friendly) and supports batch logging, event-driven logging, and custom loggers.

---

# Core Concepts

- **activity() Facade**: `activity()->log('Post created')` or `activity()->performedOn($post)->causedBy($user)->log('created')`.
- **LogsActivity Trait**: On Eloquent model, automatically logs create/update/delete events. Customize via `$logName`, `$logOnlyDirty`, `$logAttributes` properties.
- **Subject**: The model being acted upon (Polymorphic `subject_id`/`subject_type`).
- **Causer**: The user who performed the action (Polymorphic `causer_id`/`causer_type`).
- **Properties**: JSON column storing changes (before/after), custom context, and additional data.
- **Batch UUID**: Multiple log entries can share a batch UUID for grouping related activities.

---

# Mental Models

- **Activity Stream, Not Audit Trail**: `laravel-activitylog` is optimized for displaying activity feeds (UI) rather than for forensic auditing. The log is write-once, but the table is not append-only or immutable.
- **Opt-In Logging**: Nothing is logged by default. You opt-in via the `LogsActivity` trait or explicit `activity()->log()` calls.

---

# Patterns

## Automatic Model Logging Pattern
- **Implementation**: Add `LogsActivity` trait to the model. Configure `$logAttributes` to specify which fields to track.
- **Benefits**: Zero-effort logging for CRUD operations.
- **Tradeoffs**: Every model update logs — may log noise. Use `$logOnlyDirty = true` to log only changed attributes.

## Manual Activity Logging Pattern
- **Implementation**: `activity()->performedOn($model)->causedBy($user)->withProperties(['ip' => request()->ip()])->log('Custom event')`.
- **Benefits**: Full control over what is logged and the context.
- **Tradeoffs**: Must remember to log manually — easy to miss events.

## Batch Activity Pattern
- **Implementation**: `$batchUuid = Str::uuid(); activity()->batch($batchUuid)->log('Event 1'); activity()->batch($batchUuid)->log('Event 2')`.
- **Benefits**: Group related operations for UI display (e.g., "Updated 5 posts").
- **Tradeoffs**: Batch UUID must be tracked and passed around.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Auto-logging via trait vs manual logging | Simple CRUD vs complex events | Auto-logging for standard models; manual logging for business events (login, export, permission change) |
| Log all attributes vs only dirty | Storage vs completeness | `$logOnlyDirty = true` for most models — reduces storage 5x |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple trait-based integration for model events | Trait logs on every save — including internal updates | System processes that update models generate log noise. Use `$logAttributes` + `$logOnlyDirty` |
| Batch UUID groups related events | No built-in cross-model grouping | "User imported 100 contacts" requires custom event tracking |
| Properties column is flexible JSON | Cannot query properties efficiently | Filtering by "logged in from IP x.x.x.x" requires JSON parsing in the database |

---

# Performance Considerations

- Each log entry inserts a row into the `activity_log` table. High-traffic update operations create significant write load.
- The `activity_log` table grows fast. Implement a pruning schedule: `Activity::where('created_at', '<', now()->subMonths(3))->delete()`.
- JSON properties column is not indexable. For filtered queries, extract key properties into indexed columns.

---

# Production Considerations

- **Log Pruning**: Schedule a daily cleanup of old activity logs. Business requirements vary: 30 days for feeds, 1 year for compliance, 7 years for regulated industries.
- **Sensitive Data Masking**: `$logAttributes` should exclude sensitive fields (passwords, tokens). Use `$attributeRawValues` to log computed values instead of raw attributes.
- **Causer Resolution**: For queue jobs, the causer user is not available from `auth()->user()`. Pass causer explicitly: `activity()->causedBy($userId)`.

---

# Common Mistakes

- **Logging sensitive attributes**: `$logAttributes = ['password']` — password changes are logged in plaintext in the properties column. Never log sensitive fields.
- **Not pruning the activity log**: Table grows to millions of rows. Queries slow down. Backups bloat. Prune regularly.
- **Assuming logs are immutable**: `laravel-activitylog` does not enforce immutability. Rows can be updated or deleted by anyone with database write access.
- **Not excluding system events**: A `PostObserver` logs "post updated" when the post is touched by a scheduled command (e.g., publishing). Distinguish human vs system actions.

---

# Failure Modes

- **Rapid Log Insertion**: A loop creating 10,000 activity log entries in milliseconds. Transaction log grows. Mitigation: rate-limit logging or use batch inserts.
- **Missing Causer**: Log entry has `causer_id = null` because the action was performed by a queue job that didn't pass the user context. The log is less useful for auditing.
- **JSON Property Parse Error**: Manually constructed properties array with non-serializable objects causes JSON error during save. Validate properties before logging.

---

# Related Knowledge Units

- Prerequisites: Eloquent model events, Polymorphic relationships
- Related: Comprehensive audit logging (HMAC, diffs, alerts), Immutable audit hash chains
- Advanced Follow-up: Custom ActivityLogger implementation, Activity log for non-Eloquent events, Activity log aggregation and reporting

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
