# Iamfarhad Audit Log

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Iamfarhad Audit Log
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Iamfarhad Audit Log is a lightweight Laravel audit package that provides simple, trait-based audit logging with support for customizable event types and configurable data capture. Its minimal footprint makes it suitable for smaller applications that need basic compliance audit trails without the complexity of larger audit frameworks.

---

## Core Concepts

- **Simple trait-based auditing** attaches `Auditable` to models for automatic change capture with minimal configuration
- **Customizable event types** allow defining which Eloquent events trigger audit logging
- **Configurable attribute capture** specifies which fields to include in audit records
- **Clean separation** keeps audit data in a separate `audit_logs` table without modifying original model schemas
- **User context** is automatically captured from the authenticated user

---

## Mental Models

- **The Event Log:** Iamfarhad works like an application event log — every significant data change is recorded as a structured event entry.
- **The Black Box:** It passively records data changes without affecting application behavior, providing post-incident investigation capability.
- **The Audit Trail Marker:** Leaves breadcrumb trail of who changed what and when, focusing on essential change metadata.

---

## Internal Mechanics

The `Auditable` trait uses Eloquent's bootable trait feature to register event listeners for configured events (`saved`, `created`, `updated`, `deleted`). When an event fires, the trait captures the model's identification, the event type, changed attribute keys and values, and the authenticated user. Data is stored as a JSON payload in the `audit_logs` table. The package does not enforce attribute whitelist/blacklist by default — all model attributes are captured unless configured otherwise.

---

## Patterns

**Minimal Footprint Pattern:** Attach `Auditable` only to models handling sensitive data (users, payments, documents). Benefit: Keeps audit table small and manageable. Tradeoff: Non-sensitive model changes are not tracked.

**Custom Event Dispatch Pattern:** Use the package's manual logging method for non-CRUD events. Benefit: Captures application-specific actions. Tradeoff: Requires manual event dispatch calls throughout the codebase.

**Selective Attribute Capture Pattern:** Configure which attributes to include in audit records to balance detail with storage cost. Benefit: Reduces storage per audit entry. Tradeoff: Risk of missing important attribute changes if configuration is incomplete.

---

## Architectural Decisions

Use Iamfarhad Audit Log for projects that need basic audit capability without extensive configuration or external dependencies. For compliance-heavy applications with retention policies, tamper-evidence, or multi-backend storage, consider more feature-rich alternatives. The simple schema makes it easy to migrate to another audit package later if requirements grow.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Minimal configuration, quick setup | Limited advanced features (hash chains, multi-backend) | May outgrow package as compliance requirements evolve |
| Lightweight schema with minimal overhead | All attributes stored as JSON by default | Potential storage waste if many irrelevant attributes change |
| Clean separation of audit data | No built-in retention/pruning | Must implement custom pruning for large audit tables |

---

## Performance Considerations

The package stores audit data as JSON, which avoids the insert amplification of normalized schemas. Audit logging is synchronous by default — consider queuing for high-traffic applications. The `audit_logs` table requires indexes on `auditable_type`, `auditable_id`, `user_id`, and `created_at`. Without pruning configuration, the table grows unbounded — set up scheduled pruning from day one.

---

## Production Considerations

Implement custom pruning via a scheduled Artisan command. Add monitoring for audit_logs table size growth. Configure a read-only database user for compliance officer audit queries. Export audit data periodically to external storage for long-term compliance retention. Test audit logging during deployment verification to ensure no regression in audit capture.

---

## Common Mistakes

**Not configuring attribute filtering** — storing all model attributes including large text fields bloats audit records. Configure included attributes explicitly.

**Assuming synchronous audit logging is sufficient at scale** — under load, audit writes become a bottleneck. Add queue integration if not provided by the package.

**Delaying pruning configuration** — the audit table grows silently until storage becomes a problem. Set up retention pruning during initial deployment.

---

## Failure Modes

- **Audit table full:** No writes possible. Monitor storage and set up pruning.
- **User context missing for CLI/queue jobs:** Audit records have null user IDs. Configure a fallback system user.
- **JSON column query performance:** Reporting queries on JSON columns are slow. Add generated columns or a reporting view for common queries.

---

## Ecosystem Usage

The Iamfarhad Audit Log is used in smaller Laravel applications and prototypes that need straightforward audit capability. It serves as an entry point for teams beginning their compliance journey, providing enough audit trail for initial SOC 2 readiness before upgrading to more comprehensive solutions as requirements mature.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Model Events
- Laravel Scheduling (for pruning)
- Basic JSON Database Operations

### Related Topics
- Beakaudit Audit Logging (similar simple audit approach)
- Spatie Activitylog v5 (comparison for feature expansion)
- Custom Pruning Patterns

### Advanced Follow-up Topics
- Migrating from Simple Audit to Tamper-Evident Logs
- JSON Audit Query Optimization with Generated Columns
- Compliance Readiness: Basic to Advanced Audit

---

## Research Notes

This package represents the simplest end of the Laravel audit ecosystem spectrum. Its value is in providing immediate audit capability with minimal upfront investment. For teams adopting compliance practices incrementally, starting with this package and migrating to a more comprehensive solution as requirements grow is a pragmatic approach. The tradeoff is that migration requires data transformation and application code changes.
