# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.12 pt-online-schema-change (trigger-based, FK support, Percona Toolkit)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

pt-online-schema-change (pt-osc) is Percona Toolkit's online schema change tool for MySQL. It uses database triggers to capture ongoing changes while the ghost table is being populated. Unlike gh-ost (binlog-based), pt-osc relies on triggers (INSERT/UPDATE/DELETE) to keep the ghost table synchronized. It supports FK constraints natively and has extensive throttling controls.

---

# Core Concepts

- **Trigger-based sync**: AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers on the original table propagate changes to the ghost table.
- **Chunked row copy**: Reads original table in chunks using a unique index (typically PRIMARY KEY) and inserts into the ghost table.
- **FK handling**: pt-osc can update FK constraints to reference the new table after swap. Use `--alter-foreign-keys-method` to control behavior.
- **Throttling**: Configurable via replication lag, thread count, chunk size, and sleep intervals.

---

# Mental Models

pt-osc is the traditional workhorse for MySQL online DDL. It's battle-tested across thousands of production deployments. The trigger-based approach is reliable but introduces the overhead and deadlock risks that triggers bring.

---

# Internal Mechanics

1. Creates the ghost table with the new schema.
2. Creates AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers on the original table.
3. Row-copy: selects rows from original in chunks, inserts into ghost table.
4. During copy, triggers keep the ghost table synchronized.
5. After copy completes: optionally validate row counts, swap tables via RENAME TABLE, drop triggers.
6. Handles FK constraints by updating constraint names to point to the new table.

---

# Patterns

**FK management**: Use `--alter-foreign-keys-method=auto` to let pt-osc handle FK updates. `rebuild_constraints` rebuilds all FK constraints pointing to the table. `drop_swap` drops the original table after swap and creates FK references.

**Chunk-size tuning**: Start with default (1000 rows). Increase for tables with larger rows (decrease chunk size). Decrease for tables under high write load.

**Replication throttle**: `--max-lag=5` pauses the migration if replication lag exceeds 5 seconds on any replica.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| pt-osc over gh-ost | FK-heavy schemas, established Percona tooling | Tables with high trigger sensitivity |
| Trigger approach | Simple ALTER, lower concurrency workloads | High-concurrency OLTP (triggers cause deadlocks) |
| Rebuild_constraints FK method | When FK column names change | When no FK changes needed |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Battle-tested, widely adopted | Trigger overhead on every write | Up to 10% write performance degradation during migration
Native FK support | Triggers can cause deadlocks under high concurrency | Must monitor for deadlock events
Configurable throttling | Complex configuration surface | Tuning requires understanding of workload patterns

---

# Performance Considerations

- Trigger overhead persists for the entire migration duration — every INSERT/UPDATE/DELETE on the original table runs three triggers (AFTER INSERT, AFTER UPDATE, AFTER DELETE).
- Chunk copying competes with application workload for IO and CPU.
- FK constraint rebuild during swap requires locking the referencing tables.
- pt-osc creates an implicit table-level lock briefly during the final RENAME.

---

# Production Considerations

- **Permissions**: Requires ALTER, CREATE, DELETE, DROP, INDEX, INSERT, LOCK TABLES, SELECT, TRIGGER on the database.
- **Disk space**: Ghost table uses approximately the same space as the original during migration.
- **Binlog amplification**: Trigger operations generate additional binlog events, increasing binlog storage and replication traffic.
- **Monitor trigger creation**: Creating triggers on a table with existing triggers requires dropping and recreating them (LOCK TABLES required).

---

# Common Mistakes

**Not indexing the ghost table correctly**: The ghost table inherits the original schema + ALTER, but if the original has no suitable unique index for chunking, pt-osc falls back to `--chunk-index` selection, which may be suboptimal.

**Trigger deadlock cascade**: Under high concurrency, trigger-lock interactions can escalate to deadlocks. This is the most common pt-osc failure mode.

**FK constraint rebuild fails**: If a referencing table is large, the FK rebuild during swap can take significant time and block writes.

---

# Failure Modes

- **Trigger storms**: A bulk insert into the original table triggers a storm of trigger executions, overwhelming the ghost table's write capacity.
- **Swap failure**: The final RENAME TABLE fails because the ghost table is not fully caught up (trigger sync is behind).
- **FK deadlock during swap**: The FK constraint rebuild blocks on a long-running transaction, extending the migration's write-blocking window.

---

# Ecosystem Usage

`daursu/laravel-zero-downtime-migration` supports pt-osc as an alternative driver. Percona Toolkit is a standard component in MySQL production environments. Many managed MySQL providers (RDS, Aurora) support pt-osc with some restrictions (SUPER privilege limitations).

---

# Related Knowledge Units

1.11 gh-ost tool | 1.13 Spirit tool | 1.10 Zero-downtime migration patterns | 1.26 MySQL ALGORITHM/LOCK options

---

# Research Notes

pt-osc remains relevant for MySQL schemas with complex FK relationships where gh-ost's binlog approach is impractical. The trigger-based approach works well for moderate concurrency workloads (< 1000 writes/second). For high-write OLTP tables, gh-ost's trigger-free architecture is generally preferred. The Percona Toolkit ecosystem provides extensive complementary tools (pt-query-digest, pt-table-checksum).
