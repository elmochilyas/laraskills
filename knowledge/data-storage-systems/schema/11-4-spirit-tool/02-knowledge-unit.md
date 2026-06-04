# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.4 Spirit (Physical Replication-based online schema change for MySQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Spirit is a newer online schema change tool (by CashApp/Block) that uses MySQL physical replication for schema changes. Creates a new replica with the desired schema, builds it via physical replication, then cuts over. Avoids trigger overhead (unlike pt-osc) and binlog requirement (unlike gh-ost). Suitable for RDS and Aurora.

---

# Core Concepts

- **Physical replication**: Spirit clones the original table via physical file copy (faster than row-by-row copy). Requires replica from backup.
- **No triggers**: Unlike pt-osc, Spirit doesn't add triggers. Performance impact during migration is lower.
- **Cutover**: Atomic table rename. Same as other online schema change tools.

---

# Patterns

**Spirit for RDS/Aurora**: Works well with RDS read replicas and Aurora clusters. No need for binlog retention or trigger cleanup.

**Spirit for large tables**: Physical copy is faster than row copy for multi-hundred-GB tables.

---

# Common Mistakes

**Spirit requires disk space**: Physical copy requires space for both original and shadow table. Ensure enough free storage.

---

# Related Knowledge Units

11.2 gh-ost | 11.3 pt-online-schema-change
## Ecosystem Usage

gh-ost for MySQL trigger-free migrations. pt-online-schema-change for trigger-based MySQL. pgroll for PostgreSQL view-based migrations. Spirit as gh-ost successor for MySQL 8.0+.

## Failure Modes

Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Performance Considerations

Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Production Considerations

Test full migration flow in staging. Monitor disk space during migration. Have rollback plan for every phase.

## Research Notes

Spirit provides faster row copying for MySQL 8.0+. pgroll view-based approach avoids trigger overhead. Industry trends toward application-level orchestration.

## Internal Mechanics

gh-ost creates ghost table, copies rows in chunks, streams binlog, atomically swaps. pt-osc uses triggers. pgroll creates PostgreSQL views.

## Architectural Decisions

gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Tradeoffs

Zero-downtime DDL requires complex tool setup. Reversible migrations only with PostgreSQL. Trigger-free requires binlog enabled.

## Mental Models

Online schema changes use shadow table strategy. Think of changing a tire while the car is moving.

