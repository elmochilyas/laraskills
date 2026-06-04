# Spatie Activitylog v5

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Spatie Activitylog v5
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Spatie Activitylog v5 is the most widely used audit logging package for Laravel, providing comprehensive activity tracking for Eloquent models and custom events with a robust API, event-driven logging, and extensive customization. With over 4,000 GitHub stars, it is the de facto standard for activity logging in the Laravel ecosystem, supporting batch logging, causation tracking, and multi-log-level configurations.

---

## Core Concepts

- **`LogsActivity` trait** on Eloquent models enables automatic change logging with configurable log name
- **`Activitylogger` facade** provides a fluent API for manually logging custom events
- **Causer/Causee tracking** records both the responsible user (causer) and the affected subject (subject)
- **Batch UUIDs** group related activity entries into a single logical batch for transaction-level tracking
- **Event-driven logging** uses Laravel events to trigger activity logging decoupled from application code
- **Custom log names** allow categorization of activity for different domains or event types
- **Changes are stored as JSON** capturing before/after state with configurable attribute filtering

---

## Mental Models

- **The News Feed:** Activitylog records everything like a social media feed — who did what, to whom, and what changed — with timestamps and context.
- **The Audit Logbook:** Each entry is a logbook row: date, actor, action, subject, and details. Multiple logs (changelog, authentication log) are separate logbooks.
- **The Causation Chain:** A causer initiates an action that affects subjects, which in turn may trigger causers (e.g., admin deploys code → system processes → user data changes).

---

## Internal Mechanics

The `LogsActivity` trait hooks into Eloquent's `boot()` trait feature to register `created`, `updated`, `deleted` event listeners. On listener execution, the package captures the model's state, determines which attributes changed (configurable via `$logAttributes`), and creates an `Activity` model record. The `Causer` is resolved from the auth guard by default but can be overridden. Events like `\Spatie\Activitylog\Models\Activity` fire after logging, allowing chained reactions. Log names help categorize entries. The `ActivityLogger` class provides the underlying logging logic and can be extended.

---

## Patterns

**Automatic Model Logging Pattern:** Add `LogsActivity` trait to models and define `$logAttributes` for automatic CRUD logging. Benefit: Zero-code audit logging for models. Tradeoff: All changes are logged identically — custom events may be needed for detailed context.

**Custom Activity Logging Pattern:** Use `ActivityLogger` facade to log non-CRUD events with custom properties. Benefit: Full control over log content and structure. Tradeoff: Requires manual logging calls throughout application code.

**Batch Processing Pattern:** Use batch UUIDs to group multiple activity entries into logical transactions. Benefit: Reconstruct entire user action across multiple models. Tradeoff: Requires batch UUID management in application code.

---

## Architectural Decisions

Use Spatie Activitylog v5 for most Laravel applications requiring audit logging — it balances features, community support, and simplicity. For tamper-evident requirements, layer hash chaining on top. Choose the `LogsActivity` trait for model changes and `ActivityLogger` facade for custom events. Configure `$logOnlyDirty = true` to store only changed attributes, reducing storage. Use log names to separate different audit domains (financial, user, content) for easier querying.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Extensive community and documentation | Package weight with many optional features | Slightly larger dependency footprint |
| Model trait for zero-config logging | All model changes logged identically | May miss contextual information without custom events |
| Batch UUID for transaction grouping | Manual batch management required | Clearer correlation of composite actions |
| Event-driven extensibility | Events add execution overhead | Additional hooks for custom integrations |
| JSON attribute storage (flexible) | JSON query performance | Use MySQL 8+ JSON functions or PostgreSQL JSONB |

---

## Performance Considerations

Activity logging adds write overhead to every watched model operation. Always queue activity logging for production using the `queueRealTimeAudits()` configuration or a custom listener that dispatches jobs. The `activity_log` table grows rapidly — plan retention from day one. Index `causer_id`, `causer_type`, `subject_id`, `subject_type`, `created_at`, and `batch_uuid` for common query patterns. Use the `$logAttributes` whitelist to control which attribute changes are stored. Monitor activity table growth and adjust logging granularity based on compliance needs versus storage costs.

---

## Production Considerations

Set up a scheduled `activitylog:clean` command for pruning old entries. Configure different log names for different environments (production, staging) to distinguish activity sources. Create a dedicated database user for activity log queries to prevent accidental modification. Export activity data to cold storage before pruning for long-term retention compliance. Monitor activity logging queue health — a backlog indicates either excessive logging or insufficient queue workers. Implement rate limiting for high-volume activity events to prevent queue overload.

---

## Common Mistakes

**Logging all attributes on all models** — rapidly grows the activity table with irrelevant changes. Use `$logAttributes` whitelist to log only compliance-relevant fields.

**Not configuring the activity log table cleanup** — unbounded growth leads to performance degradation. Schedule `activitylog:clean` from the start.

**Forgetting to configure batch UUID propagation** — activity entries from a single user action become disconnected. Pass batch UUID through the request lifecycle.

---

## Failure Modes

- **Activity queue overflow:** Batch of high-volume activities fills the queue. Implement separate queue with backpressure handling.
- **Causer resolution failure:** Unauthenticated requests (API tokens, webhooks) produce null causers. Configure fallback causer for system actions.
- **Subject serialization errors:** Polymorphic subject relations fail when models are soft-deleted. Ensure subject serialization handles deleted models gracefully.

---

## Ecosystem Usage

Spatie Activitylog v5 is used across thousands of Laravel applications and is bundled with many commercial Laravel products. It integrates with Laravel Nova, Filament, and other admin panels. Laravel Horizon can monitor the activity queue. The package's batch UUID feature is used by e-commerce platforms to track order creation, payment processing, and shipping as a single user transaction. The package is considered the default choice for activity logging in the Laravel community.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Model Events
- Laravel Queue System
- Laravel Events and Listeners

### Related Topics
- Beakaudit Audit Logging (alternative for simpler needs)
- Laravel Audit Chain (tamper-evident extension)
- Custom Event Logging Patterns

### Advanced Follow-up Topics
- Activity Data Warehousing for Analytics
- Multi-Service Audit Consolidation
- Compliance Automation with Activity Evidence Collection

---

## Research Notes

Spatie Activitylog v5 improved significantly from v4 with better batch tracking, event-driven logging, and performance optimizations. The package's design philosophy prioritizes developer experience and framework convention, making it accessible while remaining extensible. The batch UUID feature, often overlooked, is critical for forensic analysis of composite operations in e-commerce and financial applications. The `$logOnlyDirty` configuration is essential for storage management in high-volume environments.
