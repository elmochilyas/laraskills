# Bradietilley Audit Logs

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Bradietilley Audit Logs
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Bradietilley Audit Logs is a Laravel audit package that provides comprehensive, customizable activity tracking with support for event metadata, user impersonation tracking, and configurable storage backends. It enables applications to maintain detailed audit trails for compliance with GDPR, SOC 2, and internal governance policies.

---

## Core Concepts

- **Auditable trait** enables automatic change tracking on Eloquent models with configurable attribute whitelisting
- **Event metadata** captures IP address, user agent, session ID, and geographic context for each audit entry
- **Impersonation tracking** detects when an administrator is acting on behalf of another user
- **Custom events** support manual audit logging for non-CRUD actions
- **Configurable storage backends** support database, file, and external logging services
- **Blameable user resolution** handles authenticated, API, and system-user contexts

---

## Mental Models

- **The Witness Stand:** Each audit record is a sworn testimony — what happened, when, where (IP), who witnessed it (user), and who directed it (impersonator).
- **The Chain of Custody:** Every data change is recorded with its handler identification — you can trace who touched what data and through which interface.
- **The Forensic Log:** Like server access logs but at the data level — every read, write, and delete is a timestamped entry with forensic metadata.

---

## Internal Mechanics

The package hooks into Eloquent's model events through a trait. When a model is created, updated, or deleted, the trait's boot method registers event listeners that capture the before/after state. The package uses a dedicated `audit_logs` table with JSON columns for storing attribute changes and metadata. User resolution happens through a configurable callback that can pull from the auth guard, API tokens, or a defined system user. Storage backend adapters can be swapped to write to files, external APIs, or multiple destinations simultaneously.

---

## Patterns

**Attribute Whitelist Pattern:** Configure which model attributes are tracked via `$auditableAttributes` on the model. Benefit: Controls audit granularity and storage growth. Tradeoff: Changed whitelisted attributes may be missed when new sensitive fields are added.

**Multi-Backend Audit Pattern:** Write critical audits to the database and also stream a subset to external SIEM via a custom backend adapter. Benefit: Compliance with both internal and external audit requirements. Tradeoff: Increased operational complexity and potential for backend drift.

**Impersonation Audit Trail Pattern:** When administrators impersonate users, all audits capture both the original admin and the target user identity. Benefit: Clear audit trail for admin actions, satisfying compliance requirements for privileged access monitoring. Tradeoff: Additional context storage overhead.

---

## Architectural Decisions

Choose this package when you need rich contextual metadata (IP, user agent, impersonation) in audit records. For simple CRUD tracking without metadata, lighter packages may suffice. The multi-backend storage is valuable for defense-in-depth audit strategies. Use the attribute whitelist approach rather than blacklist to ensure sensitive fields are always captured. Evaluate storage backend performance characteristics — database storage is simplest but file-based may be cheaper for high-volume, low-retention audit needs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rich contextual metadata per audit entry | Larger storage per audit record | Increased storage cost for high-volume applications |
| Impersonation tracking out of the box | Configuration complexity for user resolution | Clearer audit trail for privileged operations |
| Multi-backend storage flexibility | Multiple points of failure for audit writing | Must monitor all backends independently |
| Configurable attribute whitelists | Audited attributes may drift from compliance requirements | Requires periodic audit configuration review |

---

## Performance Considerations

Metadata collection (IP, user agent) adds minimal overhead but scales with request volume. JSON columns for changes and metadata make SQL queries non-trivial — use generated columns or materialized views for common query patterns. Multi-backend writes increase audit operation latency if done synchronously — queue secondary backend writes. Storage growth is linear with attribute change frequency. Use database partitioning by date for efficient pruning of old audit records.

---

## Production Considerations

Configure audit log retention to align with regulatory requirements (e.g., GDPR's 3-year max for certain data, SOC 2's minimum 1 year). Implement weekly audit log export jobs to immutable storage (S3 Object Lock, Glacier). Create a dedicated monitoring dashboard for audit system health — write failures, queue backlogs, storage utilization. Test impersonation audit trails during compliance drills. Maintain a fallback audit logging path if the primary backend becomes unavailable.

---

## Common Mistakes

**Storing all metadata for all events** — IP and user agent for every audit entry dramatically increases storage. Configure metadata collection selectively per event type.

**Not planning for audit table growth** — without partitioning and pruning, the audit table becomes unmanageable. Design partition strategy during initial deployment.

**Ignoring timezone and clock skew** — timestamps from different servers may drift. Use UTC and synchronize server clocks with NTP.

---

## Failure Modes

- **Audit storage full:** No new audit entries can be written. Implement storage monitoring and alerting at 80% capacity.
- **Multi-backend inconsistency:** Primary backend succeeds but secondary fails silently. Implement periodic reconciliation between backends.
- **Impersonation context loss:** Impersonation flag is not carried through to queued audit jobs. Pass impersonation context explicitly to job payloads.

---

## Ecosystem Usage

The Bradietilley Audit Logs package is used in Laravel applications requiring detailed compliance audit trails with user impersonation tracking. It integrates with common Laravel admin panels (Filament, Nova) for audit log views and is often paired with Spatie Permission for complete user action traceability from permission assignment through data modification.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Events
- Laravel Queue System
- User Authentication Guards

### Related Topics
- Beakaudit Audit Logging (alternative simple audit package)
- Spatie Activitylog v5 (feature-comparison)
- SIEM Integration Patterns

### Advanced Follow-up Topics
- Audit Log Analysis and Anomaly Detection
- Compliance Automation for Audit Evidence Collection
- Immutable Storage Backends for Audit Integrity

---

## Research Notes

The impersonation tracking feature distinguishes Bradietilley Audit Logs from simpler audit packages, making it particularly suitable for environments with administrative user delegation (e.g., support teams acting on behalf of customers). The multi-backend architecture anticipates the needs of SOC 2 compliant applications that must retain audit logs in tamper-evident storage while also feeding real-time analysis pipelines.
