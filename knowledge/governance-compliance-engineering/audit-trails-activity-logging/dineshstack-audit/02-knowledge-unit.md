# Dineshstack Audit

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Dineshstack Audit
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Dineshstack Audit is a Laravel audit package that provides structured, relational audit logging with support for model change tracking, custom audit events, and configurable audit data formatting. Its relational schema design enables direct SQL querying of audit records without JSON parsing, making it suitable for compliance reporting and forensic analysis.

---

## Core Concepts

- **Relational audit schema** stores changes in normalized tables rather than JSON columns for SQL-native querying
- **Model event tracking** captures `created`, `updated`, `deleted`, and `restored` events via a trait
- **Configurable field mapping** specifies which attributes to audit and how to present them
- **Custom audit events** capture non-CRUD actions with structured payloads
- **Audit grouping** correlates related changes into a single transaction group for atomicity analysis
- **Soft delete tracking** distinguishes between soft and hard deletes in audit records

---

## Mental Models

- **The Transaction Ledger:** Each audit record is a journal entry with debits (old values) and credits (new values), grouped by transaction ID for multi-entity changes.
- **The Normalized Database Snapshot:** Unlike JSON-blob auditors, this package stores audit data in normalized tables that any SQL analyst can query directly.
- **The Change Receipt:** Every state change produces a structured receipt with itemized lines for each modified attribute.

---

## Internal Mechanics

The package uses a dedicated migration creating `audits`, `audit_fields`, and `audit_transactions` tables. The `Auditable` trait registers Eloquent event listeners. On model change, the trait creates an `audit` record, then inserts individual `audit_field` rows for each modified attribute. Audit transactions correlate multiple model changes that occur within a single request (e.g., updating an invoice and its line items in one form submission). User resolution pulls from the authenticated guard with a configurable fallback. The package supports both immediate and queued audit writes.

---

## Patterns

**Normalized Audit Query Pattern:** Store audit fields as separate rows for direct SQL queries without JSON functions. Benefit: Simple SQL reporting, joins with other tables. Tradeoff: More rows per audit entry increases storage overhead and write latency.

**Transaction Grouping Pattern:** Group related model changes into audit transactions. Benefit: Reconstruct complete state changes across multiple models. Tradeoff: Requires explicit transaction context management.

**Custom Audit Event Pattern:** Log application-specific actions (login, export, API call) as custom audit events with structured payloads. Benefit: Complete activity coverage beyond model CRUD. Tradeoff: Requires manual event dispatch in application code.

---

## Architectural Decisions

Choose the relational schema approach when compliance analysts need direct SQL access to audit data without JSON functions. For simpler auditing needs where JSON storage is acceptable, other packages may be more storage-efficient. Use transaction grouping for applications with multi-model business transactions (orders with line items, invoices with payments). Avoid storing binary or large text fields in the normalized audit schema — store a reference or hash instead.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| SQL-native querying without JSON functions | More rows per audit event | Higher insert volume and storage for field-level records |
| Transaction grouping for multi-model changes | Additional complexity for transaction context | Better forensic reconstruction of composite operations |
| Direct relational joins for reporting | Normalized schema harder to migrate | Schema changes require migrations for audit tables |
| Clear attribute-level change granularity | Storage scales with number of audited fields per model | Field whitelist crucial for cost management |

---

## Performance Considerations

The normalized schema generates more inserts per audit event than JSON-blob approaches. Each modified attribute creates a separate `audit_field` row. Use bulk inserts for efficiency when queued. Index `audit_fields.audit_id` and `audit_fields.field_name` for common query patterns. Transaction grouping adds write amplification — only use when cross-model change correlation is a compliance requirement. Monitor `audits` and `audit_fields` table sizes independently for storage planning.

---

## Production Considerations

Schedule weekly integrity checks to verify audit data consistency — count mismatches between `audits` and `audit_fields` indicate data corruption. Implement database-level audit table partitioning by month for efficient pruning. Create a read-only database user and views for compliance officer access to audit data. Export normalized audit data to a data warehouse for long-term retention and analysis. Set up alerting for audit write failures.

---

## Common Mistakes

**Auditing too many fields with normalized storage** — each field is a separate row, causing exponential storage growth. Whitelist only compliance-relevant fields.

**Not queuing audit writes** — normalized inserts are slower than JSON blobs and block the request. Always queue for production.

**Missing transaction context for related model changes** — breaks the ability to reconstruct composite operations. Ensure transaction IDs are consistently passed.

---

## Failure Modes

- **Audit field table partition exhaustion:** Rapid insert volume fills partition faster than expected. Monitor partition usage and adjust retention accordingly.
- **Transaction context loss:** Queued jobs or CLI commands lack transaction grouping context. Provide explicit context for async operations.
- **Schema migration conflicts:** Audit table migrations conflict with custom application migrations. Version audit schemas independently.

---

## Ecosystem Usage

The Dineshstack Audit package serves Laravel applications where compliance teams require direct SQL access to audit data without specialized tooling. It is well-suited for enterprise environments with established SQL reporting infrastructure. The normalized schema fits data warehouse ETL pipelines that expect relational data rather than nested JSON.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Model Events
- Database Schema Design (Normalization)
- Laravel Queue System

### Related Topics
- Beakaudit Audit Logging (JSON-based alternative)
- Spatie Activitylog v5 (feature comparison)
- Data Warehousing for Audit Analytics

### Advanced Follow-up Topics
- Normalized vs. JSON Audit Schema Performance Benchmarks
- Audit Data ETL Pipeline Design
- Forensic Analysis of Audit Transactions

---

## Research Notes

The normalized audit schema trades write performance and storage efficiency for queryability. This is a deliberate design choice for environments where compliance querying is the primary audit use case. The transaction grouping feature is relatively unique among Laravel audit packages and addresses a real gap for applications with composite business transactions. The package's design aligns with data warehousing best practices where normalized fact tables enable flexible reporting.
