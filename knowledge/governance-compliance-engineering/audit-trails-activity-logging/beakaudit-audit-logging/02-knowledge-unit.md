# Beakaudit Audit Logging

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Beakaudit Audit Logging
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Beakaudit is a Laravel audit logging package that provides model-level change tracking with customizable event pruning, user attribution, and configurable retention policies. It enables compliance-driven auditing of Eloquent model changes with minimal configuration, making it suitable for applications requiring SOC 2 or GDPR-aligned change tracking.

---

## Core Concepts

- **Traits-based model auditing** attaches `Beakauditable` to Eloquent models for automatic change capture
- **Configurable event types** include `created`, `updated`, `deleted`, `restored`, and custom events
- **User context** is automatically captured from the authenticated user or configurable resolver
- **Customizable payload formatting** allows filtering which attributes are recorded and how
- **Retention policies** automatically prune audit records older than a configurable threshold
- **Event-based pruning** triggers on model events to batch-delete expired records

---

## Mental Models

- **The Black Box Recorder:** Beakaudit is a flight recorder for your data — every state change is logged with timestamp, actor, and before/after values, providing a complete playback of data history.
- **The Security Camera Feed:** Each model event is a camera frame; audit records are the continuous footage that can be reviewed for incident investigation.
- **The Journal Entry:** Every change is a time-stamped journal entry recording who did what, when, and what the data looked like before and after.

---

## Internal Mechanics

Beakaudit listens for Eloquent model events (`creating`, `updating`, `deleting`, `restoring`) via the `Beakauditable` trait. When an event fires, the package captures the model's original attributes, the new attributes, the authenticated user ID, and a timestamp. Data is serialized to a configurable JSON format and stored in the `audits` table. The pruning mechanism is triggered by a scheduled Artisan command or event-based frequency. The package supports Laravel's queue system for asynchronous audit writing to avoid blocking the request lifecycle.

---

## Patterns

**Focused Auditing Pattern:** Apply `Beakauditable` only to sensitive models (financial records, PII, health data) rather than all models. Benefit: Reduces storage growth and audit noise. Tradeoff: May miss compliance-relevant changes on non-obvious models.

**Custom Event Logging Pattern:** Extend Beakaudit's events with custom types for application-specific actions (e.g., user login, export, consent change). Benefit: Captures actions not tied to model CRUD. Tradeoff: Requires manual event creation and payload formatting.

**Queued Audit Pattern:** Configure Beakaudit to dispatch audit jobs to the queue. Benefit: Request latency is unaffected by audit writes. Tradeoff: Audits may be lost if queue fails without proper job retry configuration.

---

## Architectural Decisions

Use Beakaudit when you need automatic CRUD audit logging with minimal configuration. For tamper-evident audit chains (hash-linked audit records), pair with a package that provides chain validation. Choose database-driven pruning over event-based for predictable cleanup schedules. Configure the `audits` table with appropriate indexes on `auditable_type`, `auditable_id`, `user_id`, and `created_at` for query performance.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-configuration model auditing | Stores full attribute snapshots | Storage grows proportionally to change frequency |
| Automatic user attribution | Requires authenticated user context | System-level changes (queues, CLI) may have null user IDs |
| Configurable retention pruning | Pruning removes audit trail permanently | Legal hold must override pruning logic |
| Flexible payload formatting | JSON format not directly queryable in SQL | Requires database JSON functions for queries |

---

## Performance Considerations

Audit record inserts add latency to every watched model operation. Always queue audit writes for production workloads with high write throughput. The `audits` table grows rapidly — size is proportional to (change frequency × number of audited attributes). Index the `created_at` column for efficient pruning queries. Monitor audit table size and adjust retention TTL based on compliance requirements and storage costs. Lazy-loaded audit relationships on models can cause N+1 queries — eager-load or use a separate query service.

---

## Production Considerations

Implement a monitoring alert for audit table growth rate exceeding baseline. Create a read-only database user for audit queries to prevent accidental modification. Configure separate audit log storage (different disk or database) to prevent audit writes from impacting production database performance. Implement legal hold that excludes specific records from pruning. Schedule audit table maintenance during off-peak hours. Export and archive audit records before pruning to cold storage for long-term compliance.

---

## Common Mistakes

**Auditing all models indiscriminately** — leads to massive storage growth and performance degradation. Apply to sensitive models only.

**Not configuring pruning on day one** — the audit table grows unbounded, causing unexpected storage costs. Set retention policy during initial setup.

**Ignoring null user IDs for system processes** — queued jobs and CLI commands produce audits without user context. Provide a system user fallback in the user resolver.

---

## Failure Modes

- **Audit table partition exhaustion:** If partitioning by date, oldest partition fills and inserts fail. Automate partition management.
- **Queue backpressure on audit writes:** Slow audit processing causes queue backlog. Configure separate queue for audit jobs with appropriate workers.
- **Pruning failure:** Scheduled pruning job fails, leaving expired records. Monitor prune job success and alert on failure.

---

## Ecosystem Usage

Beakaudit is used in Laravel applications requiring lightweight audit logging without the complexity of event sourcing. It is commonly paired with Spatie Permission for complete audit trails of permission changes. The package fits well in compliance-conscious SaaS applications where model change tracking is a regulatory or contractual requirement.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Model Events
- Laravel Queue System
- Laravel Scheduling (for pruning)

### Related Topics
- Spatie Activitylog v5 (alternative audit logging package)
- Laravel Prunable Trait (native model pruning)
- Event Sourcing patterns (for advanced audit needs)

### Advanced Follow-up Topics
- Tamper-Evident Audit Chains
- Audit Data Archival and Compliance Storage
- Multi-Region Audit Log Replication

---

## Research Notes

Beakaudit's trait-based architecture follows the same pattern as many Laravel audit packages, making it interchangeable with similar solutions. The key differentiator is its focus on simplicity and minimal configuration over advanced features like hash chains or causal consistency. For regulated applications requiring tamper-evident logs, Beakaudit should be supplemented with additional integrity verification mechanisms.
