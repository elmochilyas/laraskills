# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Spatie laravel-activitylog |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Spatie `laravel-activitylog` is the standard package for logging model events in Laravel. It provides a `LogsActivity` trait that automatically logs `created`, `updated`, `deleted` events, along with a manual logging facade for custom events. Each log entry captures the subject (model), causer (user), event description, and properties (changes, context). The package integrates with Spatie's ecosystem conventions (trait-based, config-published, cache-friendly) and supports batch logging, event-driven logging, and custom loggers.

---

## Core Concepts

- **activity() Facade**: `activity()->log('Post created')` or `activity()->performedOn($post)->causedBy($user)->log('created')`.
- **LogsActivity Trait**: On Eloquent model, automatically logs create/update/delete events. Customize via `$logName`, `$logOnlyDirty`, `$logAttributes` properties.
- **Subject**: The model being acted upon (Polymorphic `subject_id`/`subject_type`).
- **Causer**: The user who performed the action (Polymorphic `causer_id`/`causer_type`).
- **Properties**: JSON column storing changes (before/after), custom context, and additional data.
- **Batch UUID**: Multiple log entries can share a batch UUID for grouping related activities.

---

## When To Use

- Activity feeds and UI activity streams
- Automatic logging of Eloquent model CRUD operations
- Simple audit trails that do not require immutability or forensics-grade verification

## When NOT To Use

- Compliance-grade audit trails requiring cryptographic verification (use audit-chain)
- Append-only immutable logs (use dedicated immutable audit packages)
- When HMAC checksums or tamper-evident logs are required

---

## Best Practices

- **Use $logOnlyDirty = true**: Reduces storage 5x by logging only changed attributes.
- **Exclude Sensitive Fields**: `$logAttributes` should exclude passwords, tokens, and PII. Use `$attributeRawValues` for computed values.
- **Schedule Pruning**: `Activity::where('created_at', '<', now()->subMonths(3))->delete()`. Business requirements vary from 30 days (feeds) to 7 years (regulated).
- **Distinguish Human vs System**: In observers, tag whether an update was from a user action or a scheduled system process.

---

## Architecture Guidelines

- Auto-logging via trait for standard CRUD models
- Manual logging for business events (login, export, permission change)
- Use named logs (`inLog('billing')`) for logical partitioning of activity streams
- For queue jobs, pass causer explicitly: `activity()->causedBy($userId)`

---

## Performance Considerations

- Each log entry inserts a row into `activity_log` — high-traffic updates create write load
- The `activity_log` table grows fast — implement a pruning schedule
- JSON `properties` column is not indexable — extract key properties into indexed columns for filtering
- v5 buffer system collects activities in memory during request and bulk-INSERTs after response

---

## Security Considerations

- **Not Immutable**: `laravel-activitylog` does not enforce immutability. Rows can be updated or deleted by anyone with database write access.
- **Sensitive Data**: Never log sensitive attributes (passwords, tokens). The `properties` column could store plaintext if misconfigured.
- **Missing Causer**: Queue jobs without auth context produce entries with `causer_id = null` — less useful for auditing.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Logging sensitive attributes | Including all model fields | Passwords or tokens stored in plaintext in properties | Explicitly exclude sensitive fields via `$logAttributes` |
| Not pruning the activity log | Forgetting cleanup | Table grows to millions of rows; queries slow; backups bloat | Schedule regular pruning |
| Assuming logs are immutable | Expecting audit-grade protection | No tamper detection — anyone with DB access can modify logs | Use immutable audit chains for compliance |
| Not excluding system events | Logging all model saves | System processes generate noise | Tag human vs system actions |

---

## Anti-Patterns

- **Logging every Eloquent event including reads**: Produces millions of unnecessary entries
- **Storing PII in the properties column**: Creates GDPR compliance risk
- **Using activitylog as a compliance audit trail**: Lacks cryptographic verification and immutability

---

## Examples

**Automatic model logging:**
```php
use Spatie\Activitylog\Traits\LogsActivity;

class Post extends Model
{
    use LogsActivity;

    protected static $logAttributes = ['title', 'content', 'status'];
    protected static $logOnlyDirty = true;
    protected static $logName = 'posts';
}
```

**Manual activity logging:**
```php
activity()
    ->performedOn($post)
    ->causedBy($user)
    ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
    ->log('post_published');
```

**Batch activity:**
```php
$batchUuid = Str::uuid();
activity()->batch($batchUuid)->log('Import started');
// ... import operations ...
activity()->batch($batchUuid)->log('Import completed');
```

---

## Related Topics

- Comprehensive audit logging (HMAC, diffs, alerts)
- Immutable audit hash chains (SHA-256)
- Multi-tenant audit logging
- Eloquent model events
- Polymorphic relationships

---

## AI Agent Notes

- Spatie Activitylog is the entry point for audit logging in Laravel. If the project needs audit trails, start here.
- The package is NOT suitable for compliance-grade forensics or tamper-proof logging. Recommend layered approach: Activitylog for UI feeds + immutable chains for compliance.
- v5 (March 2026) introduced `attribute_changes` column — check which version is installed for feature support.

---

## Verification

- [ ] LogsActivity trait added to models requiring audit trails
- [ ] Sensitive fields excluded from $logAttributes
- [ ] $logOnlyDirty = true for most models
- [ ] Pruning schedule configured (daily/weekly)
- [ ] Manual logging for business events (login, export, permission changes)
- [ ] Causer explicitly set in queue jobs
- [ ] Named logs used for logical partitioning
- [ ] Index added to frequently queried columns (log_name, subject_type, subject_id, created_at)
